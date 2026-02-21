"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MoveRight, FileText, FileSpreadsheet, LogOut, PlusCircle, Calendar, ArrowRight, Loader2, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { user, logOut, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [pages, setPages] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!user) {
      console.log("fetchData aborted: No user is logged in.");
      return;
    }

    setFetchingData(true);
    console.log(`Fetching data for user UID: ${user.uid}`);

    try {
      const pagesQuery = query(collection(db, "users", user.uid, "pages"), orderBy("updatedAt", "desc"));
      const pagesSnapshot = await getDocs(pagesQuery);
      const pagesList = pagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Pages fetched:", pagesList);

      const formsQuery = query(collection(db, "users", user.uid, "forms"), orderBy("updatedAt", "desc"));
      const formsSnapshot = await getDocs(formsQuery);
      const formsList = formsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Forms fetched:", formsList);

      setPages(pagesList);
      setForms(formsList);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, type: "pages" | "forms", id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;
    if (!confirm(`Are you sure you want to delete this ${type === "pages" ? "page" : "form"}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, type, id));
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Failed to delete document.");
    }
  };

  const handleEdit = (e: React.MouseEvent, type: "pages" | "forms", id: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/${type}/create?edit=${id}`);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <AnimatePresence>
          <motion.div
            key="bg-blob-1"
            animate={{
              backgroundColor: resolvedTheme === "light" ? "rgba(219, 234, 254, 0.5)" : "rgba(30, 58, 138, 0.2)",
              scale: resolvedTheme === "light" ? 1 : 1.2,
            }}
            transition={{ duration: 0.8 }}
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-3xl"
          />
          <motion.div
            key="bg-blob-2"
            animate={{
              backgroundColor: resolvedTheme === "light" ? "rgba(224, 231, 255, 0.5)" : "rgba(49, 46, 129, 0.2)",
              scale: resolvedTheme === "light" ? 1 : 1.2,
            }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-3xl"
          />
        </AnimatePresence>
      </div>

      <div className="relative z-10 w-full mb-16 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-sm" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.displayName?.charAt(0) || "U"}
                </div>
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                {user.displayName?.split(" ")[0]}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700" />
            <Button variant="ghost" size="sm" onClick={logOut} className="text-slate-500 hover:text-red-500 px-2 h-8">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left Column: Create New Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400">
              Create
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Build new pages or forms to add to your workspace library.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/pages/create" className="block outline-none">
                <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={24} />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                        <PlusCircle size={20} className="text-slate-500 dark:text-slate-400" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">New Page</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      Rich text document editor
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/forms/create" className="block outline-none">
                <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                        <PlusCircle size={20} className="text-slate-500 dark:text-slate-400" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">New Form</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      SurveyJS dynamic form builder
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Recent Files List */}
        <div className="lg:col-span-8 flex flex-col pt-2 lg:pt-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            Your Library
            {fetchingData && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </h2>

          {!fetchingData && pages.length === 0 && forms.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <FileText className="text-slate-400 w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No documents yet</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-base">
                Get started by creating a new Page or Form using the buttons on the left.
              </p>
            </motion.div>
          )}

          <motion.div
            key={pages.length + forms.length}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {pages.map((page) => (
              <motion.div key={page.id} variants={itemVariants} className="relative group/card h-full">
                <Link href={`/pages/${page.id}`} className="block h-full">
                  <Card className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                    <div className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl shrink-0">
                          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate text-base leading-snug">
                            {page.title || "Untitled Page"}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {page.updatedAt?.toDate ? format(page.updatedAt.toDate(), "MMM d, yyyy") : "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm"
                    onClick={(e) => handleEdit(e, "pages", page.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm"
                    onClick={(e) => handleDelete(e, "pages", page.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

            {forms.map((form) => (
              <motion.div key={form.id} variants={itemVariants} className="relative group/card h-full">
                <Link href={`/forms/${form.id}`} className="block h-full">
                  <Card className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl shrink-0">
                          <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate text-base leading-snug">
                            {form.schema?.title || "Untitled Form"}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {form.updatedAt?.toDate ? format(form.updatedAt.toDate(), "MMM d, yyyy") : "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm"
                    onClick={(e) => handleEdit(e, "forms", form.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-full shadow-sm"
                    onClick={(e) => handleDelete(e, "forms", form.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
