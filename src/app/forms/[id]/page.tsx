"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { Card, CardContent } from "@/components/ui/Card";

export default function FormViewer() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [surveyModel, setSurveyModel] = useState<Model | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !params.id) return;

        const fetchForm = async () => {
            try {
                const docRef = doc(db, "users", user.uid, "forms", params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(data);

                    if (data.schema) {
                        const survey = new Model(data.schema);
                        survey.onComplete.add(async (sender) => {
                            try {
                                await addDoc(collection(db, "users", user.uid, "forms", params.id as string, "responses"), {
                                    data: sender.data,
                                    submittedAt: serverTimestamp(),
                                });
                                console.log("Response saved successfully!");
                            } catch (e) {
                                console.error("Error saving response: ", e);
                            }
                        });
                        setSurveyModel(survey);
                    }
                } else {
                    console.error("No such document!");
                    router.push("/");
                }
            } catch (error) {
                console.error("Error fetching form:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [user, params.id, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    if (!formData || !surveyModel) return null;

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

                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-indigo-500 dark:from-white dark:to-indigo-400 pb-2">
                        {formData.schema?.title || "Untitled Form"}
                    </h1>
                    {formData.schema?.description && (
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">
                            {formData.schema.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mt-4 font-medium text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formData.createdAt ? format(formData.createdAt.toDate(), "MMMM do, yyyy") : "Unknown"}</span>
                    </div>
                </div>

                <Card className="border-none shadow-xl shadow-indigo-500/10 bg-white dark:bg-slate-900">
                    <CardContent className="p-0 sm:p-6 pb-12 overflow-hidden rounded-xl">
                        <div className="surveyjs-wrapper">
                            <Survey model={surveyModel} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
