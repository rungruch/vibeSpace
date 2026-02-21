"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { ArrowLeft, Loader2, Calendar, FileDown, Table as TableIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function FormResponses() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    const [formTitle, setFormTitle] = useState("Loading...");
    const [responses, setResponses] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [questionMap, setQuestionMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !params.id) return;

        const fetchResponses = async () => {
            try {
                // Fetch form title
                const formDocRef = doc(db, "users", user.uid, "forms", params.id as string);
                const formDocSnap = await getDoc(formDocRef);

                if (formDocSnap.exists()) {
                    const formData = formDocSnap.data();
                    setFormTitle(formData.schema?.title || "Untitled Form");

                    // Build question mapping for table headers
                    const mapping: Record<string, string> = {};
                    if (formData.schema?.pages) {
                        formData.schema.pages.forEach((page: any) => {
                            if (page.elements) {
                                page.elements.forEach((element: any) => {
                                    if (element.name && element.title) {
                                        mapping[element.name] = element.title;
                                    }
                                });
                            }
                        });
                    }
                    setQuestionMap(mapping);
                }

                // Fetch responses
                const responsesRef = collection(db, "users", user.uid, "forms", params.id as string, "responses");
                const q = query(responsesRef, orderBy("submittedAt", "desc"));
                const querySnapshot = await getDocs(q);

                const fetchedResponses: any[] = [];
                const keySet = new Set<string>();

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const submission = {
                        id: doc.id,
                        submittedAt: data.submittedAt,
                        ...data.data
                    };

                    fetchedResponses.push(submission);

                    // Extract headers dynamically from survey data keys
                    Object.keys(data.data || {}).forEach(key => keySet.add(key));
                });

                setResponses(fetchedResponses);
                setHeaders(Array.from(keySet));

            } catch (error) {
                console.error("Error fetching responses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResponses();
    }, [user, params.id, router]);

    const handleExportCSV = () => {
        if (responses.length === 0) return;

        // Build CSV Header
        const csvHeaders = ["Submitted At", ...headers.map(h => questionMap[h] || h)];
        let csvContent = csvHeaders.join(",") + "\n";

        // Build CSV Rows
        responses.forEach(row => {
            const rowData = [
                row.submittedAt ? format(row.submittedAt.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A",
                ...headers.map(header => {
                    const cellData = row[header] !== undefined ? row[header] : "";
                    // Escape quotes and wrap in quotes to handle commas in data
                    return `"${String(cellData).replace(/"/g, '""')}"`;
                })
            ];
            csvContent += rowData.join(",") + "\n";
        });

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${formTitle}-responses.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 sm:p-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-8 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Library
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <TableIcon className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Responses</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            {formTitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-lg shadow-sm">
                            <span className="text-slate-900 dark:text-white font-bold mr-1">{responses.length}</span> Total Submissions
                        </div>
                        <Button
                            onClick={handleExportCSV}
                            disabled={responses.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-500/5 bg-white dark:bg-slate-900 overflow-hidden">
                    {responses.length === 0 ? (
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <TableIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No responses yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                Share your form link with others. Responses will automatically appear here once submitted.
                            </p>
                        </CardContent>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold whitespace-nowrap">Submitted At</th>
                                        {headers.map((header) => (
                                            <th key={header} className="px-6 py-4 font-semibold whitespace-nowrap">
                                                {questionMap[header] || header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {responses.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {row.submittedAt ? format(row.submittedAt.toDate(), "MMM d, yyyy HH:mm") : "Unknown"}
                                            </td>
                                            {headers.map((header) => (
                                                <td key={header} className="px-6 py-4 text-slate-900 dark:text-slate-300">
                                                    {row[header] !== undefined
                                                        ? (typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header]))
                                                        : <span className="text-slate-300 dark:text-slate-600">-</span>
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </main>
    );
}
