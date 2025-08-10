import React, {type FormEvent, useState} from 'react';
import NavBar from "~/Components/NavBar";
import FileUploader from "~/Components/FileUploader";

const Upload = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statuesText, setStatuesText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }


    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget.closest("form");
        if (!form) return;
        const formData = new FormData(form);
        const companyName = formData.get("company-name");
        const jobTitle = formData.get("job-title");
        const jobdescription = formData.get("job-description");
        console.log({
            companyName,jobTitle,jobdescription,file
        })
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