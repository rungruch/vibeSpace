"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, Settings, Type, List, CheckSquare, Star, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export type QuestionType = "text" | "radiogroup" | "checkbox" | "rating";

export interface QuestionDef {
    name: string;
    title: string;
    type: QuestionType;
    isRequired: boolean;
    choices?: string[];
}

export interface FormBuilderProps {
    onSave?: (schema: any) => void;
    editId?: string | null;
    initialSchema?: any;
}

export default function FormBuilder({ onSave, editId, initialSchema }: FormBuilderProps) {
    const [title, setTitle] = useState(initialSchema?.title || "Untitled Form");
    const [description, setDescription] = useState(initialSchema?.description || "");

    // Parse initialSchema questions if available
    const initialQuestions = initialSchema?.pages?.[0]?.elements?.map((el: any) => ({
        name: el.name,
        title: el.title,
        type: el.type,
        isRequired: el.isRequired || false,
        choices: el.choices || undefined
    })) || [{ name: `q_${Date.now()}`, title: "Type your first question here", type: "text", isRequired: false }];

    const [questions, setQuestions] = useState<QuestionDef[]>(initialQuestions);
    const [previewMode, setPreviewMode] = useState(false);

    const addQuestion = (type: QuestionType) => {
        const base: QuestionDef = {
            name: `q_${Date.now()}`,
            title: "New Question",
            type,
            isRequired: false,
        };
        if (type === "radiogroup" || type === "checkbox") {
            base.choices = ["Option 1", "Option 2"];
        }
        setQuestions([...questions, base]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, updates: Partial<QuestionDef>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updates };
        setQuestions(updated);
    };

    const { user, setShowLoginModal } = useAuth();
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        setSaving(true);
        const schema = {
            title,
            description,
            pages: [
                {
                    name: "page1",
                    elements: questions.map(q => {
                        const el: any = { type: q.type, name: q.name, title: q.title, isRequired: q.isRequired };
                        if (q.choices) el.choices = q.choices;
                        if (q.type === 'rating') {
                            el.rateMin = 1;
                            el.rateMax = 5;
                        }
                        return el;
                    })
                }
            ]
        };

        try {
            if (editId) {
                const docRef = doc(db, "users", user.uid, "forms", editId);
                await updateDoc(docRef, {
                    schema,
                    updatedAt: serverTimestamp(),
                });
                console.log("Form updated with ID: ", editId);
            } else {
                const docRef = await addDoc(collection(db, "users", user.uid, "forms"), {
                    schema,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                console.log("Form saved with ID: ", docRef.id);
            }

            if (onSave) onSave(schema);
        } catch (error) {
            console.error("Error saving form: ", error);
            alert("Failed to save form.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Controls */}
            <div className="w-full md:w-64 flex flex-col gap-4">
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Add Question</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button variant="outline" className="justify-start" onClick={() => addQuestion("text")}>
                            <Type className="h-4 w-4 mr-2 text-blue-500" /> Text Input
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => addQuestion("radiogroup")}>
                            <List className="h-4 w-4 mr-2 text-green-500" /> Single Choice
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => addQuestion("checkbox")}>
                            <CheckSquare className="h-4 w-4 mr-2 text-indigo-500" /> Multiple Choice
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => addQuestion("rating")}>
                            <Star className="h-4 w-4 mr-2 text-yellow-500" /> Rating
                        </Button>
                    </CardContent>
                </Card>

                <Button onClick={handleSave} className="w-full shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 rounded-xl py-6">
                    Save Form
                </Button>
            </div>

            {/* Main Builder Area */}
            <div className="flex-1 space-y-6">
                <Card className="border-t-4 border-t-blue-500 shadow-sm dark:bg-slate-900">
                    <CardContent className="pt-6">
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="text-4xl font-bold border-transparent px-0 focus:ring-0 focus:border-b-blue-500 rounded-none mb-2"
                            placeholder="Form Title"
                        />
                        <Input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="text-slate-500 border-transparent px-0 focus:ring-0 focus:border-b-blue-500 rounded-none"
                            placeholder="Form Description..."
                        />
                    </CardContent>
                </Card>

                {questions.map((q, qIndex) => (
                    <Card key={q.name} className="relative group transition-all duration-300 hover:shadow-md dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <Input
                                    value={q.title}
                                    onChange={e => updateQuestion(qIndex, { title: e.target.value })}
                                    className="text-lg font-medium bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                />
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeQuestion(qIndex)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Sub-fields for specific question types */}
                            <div className="pl-2">
                                {q.type === "text" && (
                                    <div className="text-sm text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2 w-1/2">
                                        Short answer text
                                    </div>
                                )}
                                {(q.type === "radiogroup" || q.type === "checkbox") && q.choices && (
                                    <div className="space-y-3 mt-4">
                                        {q.choices.map((choice, cIndex) => (
                                            <div key={cIndex} className="flex items-center gap-3">
                                                {q.type === "radiogroup" ? (
                                                    <div className="w-4 h-4 rounded-full border border-slate-400" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-sm border border-slate-400" />
                                                )}
                                                <Input
                                                    value={choice}
                                                    onChange={e => {
                                                        const newChoices = [...q.choices!];
                                                        newChoices[cIndex] = e.target.value;
                                                        updateQuestion(qIndex, { choices: newChoices });
                                                    }}
                                                    className="h-8 flex-1 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent"
                                                />
                                                {q.choices!.length > 1 && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => {
                                                        const newChoices = [...q.choices!];
                                                        newChoices.splice(cIndex, 1);
                                                        updateQuestion(qIndex, { choices: newChoices });
                                                    }}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button variant="link" className="pl-7 h-8 text-sm text-blue-500" onClick={() => {
                                            updateQuestion(qIndex, { choices: [...q.choices!, `Option ${q.choices!.length + 1}`] })
                                        }}>
                                            Add option
                                        </Button>
                                    </div>
                                )}
                                {q.type === "rating" && (
                                    <div className="flex gap-2 mt-2">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <div key={n} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-medium">
                                                {n}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Required</span>
                                    <button
                                        className={`w-10 h-5 rounded-full relative transition-colors ${q.isRequired ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        onClick={() => updateQuestion(qIndex, { isRequired: !q.isRequired })}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${q.isRequired ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button variant="outline" className="w-full py-8 border-dashed border-2 hover:border-blue-500 hover:text-blue-500 transition-colors" onClick={() => addQuestion("text")}>
                    <Plus className="mr-2 h-5 w-5" /> Add New Question
                </Button>
            </div>
        </div>
    );
}
