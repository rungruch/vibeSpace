"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { LayeredDark } from "survey-core/themes";
import { Card, CardContent } from "@/components/ui/Card";

export default function PublicFormViewer() {
    const params = useParams();
    const { resolvedTheme } = useTheme();
    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [surveyModel, setSurveyModel] = useState<Model | null>(null);

    useEffect(() => {
        if (!params.uid || !params.id) return;

        const fetchForm = async () => {
            try {
                const docRef = doc(db, "users", params.uid as string, "forms", params.id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(data);

                    if (data.schema) {
                        const survey = new Model(data.schema);
                        survey.onComplete.add(async (sender) => {
                            try {
                                await addDoc(collection(db, "users", params.uid as string, "forms", params.id as string, "responses"), {
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
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Error fetching form:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [params.uid, params.id]);

    useEffect(() => {
        if (surveyModel && resolvedTheme === "dark") {
            surveyModel.applyTheme(LayeredDark);
        }
    }, [surveyModel, resolvedTheme]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    if (notFound || !formData || !surveyModel) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-6">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Form Not Found</h1>
                <p className="text-slate-500 dark:text-slate-400">This form doesn't exist or has been removed.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 sm:p-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto mb-8">
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
