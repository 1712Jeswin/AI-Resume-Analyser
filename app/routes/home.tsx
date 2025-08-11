import NavBar from "~/Components/NavBar";
import type {Route} from "./+types/home";
import ResumeCard from "~/Components/ResumeCard";

import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

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


    useEffect(() => {
        const loadResumes = async () => {
            setLoadingResumes(true);
            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            const parsedResumes = resumes?.map((resume) => (
                JSON.parse(resume.value) as Resume
            ))

            console.log("Parsed Resume:", parsedResumes);
            setResumes(parsedResumes || [])
            setLoadingResumes(false);

        }
        loadResumes();
    }, []);


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
                            <div>
                                <ResumeCard key={resume.id} resume={resume}/>
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
