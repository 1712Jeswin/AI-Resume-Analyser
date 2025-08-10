import React, {type FormEvent, useState} from 'react';
import NavBar from "~/Components/NavBar";
import FileUploader from "~/Components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/format";
// @ts-ignore
import {prepareInstructions} from "../../Constants";

const Upload = () => {
    const {auth, isLoading, fs, ai, kv} = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statuesText, setStatuesText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyse = async ({companyName, jobTitle, jobDescription, file}: {
        companyName: string,
        jobTitle: string,
        jobDescription: string,
        file: File
    }) => {
        setIsProcessing(true);
        setStatuesText("Uploading the file...");
        const uploadedFile = await fs.upload([file]);
        if (!uploadedFile) return setStatuesText("Error: Failed to upload File");

        setStatuesText('Converting to image... ')
        const imageFile = await convertPdfToImage(file);
        if (!imageFile.file) return setStatuesText("Error: Failed to convert PDF to image...");

        setStatuesText("Uploading the image...");
        const uploadedImage = await fs.upload([imageFile.file]);
        if (!uploadedFile) return setStatuesText("Error: Failed to upload Image");

        setStatuesText("Preparing Data")

        const uuid = generateUUID()
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage,
            companyName, jobTitle, jobDescription,
            feedback: ''
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        setStatuesText('Analysing...')

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({jobTitle, jobDescription})
        );
        if (!feedback) return setStatuesText('Failed to Analyse resume');

        const feedbackText = typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText);
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        setStatuesText('Analysing complete redirecting...')
    }


    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget.closest("form");
        if (!form) return;
        const formData = new FormData(form);
        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        const jobDescription = formData.get("job-description") as string;

        if (!file) return

        handleAnalyse({companyName, jobTitle, jobDescription, file})

    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover py-12">
            <NavBar/>
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart Feedback for your future job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statuesText}</h2>
                            <img src="/images/resume-scan.gif" alt="resume image" className="w-full"/>
                        </>
                    ) : (
                        <h2>Drop your Resume for an ATS score and improvement tips...</h2>
                    )}
                    {
                        !isProcessing && (
                            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company Name</label>
                                    <input type="text" name="company-name" placeholder='Company Name' id="company-name"/>
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-title">Job Title</label>
                                    <input type="text" name="job-title" placeholder='Job Title' id='job-title'/>
                                </div>
                                <div className="form-div">
                                    <label htmlFor="description">Description</label>
                                    <textarea rows={5} name="job-description" placeholder='Description' id='description'/>
                                </div>
                                <div className="form-div">
                                    <label htmlFor="uploader">Upload Resume</label>
                                    <FileUploader onFileSelect={handleFileSelect}/>
                                </div>
                                <button className="primary-button" type="submit">
                                    Analyse Resume
                                </button>
                            </form>
                        )
                    }
                </div>
            </section>
        </main>

    );
};

export default Upload;