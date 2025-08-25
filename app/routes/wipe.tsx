import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        files.forEach(async (file) => {
            await fs.delete(file.path);
        });
        await kv.flush();
        loadFiles();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <div className="resumes-section py-10 px-10 absolute top-10 flex flex-col" >
            <h1 className="text-2xl">Authenticated as: {auth.user?.username}</h1>
            <h2 className="text-xl">Existing files:</h2>
            {files.length > 0 ? (
                <table className="min-w-full border border-gray-300 rounded-md overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => (
                            <tr key={file.id} className="border-t">
                                <td className="px-4 py-2">{file.id}</td>
                                <td className="px-4 py-2">{file.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-gray-600">No files found.</div>
            )}
            <div>
                <button
                    className=" primary-button text-white text-xl px-10 py-6 rounded-md cursor-pointer"
                    onClick={() => handleDelete()}
                >
                    Wipe App Data
                </button>
            </div>
        </div>
    );
};

export default WipeApp;