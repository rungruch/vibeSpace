"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/editor/Editor"), {
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
});

export default function PageViewer() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    const [pageData, setPageData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !params.id) return;

        const fetchPage = async () => {
            try {
                const docRef = doc(db, "users", user.uid, "pages", params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPageData(docSnap.data());
                } else {
                    console.error("No such document!");
                    router.push("/");
                }
            } catch (error) {
                console.error("Error fetching page:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [user, params.id, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
        );
    }

    if (!pageData) return null;

    return (
        <main className="min-h-screen p-6 sm:p-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-8 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Library
                </Link>

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
