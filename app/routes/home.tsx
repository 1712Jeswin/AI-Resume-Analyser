import NavBar from "~/Components/NavBar";
import type {Route} from "./+types/home";
import ResumeCard from "~/Components/ResumeCard";

import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type React from "react";
import { FaTrashAlt } from "react-icons/fa";
import { TbTrashOff } from "react-icons/tb";



export function meta({}: Route.MetaArgs) {
    return [
        {title: "Resumind"},
        {name: "description", content: "Smart Feedback for your dream job!"},
    ];
}

export default function Home() {

    const {auth, kv} = usePuterStore();

    const navigate = useNavigate();

    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [resumeKeys, setResumeKeys] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadResumes = async () => {
            setLoadingResumes(true);
            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            const parsedResumes = resumes?.map((resume) => (
                JSON.parse(resume.value) as Resume
            ))
            // Build a map from resume.id -> kv.key (full key) to delete using exact key later
            const keyMap: Record<string, string> = {};
            resumes?.forEach((item) => {
                try {
                    const parsed = JSON.parse(item.value) as Resume;
                    if (parsed?.id) keyMap[parsed.id] = item.key;
                } catch {}
            });

            console.log("Parsed Resume:", parsedResumes);
            setResumes(parsedResumes || [])
            setResumeKeys(keyMap);
            setLoadingResumes(false);

        }
        loadResumes();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setDeletingId(id);
            const key = resumeKeys[id] ?? `resume:${id}`;
            const result = await kv.delete(key);
            // Some environments return undefined on success; only treat explicit false as failure
            if (result === false) {
                throw new Error("KV delete returned false");
            }
            setResumes((prev) => prev.filter((r) => r.id !== id));
            setResumeKeys((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        } catch (error) {
            console.error("Failed to delete resume", error);
            alert("Failed to delete resume. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        if (!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated]);


    return (
        <div className="bg-[url('/images/bg-main.svg')] bg-cover py-12">
            <NavBar/>


            <section className="main-section">

                <section className="page-heading py-16">
                    <h1>Track your Applications & Resume Ratings</h1>
                    {!loadingResumes && resumes?.length === 0 ?(
                        <h2>No resumes found, Upload an Resume to get the Feedback.</h2>
                    ):(
                        <h2>Review your Submissions and check AI-Powered feedback.</h2>
                    )}
                </section>
                {loadingResumes && (
                    <div className="flex flex-col items-center justify-center">
                        <img src="/images/resume-scan-2.gif" alt="Searching for Resumes" className="w-[200px]"/>
                    </div>
                )}
                {!loadingResumes && resumes.length > 0 && (
                    <div className="resumes-section">
                        {resumes.map((resume) => (
                            <div key={resume.id} className="relative">
                                {/* Delete button at top-right of the card container */}
                                <button
                                    type="button"
                                    aria-label="Delete resume"
                                    title="Delete resume"
                                    onClick={(e) => handleDelete(e, resume.id)}
                                    disabled={deletingId === resume.id}
                                    className="absolute right-0  top-1 z-10 outline-0 border-0 hover:bg-white text-slate-800 rounded-full px-3 py-1 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deletingId === resume.id ? <TbTrashOff />
                                        : <FaTrashAlt />
                                    }
                                </button>
                                <ResumeCard resume={resume}/>
                            </div>
                        ))}
                    </div>
                )}
                {!loadingResumes && resumes.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-10 gap-4">
                        <Link to='/upload' className='primary-button w-fit text-xl font-semibold'>
                            Upload Resume
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
