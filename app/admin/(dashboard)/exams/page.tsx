"use client";

import {
    useEffect,
    useState,
    useTransition,
    type KeyboardEvent,
} from "react";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    MoreHorizontal,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileQuestion,
    HelpCircle,
    ListChecks,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { ExamInput, QuestionInput } from "./actions";
import {
    getExams,
    getInternshipOptions,
    createExam,
    updateExam,
    deleteExam,
    toggleExamPublished,
    getExamQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "./actions";

/* =========================================================
   TYPES
========================================================= */

type Exam = {
    id: string;
    internshipId: string;
    internshipName: string | null;
    title: string;
    description: string | null;
    type: "pre" | "end";
    duration: number;
    totalScore: number;
    passingScore: number;
    maxAttempts: number;
    isPublished: boolean;
    questionCount: number;
    createdAt: Date;
    updatedAt: Date;
};

type Question = {
    id: string;
    examId: string;
    question: string;
    options: string[];
    correctOption: number;
    marks: number;
    explanation: string | null;
    order: number;
    createdAt: Date;
};

type InternshipOption = { id: string; name: string };

const EMPTY_EXAM: ExamInput = {
    internshipId: "",
    title: "",
    description: "",
    type: "pre",
    duration: 30,
    totalScore: 10,
    passingScore: 5,
    maxAttempts: 1,
    isPublished: false,
};

const EMPTY_QUESTION: QuestionInput = {
    examId: "",
    question: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 1,
    explanation: "",
    order: 0,
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterInternship, setFilterInternship] = useState("all");
    const [loading, setLoading] = useState(true);

    const [internshipOptions, setInternshipOptions] = useState<InternshipOption[]>(
        []
    );

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<Exam | null>(null);
    const [form, setForm] = useState<ExamInput>(EMPTY_EXAM);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
    const [deleting, setDeleting] = useState(false);

    /* questions drawer */
    const [questionsOpen, setQuestionsOpen] = useState(false);
    const [activeExam, setActiveExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [qForm, setQForm] = useState<QuestionInput>(EMPTY_QUESTION);
    const [savingQuestion, setSavingQuestion] = useState(false);

    const [deleteQTarget, setDeleteQTarget] = useState<Question | null>(null);
    const [deletingQ, setDeletingQ] = useState(false);

    const [, startTransition] = useTransition();

    /* ---------- debounce ---------- */
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    /* ---------- load internship options ---------- */
    useEffect(() => {
        (async () => {
            try {
                const opts = await getInternshipOptions();
                setInternshipOptions(opts);
            } catch {
                toast.error("Failed to load internships");
            }
        })();
    }, []);

    /* ---------- load exams ---------- */
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getExams({
                search: debouncedSearch,
                internshipId: filterInternship === "all" ? "" : filterInternship,
                page,
                limit: 10,
            });
            setExams(res.data as Exam[]);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            toast.error("Failed to load exams");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, filterInternship, page]);

    /* ---------- exam drawer ---------- */
    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_EXAM);
        setDrawerOpen(true);
    };

    const openEdit = (item: Exam) => {
        setEditing(item);
        setForm({
            internshipId: item.internshipId,
            title: item.title,
            description: item.description ?? "",
            type: item.type,
            duration: item.duration,
            totalScore: item.totalScore,
            passingScore: item.passingScore,
            maxAttempts: item.maxAttempts,
            isPublished: item.isPublished,
        });
        setDrawerOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.internshipId) return toast.error("Please select an internship");
        if (!form.title.trim()) return toast.error("Title is required");
        if (form.passingScore > form.totalScore)
            return toast.error("Passing score can't exceed total score");

        setSaving(true);
        try {
            const payload: ExamInput = {
                ...form,
                description: form.description || null,
            };
            const res = editing
                ? await updateExam(editing.id, payload)
                : await createExam(payload);

            if (res.success) {
                toast.success(editing ? "Exam updated" : "Exam created");
                setDrawerOpen(false);
                loadData();
            } else {
                toast.error(res.error ?? "Something went wrong");
            }
        } catch {
            toast.error("Unexpected error");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- delete exam ---------- */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await deleteExam(deleteTarget.id);
            if (res.success) {
                toast.success("Exam deleted");
                setDeleteTarget(null);
                loadData();
            } else toast.error(res.error ?? "Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const handleTogglePublish = (item: Exam) => {
        startTransition(async () => {
            const res = await toggleExamPublished(item.id, !item.isPublished);
            if (res.success) {
                toast.success(item.isPublished ? "Unpublished" : "Published");
                setExams((prev) =>
                    prev.map((e) =>
                        e.id === item.id ? { ...e, isPublished: !e.isPublished } : e
                    )
                );
            } else toast.error(res.error ?? "Failed");
        });
    };

    /* =========================================================
       QUESTIONS LOGIC
    ========================================================= */

    const openQuestions = async (item: Exam) => {
        setActiveExam(item);
        setQuestionsOpen(true);
        setLoadingQuestions(true);
        try {
            const qs = await getExamQuestions(item.id);
            setQuestions(qs as Question[]);
        } catch {
            toast.error("Failed to load questions");
        } finally {
            setLoadingQuestions(false);
        }
    };

    const refreshQuestions = async (examId: string) => {
        const qs = await getExamQuestions(examId);
        setQuestions(qs as Question[]);
        loadData(); // refresh questionCount
    };

    const openCreateQuestion = () => {
        if (!activeExam) return;
        setEditingQuestion(null);
        // auto order = next
        const nextOrder =
            questions.length > 0
                ? Math.max(...questions.map((q) => q.order)) + 1
                : 0;
        setQForm({ ...EMPTY_QUESTION, examId: activeExam.id, order: nextOrder });
        setQuestionDrawerOpen(true);
    };

    const openEditQuestion = (q: Question) => {
        setEditingQuestion(q);
        setQForm({
            examId: q.examId,
            question: q.question,
            options: q.options.length >= 2 ? q.options : [...q.options, "", ""],
            correctOption: q.correctOption,
            marks: q.marks,
            explanation: q.explanation ?? "",
            order: q.order,
        });
        setQuestionDrawerOpen(true);
    };

    const handleQuestionSubmit = async () => {
        if (!qForm.question.trim()) return toast.error("Question is required");
        const cleaned = qForm.options.map((o) => o.trim()).filter(Boolean);
        if (cleaned.length < 2) return toast.error("At least 2 options required");

        // check correctOption index still valid after cleaning
        if (qForm.correctOption >= cleaned.length)
            return toast.error("Select a valid correct option");

        setSavingQuestion(true);
        try {
            const payload: QuestionInput = {
                ...qForm,
                options: cleaned,
                explanation: qForm.explanation || null,
            };
            const res = editingQuestion
                ? await updateQuestion(editingQuestion.id, payload)
                : await createQuestion(payload);

            if (res.success) {
                toast.success(editingQuestion ? "Question updated" : "Question added");
                setQuestionDrawerOpen(false);
                if (activeExam) await refreshQuestions(activeExam.id);
            } else toast.error(res.error ?? "Something went wrong");
        } catch {
            toast.error("Unexpected error");
        } finally {
            setSavingQuestion(false);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!deleteQTarget) return;
        setDeletingQ(true);
        try {
            const res = await deleteQuestion(deleteQTarget.id);
            if (res.success) {
                toast.success("Question deleted");
                setDeleteQTarget(null);
                if (activeExam) await refreshQuestions(activeExam.id);
            } else toast.error(res.error ?? "Failed");
        } finally {
            setDeletingQ(false);
        }
    };

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage pre & end exams and their questions.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Exam
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search exams..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={filterInternship}
                    onValueChange={(v) => {
                        setFilterInternship(v as any);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="Filter by internship" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Internships</SelectItem>
                        {internshipOptions.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                                {o.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam</TableHead>
                                <TableHead>Internship</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Questions</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[70px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : exams.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No exams found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                exams.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Pass: {item.passingScore} / {item.totalScore} · Max
                                                    Attempts: {item.maxAttempts}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.internshipName ?? "—"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={item.type === "pre" ? "secondary" : "default"}
                                                className="capitalize"
                                            >
                                                {item.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {item.duration} min
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                <FileQuestion className="h-3.5 w-3.5" />
                                                {Number(item.questionCount ?? 0)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {item.isPublished ? (
                                                <Badge className="bg-green-600 hover:bg-green-700">
                                                    Published
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Draft</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger >
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup >

                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openQuestions(item)}>
                                                            <HelpCircle className="mr-2 h-4 w-4" /> Manage Questions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEdit(item)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleTogglePublish(item)}>
                                                            {item.isPublished ? (
                                                                <>
                                                                    <EyeOff className="mr-2 h-4 w-4" /> Unpublish
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="mr-2 h-4 w-4" /> Publish
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => setDeleteTarget(item)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {exams.length} of {total} exams
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* =========================================================
          EXAM DRAWER
      ========================================================= */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent
                    side="bottom"
                    className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
                >
                    <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                        <SheetTitle>{editing ? "Edit Exam" : "Create Exam"}</SheetTitle>
                        <SheetDescription>
                            {editing
                                ? "Update exam details below."
                                : "Fill in the details to create a new exam."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label>
                                    Internship <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.internshipId}
                                    onValueChange={(v) => setForm({ ...form, internshipId: v as any})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select internship" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {internshipOptions.length === 0 ? (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No internships available
                                            </div>
                                        ) : (
                                            internshipOptions.map((o) => (
                                                <SelectItem key={o.id} value={o.id}>
                                                    {o.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="title">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Pre-assessment Test"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    placeholder="Optional description..."
                                    value={form.description ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) =>
                                        setForm({ ...form, type: v as ExamInput["type"] })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pre">Pre Exam</SelectItem>
                                        <SelectItem value="end">End Exam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration (min)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min={1}
                                        value={form.duration}
                                        onChange={(e) =>
                                            setForm({ ...form, duration: Number(e.target.value) || 0 })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                                    <Input
                                        id="maxAttempts"
                                        type="number"
                                        min={1}
                                        value={form.maxAttempts}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                maxAttempts: Number(e.target.value) || 1,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="totalScore">Total Score</Label>
                                    <Input
                                        id="totalScore"
                                        type="number"
                                        min={1}
                                        value={form.totalScore}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                totalScore: Number(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="passingScore">Passing Score</Label>
                                    <Input
                                        id="passingScore"
                                        type="number"
                                        min={0}
                                        value={form.passingScore}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                passingScore: Number(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Published</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Make this exam visible to students
                                    </p>
                                </div>
                                <Switch
                                    checked={form.isPublished}
                                    onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => setDrawerOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? "Update Exam" : "Create Exam"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* =========================================================
          QUESTIONS DRAWER
      ========================================================= */}
            <Sheet open={questionsOpen} onOpenChange={setQuestionsOpen}>
                <SheetContent
                    side="bottom"
                    className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
                >
                    <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <SheetTitle>
                                    Questions · {activeExam?.title ?? "Exam"}
                                </SheetTitle>
                                <SheetDescription>
                                    Total marks allocated:{" "}
                                    <span className="font-medium">
                                        {questions.reduce((s, q) => s + q.marks, 0)}
                                    </span>{" "}
                                    / {activeExam?.totalScore ?? 0}
                                </SheetDescription>
                            </div>
                            <Button onClick={openCreateQuestion} className="gap-2">
                                <Plus className="h-4 w-4" /> Add Question
                            </Button>
                        </div>
                    </SheetHeader>

                    <div className="px-6 py-6">
                        {loadingQuestions ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="flex h-40 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                                <ListChecks className="h-8 w-8" />
                                <p>No questions yet. Add your first one.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {questions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Badge variant="outline">Q{idx + 1}</Badge>
                                                    <Badge variant="secondary">{q.marks} marks</Badge>
                                                </div>
                                                <p className="font-medium">{q.question}</p>
                                                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                                                    {q.options.map((opt, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${i === q.correctOption
                                                                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                                                    : ""
                                                                }`}
                                                        >
                                                            <span className="text-xs font-mono text-muted-foreground">
                                                                {String.fromCharCode(65 + i)}.
                                                            </span>
                                                            <span className="flex-1">{opt}</span>
                                                            {i === q.correctOption && (
                                                                <Badge className="bg-green-600 text-xs">
                                                                    Correct
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.explanation && (
                                                    <p className="mt-3 text-xs text-muted-foreground">
                                                        <span className="font-medium">Explanation: </span>
                                                        {q.explanation}
                                                    </p>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger >
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditQuestion(q)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => setDeleteQTarget(q)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* =========================================================
          QUESTION DRAWER (nested)
      ========================================================= */}
            <Sheet open={questionDrawerOpen} onOpenChange={setQuestionDrawerOpen}>
                <SheetContent
                    side="bottom"
                    className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
                >
                    <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                        <SheetTitle>
                            {editingQuestion ? "Edit Question" : "Add Question"}
                        </SheetTitle>
                        <SheetDescription>
                            Add options and mark the correct answer.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label>
                                    Question <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Enter the question..."
                                    value={qForm.question}
                                    onChange={(e) =>
                                        setQForm({ ...qForm, question: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Options</Label>
                                <RadioGroup
                                    value={String(qForm.correctOption)}
                                    onValueChange={(v) =>
                                        setQForm({ ...qForm, correctOption: Number(v) })
                                    }
                                    className="gap-2"
                                >
                                    {qForm.options.map((opt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 rounded-md border p-2"
                                        >
                                            <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {String.fromCharCode(65 + i)}.
                                            </span>
                                            <Input
                                                value={opt}
                                                placeholder={`Option ${i + 1}`}
                                                onChange={(e) => {
                                                    const next = [...qForm.options];
                                                    next[i] = e.target.value;
                                                    setQForm({ ...qForm, options: next });
                                                }}
                                                className="border-0 shadow-none focus-visible:ring-0"
                                            />
                                            {qForm.options.length > 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    className="h-7 w-7 text-muted-foreground"
                                                    onClick={() => {
                                                        const next = qForm.options.filter(
                                                            (_, idx) => idx !== i
                                                        );
                                                        let co = qForm.correctOption;
                                                        if (co === i) co = 0;
                                                        else if (co > i) co = co - 1;
                                                        setQForm({
                                                            ...qForm,
                                                            options: next,
                                                            correctOption: co,
                                                        });
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </RadioGroup>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 w-fit gap-2"
                                    onClick={() =>
                                        setQForm({ ...qForm, options: [...qForm.options, ""] })
                                    }
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Option
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Select the radio button next to the correct option.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="qMarks">Marks</Label>
                                    <Input
                                        id="qMarks"
                                        type="number"
                                        min={1}
                                        value={qForm.marks}
                                        onChange={(e) =>
                                            setQForm({ ...qForm, marks: Number(e.target.value) || 1 })
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="qOrder">Order</Label>
                                    <Input
                                        id="qOrder"
                                        type="number"
                                        min={0}
                                        value={qForm.order}
                                        onChange={(e) =>
                                            setQForm({ ...qForm, order: Number(e.target.value) || 0 })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="qExp">Explanation (optional)</Label>
                                <Textarea
                                    id="qExp"
                                    rows={4}
                                    placeholder="Explain the correct answer..."
                                    value={qForm.explanation ?? ""}
                                    onChange={(e) =>
                                        setQForm({ ...qForm, explanation: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => setQuestionDrawerOpen(false)}
                            disabled={savingQuestion}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleQuestionSubmit} disabled={savingQuestion}>
                            {savingQuestion && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingQuestion ? "Update Question" : "Add Question"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* =========================================================
          DELETE EXAM CONFIRM
      ========================================================= */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">{deleteTarget?.title}</span>? All
                            its questions and submissions will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* =========================================================
          DELETE QUESTION CONFIRM
      ========================================================= */}
            <AlertDialog
                open={!!deleteQTarget}
                onOpenChange={(o) => !o && setDeleteQTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This question will be permanently removed from the exam.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingQ}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteQuestion}
                            disabled={deletingQ}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deletingQ && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}