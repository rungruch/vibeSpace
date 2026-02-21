"use client"

import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/Button";

interface EditorProps {
    initialData?: any;
    onChange?: (data: any) => void;
    onSave?: (data: any) => void;
    readOnly?: boolean;
}

export default function Editor({ initialData, onChange, onSave, readOnly = false }: EditorProps) {
    const editorRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [shouldLoadEditor, setShouldLoadEditor] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            setShouldLoadEditor(true);
            return;
        }

        const el = document.getElementById('editorjs-container');
        if (!el) {
            setShouldLoadEditor(true);
            return;
        }

        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    setShouldLoadEditor(true);
                    io.disconnect();
                    break;
                }
            }
        }, { rootMargin: '500px' });

        io.observe(el);

        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (!shouldLoadEditor) return;

        const initEditor = async () => {
            try {
                const [
                    { default: EditorJS },
                    { default: Header },
                    { default: Paragraph },
                    { default: ImageTool },
                    { default: List },
                    { default: Quote },
                    { default: Delimiter },
                    { default: Embed },
                    { default: Table },
                    { default: Code }
                ] = await Promise.all([
                    import('@editorjs/editorjs'),
                    import('@editorjs/header'),
                    import('@editorjs/paragraph'),
                    import('@editorjs/image'),
                    import('@editorjs/list'),
                    import('@editorjs/quote'),
                    import('@editorjs/delimiter'),
                    import('@editorjs/embed'),
                    import('@editorjs/table'),
                    import('@editorjs/code')
                ]);

                const editorInstance = new EditorJS({
                    holder: "editorjs-container",
                    readOnly: readOnly,
                    placeholder: "Let's write something awesome...",
                    data: initialData,
                    onReady: () => {
                        setIsReady(true);
                    },
                    onChange: async () => {
                        if (onChange) {
                            const data = await editorInstance.save();
                            onChange(data);
                        }
                    },
                    tools: {
                        header: {
                            class: Header,
                            config: {
                                placeholder: "Enter a header",
                                levels: [1, 2, 3, 4],
                                defaultLevel: 2,
                            },
                        },
                        paragraph: {
                            class: Paragraph,
                            inlineToolbar: true,
                        },
                        list: {
                            class: List,
                            inlineToolbar: true,
                        },
                        quote: {
                            class: Quote,
                            inlineToolbar: true,
                        },
                        delimiter: Delimiter,
                        embed: Embed,
                        table: Table,
                        code: Code,
                        image: {
                            class: ImageTool,
                            config: {
                                uploader: {
                                    uploadByFile: async (file: File) => {
                                        // TODO: Connect Firebase Storage in Phase 3
                                        return new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                resolve({
                                                    success: 1,
                                                    file: {
                                                        url: e.target?.result,
                                                    }
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                        });
                                    },
                                },
                            },
                        },
                    },
                });

                editorRef.current = editorInstance;
            } catch (error) {
                console.error("Editor init failed", error);
            }
        };

        if (!editorRef.current) {
            initEditor();
        }

        return () => {
            if (editorRef.current && typeof editorRef.current.destroy === "function") {
                try {
                    editorRef.current.destroy();
                    editorRef.current = null;
                } catch (e) {
                    console.warn("Destroying Editor error:", e);
                }
            }
        };
    }, [shouldLoadEditor, readOnly]); // Only run on mount basically

    const handleSave = async () => {
        if (editorRef.current && onSave) {
            try {
                const data = await editorRef.current.save();
                onSave(data);
            } catch (error) {
                console.error("Save error", error);
            }
        }
    };

    const clearEditor = () => {
        if (editorRef.current) {
            editorRef.current.clear();
        }
    };

    return (
        <div className="w-full flex justify-center py-6 px-4 sm:px-0">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 transition-colors">

                {!readOnly && (
                    <div className="flex gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={handleSave}
                            disabled={!isReady}
                            variant="default"
                            className="px-6 rounded-full"
                        >
                            Save Page
                        </Button>
                        <Button
                            onClick={clearEditor}
                            disabled={!isReady}
                            variant="outline"
                            className="px-6 rounded-full"
                        >
                            Clear
                        </Button>
                    </div>
                )}

                <div className="min-h-[500px] prose dark:prose-invert max-w-none">
                    <div id="editorjs-container" className="editorjs-wrapper relative w-full" />
                </div>
            </div>
        </div>
    );
}
