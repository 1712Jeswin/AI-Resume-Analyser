// app/routes/upload.tsx
import React, { type FormEvent, useState } from "react";
import NavBar from "~/Components/NavBar";
import FileUploader from "~/Components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate, Link } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/format";
// @ts-ignore
import { prepareInstructions } from "../../Constants";

// Firestore (client SDK)
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/client";

// Firebase Auth (anonymous sign-in)
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    type Auth,
} from "firebase/auth";

// Helper: ensure we have an authenticated user (anonymous if necessary)
async function ensureAuth(auth: Auth, timeoutMs = 7000): Promise<void> {
    // Already signed in
    if (auth.currentUser) return;

    // Kick off anonymous sign-in if not already happening
    try {
        await signInAnonymously(auth);
    } catch (e) {
        // If another sign-in is already in-flight, we'll still wait for onAuthStateChanged
        console.warn("signInAnonymously threw (may already be in-flight):", e);
    }

    // Wait for auth state to report a user or time out
    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            unsubscribe();
            reject(new Error("Auth timeout: anonymous sign-in did not complete"));
        }, timeoutMs);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                clearTimeout(timer);
                unsubscribe();
                resolve();
            }
        });
    });
}

const Upload = () => {
    const { auth: puterAuth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const safeSetStatusText = (v: string) => {
        if (typeof setStatusText === "function") setStatusText(v);
        else console.warn("setStatusText not callable:", setStatusText);
    };

    const handleFileSelect = (f: File | null) => setFile(f);

    const handleAnalyse = async ({
                                     companyName,
                                     jobTitle,
                                     jobDescription,
                                     file,
                                 }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        setIsProcessing(true);
        safeSetStatusText("Uploading the file...");

        const uploadedFile = await fs.upload([file]);
        if (!uploadedFile) {
            setIsProcessing(false);
            return safeSetStatusText("Error: Failed to upload File");
        }

        safeSetStatusText("Converting to image...");
        const imageResult = await convertPdfToImage(file);
        if (imageResult.error) {
            console.error(imageResult.error);
            setIsProcessing(false);
            return safeSetStatusText(String(imageResult.error));
        }
        if (!imageResult.file) {
            setIsProcessing(false);
            return safeSetStatusText("Error: No image file produced from PDF.");
        }

        safeSetStatusText("Uploading the image...");
        const uploadedImage = await fs.upload([imageResult.file]);
        if (!uploadedImage) {
            setIsProcessing(false);
            return safeSetStatusText("Error: Failed to upload Image");
        }

        safeSetStatusText("Preparing Data");

        const uuid = generateUUID();
        const data: any = {
            id: uuid,
            resumePath: (uploadedFile as any)?.path ?? uploadedFile,
            imagePath: (uploadedImage as any)?.path ?? uploadedImage,
            companyName,
            jobTitle,
            jobDescription,
            feedback: "",
        };

        try {
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
        } catch (e) {
            console.warn("kv.set failed:", e);
        }

        safeSetStatusText("Analysing...");

        const feedback = await ai.feedback(
            (uploadedFile as any).path,
            prepareInstructions({ jobTitle, jobDescription })
        );
        if (!feedback) {
            setIsProcessing(false);
            return safeSetStatusText("Failed to Analyse resume");
        }

        const feedbackText =
            typeof feedback.message.content === "string"
                ? feedback.message.content
                : feedback.message.content?.[0]?.text ?? "";

        try {
            data.feedback = JSON.parse(feedbackText);
        } catch (err) {
            console.error("Failed to parse feedback JSON:", err);
            data.feedback = { raw: feedbackText };
        }

        try {
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
        } catch (e) {
            console.warn("kv.set update failed:", e);
        }

        safeSetStatusText("Analysing complete — saving feedback...");

        // --------- NEW: Ensure Firebase Auth is ready before Firestore write
        const auth = getAuth();
        try {
            await ensureAuth(auth); // waits for anonymous user if needed
        } catch (e) {
            console.error("Auth not ready; skipping Firestore save:", e);
            safeSetStatusText(
                "Analysis saved locally — could not authenticate to Firestore."
            );
            setIsProcessing(false);
            return navigate(`/resume/${uuid}`);
        }

        // Save to Firestore (requires rules to allow authenticated 'create')
        try {
            let savedBy: string | null = null;
            try {
                // Include your app's user id if available (optional)
                if (puterAuth?.getUser && typeof puterAuth.getUser === "function") {
                    const u = await puterAuth.getUser();
                    savedBy = (u as any)?.id ?? (u as any)?.uid ?? null;
                }
            } catch {
                // ignore; savedBy remains null
            }

            const docRef = await addDoc(collection(db, "resumeFeedback"), {
                ...data,
                analysisTimestamp: serverTimestamp(),
                savedBy: savedBy ?? auth.currentUser?.uid ?? null,
            });

            console.log("Saved feedback to Firestore with id:", docRef.id);
            safeSetStatusText("Analysis saved. Redirecting...");
        } catch (err) {
            console.error("Firestore save failed:", err);
            safeSetStatusText(
                "Analysis saved locally — failed to save to Firestore (permissions)."
            );
        } finally {
            setIsProcessing(false);
            navigate(`/resume/${uuid}`);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget.closest("form");
        if (!form) return;
        const formData = new FormData(form);
        const companyName = (formData.get("company-name") as string) ?? "";
        const jobTitle = (formData.get("job-title") as string) ?? "";
        const jobDescription = (formData.get("job-description") as string) ?? "";

        if (!file) return;

        handleAnalyse({ companyName, jobTitle, jobDescription, file });
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover py-12">
            <NavBar />
            <nav className="resume-nav">
                <Link to={"/"} className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
                </Link>
            </nav>
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart Feedback for your future job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img
                                src="/images/resume-scan.gif"
                                alt="resume image"
                                className="w-full"
                            />
                        </>
                    ) : (
                        <h2>Drop your Resume for an ATS score and improvement tips...</h2>
                    )}
                    {!isProcessing && (
                        <form
                            id="upload-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 mt-8"
                        >
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input
                                    type="text"
                                    name="company-name"
                                    placeholder="Company Name"
                                    id="company-name"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input
                                    type="text"
                                    name="job-title"
                                    placeholder="Job Title"
                                    id="job-title"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    rows={5}
                                    name="job-description"
                                    placeholder="Description"
                                    id="description"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className="primary-button" type="submit">
                                Analyse Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;
