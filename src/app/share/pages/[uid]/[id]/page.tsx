"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/editor/Editor"), {
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
});

export default function PublicPageViewer() {
    const params = useParams();
    const [pageData, setPageData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!params.uid || !params.id) return;

        const fetchPage = async () => {
            try {
                const docRef = doc(db, "users", params.uid as string, "pages", params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPageData(docSnap.data());
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Error fetching page:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [params.uid, params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
        );
    }

    if (notFound || !pageData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-6">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h1>
                <p className="text-slate-500 dark:text-slate-400">This page doesn't exist or has been removed.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 sm:p-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto mb-8">
                <div className="mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 pb-2">
                        {pageData.title || "Untitled Page"}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>Last updated: {pageData.updatedAt ? format(pageData.updatedAt.toDate(), "MMMM do, yyyy 'at' h:mm a") : "Unknown"}</span>
                    </div>
                </div>
            </div>

            <div className="pointer-events-none opacity-90">
                <Editor initialData={pageData.content} readOnly={true} />
            </div>
        </main>
    );
}
