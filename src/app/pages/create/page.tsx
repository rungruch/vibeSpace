"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoginModal } from "@/components/LoginModal";

const Editor = dynamic(() => import("@/components/editor/Editor"), {
    ssr: false,
    loading: () => (
        <div className="w-full flex justify-center py-12">
            <Loader2 className="animate-spin rounded-full h-8 w-8 text-blue-500" />
        </div>
    ),
});

function CreatePageContent() {
    const { user, loading, setShowLoginModal } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");

    const [title, setTitle] = useState("Untitled Page");
    const [saving, setSaving] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [initialData, setInitialData] = useState<any>(null);
    const [fetching, setFetching] = useState(!!editId);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!user || !editId) return;

        const fetchDoc = async () => {
            setFetching(true);
            try {
                const docRef = doc(db, "users", user.uid, "pages", editId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title || "Untitled Page");
                    if (data.content) {
                        setInitialData(data.content);
                    }
                } else {
                    console.error("Document not found");
                    router.push("/pages/create");
                }
            } catch (error) {
                console.error("Error fetching doc:", error);
            } finally {
                setFetching(false);
            }
        };

        fetchDoc();
    }, [user, editId, router]);

    const handleSave = async (data: any) => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                const docRef = doc(db, "users", user.uid, "pages", editId);
                await updateDoc(docRef, {
                    title,
                    content: data,
                    updatedAt: serverTimestamp(),
                });
                console.log("Document updated with ID: ", editId);
            } else {
                const docRef = await addDoc(collection(db, "users", user.uid, "pages"), {
                    title,
                    content: data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                console.log("Document written with ID: ", docRef.id);
            }
            router.push("/");
        } catch (e) {
            console.error("Error saving document: ", e);
            alert("Failed to save page.");
        } finally {
            setSaving(false);
        }
    };

    if (!isClient || loading || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 sm:p-12 transition-colors duration-300">
            <div className="max-w-4xl mx-auto mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-6 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <Card className="p-6 border-none shadow-none bg-transparent dark:bg-transparent">
                    <CardHeader className="px-0">
                        <CardTitle className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                            {editId ? "Edit Page" : "Create a new Page"}
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            Use the rich text editor below to construct your page content. Add headers, paragraphs, lists, quotes, code blocks, images, and tables.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 mt-4">
                        <div className="mb-8">
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 mt-4 ml-1">
                                Page Title
                            </label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter page title..."
                                className="text-xl py-6 rounded-xl bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Editor onSave={handleSave} initialData={initialData} />
            <LoginModal />
        </main>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
            </div>
        }>
            <CreatePageContent />
        </Suspense>
    );
}
