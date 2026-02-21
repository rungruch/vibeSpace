"use client";

import { FormBuilderProps } from "@/components/form/FormBuilder";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Dynamically import the form builder to ensure it only runs on the client
const FormBuilder = dynamic(() => import("@/components/form/FormBuilder"), {
    ssr: false,
    loading: () => (
        <div className="w-full flex justify-center py-12">
            <Loader2 className="animate-spin rounded-full h-8 w-8 text-indigo-500" />
        </div>
    ),
});

function CreateFormContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [isClient, setIsClient] = useState(false);
    const [initialSchema, setInitialSchema] = useState<any>(null);
    const [fetching, setFetching] = useState(!!editId);

    useEffect(() => {
        setIsClient(true);
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || !editId) return;

        const fetchDoc = async () => {
            setFetching(true);
            try {
                const docRef = doc(db, "users", user.uid, "forms", editId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.schema) {
                        setInitialSchema(data.schema);
                    }
                } else {
                    console.error("Document not found");
                    router.push("/forms/create");
                }
            } catch (error) {
                console.error("Error fetching form:", error);
            } finally {
                setFetching(false);
            }
        };

        fetchDoc();
    }, [user, editId, router]);

    if (!isClient || loading || !user || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 sm:p-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-500 dark:from-white dark:to-indigo-400 pb-2">
                        {editId ? "Edit Form" : "Build a Form"}
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">
                        Design surveys and forms instantly. Use the sidebar to add fields.
                    </p>
                </div>

                <FormBuilder
                    onSave={() => router.push("/")}
                    editId={editId}
                    initialSchema={initialSchema}
                />
            </div>
        </main>
    );
}

export default function CreateFormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        }>
            <CreateFormContent />
        </Suspense>
    );
}
