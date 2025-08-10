import NavBar from "~/Components/NavBar";
import type {Route} from "./+types/home";
import ResumeCard from "~/Components/ResumeCard";
// @ts-ignore
import {resumes} from '../../Constants';
import {usePuterStore} from "~/lib/puter";
import {useLocation, useNavigate} from "react-router";
import {useEffect} from "react";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Resumind"},
        {name: "description", content: "Smart Feedback for your dream job!"},
    ];
}

export default function Home() {

    const {auth} = usePuterStore();

    const navigate = useNavigate();
    useEffect(() => {
        if (!auth.isAuthenticated) navigate('/auth?next=/');
    }, [auth.isAuthenticated]);
    return (
        <div className="bg-[url('/images/bg-main.svg')] bg-cover py-12">
            <NavBar/>


            <section className="main-section">

                <section className="page-heading py-16">
                    <h1>Track your Applications & Resume Ratings</h1>
                    <h2>Review your submission and check AI-powered feedback.</h2>
                </section>
                {resumes.length > 0 && (
                    <div className="resumes-section">
                        {resumes.map((resume) => (
                            <div>
                                <ResumeCard key={resume.id} resume={resume}/>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
