"use client";

import {
    useEffect,
    useRef,
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
    X,
    BookOpen,
    ListOrdered,
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

import type { LearningPageInput } from "./actions";
import {
    getLearningPages,
    getInternshipOptions,
    createLearningPage,
    updateLearningPage,
    deleteLearningPage,
    toggleLearningPagePublished,
} from "./actions";

/* =========================================================
   TYPES
========================================================= */

type LearningPage = {
    id: string;
    internshipId: string;
    internshipName: string | null;
    title: string;
    description: string | null;
    content: string | null;
    image: string | null;
    whatYouLearn: string[];
    order: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
};

type InternshipOption = {
    id: string;
    name: string;
};

const EMPTY_FORM: LearningPageInput = {
    internshipId: "",
    title: "",
    description: "",
    content: "",
    image: "",
    whatYouLearn: [],
    order: 0,
    isPublished: true,
};

/* =========================================================
   TAG INPUT
========================================================= */

function TagInput({
    value,
    onChange,
    placeholder,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (raw: string) => {
        const tag = raw.trim();
        if (!tag) {
            setInput("");
            return;
        }
        if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
            setInput("");
            return;
        }
        onChange([...value, tag]);
        setInput("");
    };

    const removeTag = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    const handleBlur = () => {
        if (input.trim()) addTag(input);
    };

    return (
        <div
            className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            onClick={() => inputRef.current?.focus()}
        >
            {value.map((tag, i) => (
                <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeTag(i);
                        }}
                        className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}

            <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={value.length === 0 ? placeholder : ""}
                className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function LearningPagesPage() {
    const [pages, setPages] = useState<LearningPage[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterInternship, setFilterInternship] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    const [internshipOptions, setInternshipOptions] = useState<InternshipOption[]>(
        []
    );

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<LearningPage | null>(null);
    const [form, setForm] = useState<LearningPageInput>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<LearningPage | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [, startTransition] = useTransition();

    /* ---------- debounce search ---------- */
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

    /* ---------- load pages ---------- */
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getLearningPages({
                search: debouncedSearch,
                internshipId: filterInternship === "all" ? "" : filterInternship,
                page,
                limit: 10,
            });
            setPages(res.data as LearningPage[]);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            toast.error("Failed to load pages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, filterInternship, page]);

    /* ---------- open create ---------- */
    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setDrawerOpen(true);
    };

    /* ---------- open edit ---------- */
    const openEdit = (item: LearningPage) => {
        setEditing(item);
        setForm({
            internshipId: item.internshipId,
            title: item.title,
            description: item.description ?? "",
            content: item.content ?? "",
            image: item.image ?? "",
            whatYouLearn: item.whatYouLearn ?? [],
            order: item.order ?? 0,
            isPublished: item.isPublished,
        });
        setDrawerOpen(true);
    };

    /* ---------- submit ---------- */
    const handleSubmit = async () => {
        if (!form.internshipId) {
            toast.error("Please select an internship");
            return;
        }
        if (!form.title.trim()) {
            toast.error("Title is required");
            return;
        }

        setSaving(true);
        try {
            const payload: LearningPageInput = {
                ...form,
                description: form.description || null,
                content: form.content || null,
                image: form.image || null,
            };

            const res = editing
                ? await updateLearningPage(editing.id, payload)
                : await createLearningPage(payload);

            if (res.success) {
                toast.success(
                    editing ? "Page updated successfully" : "Page created successfully"
                );
                setDrawerOpen(false);
                loadData();
            } else {
                toast.error(res.error ?? "Something went wrong");
            }
        } catch {
            toast.error("Unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- delete ---------- */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await deleteLearningPage(deleteTarget.id);
            if (res.success) {
                toast.success("Page deleted");
                setDeleteTarget(null);
                loadData();
            } else {
                toast.error(res.error ?? "Failed to delete");
            }
        } finally {
            setDeleting(false);
        }
    };

    /* ---------- toggle publish ---------- */
    const handleTogglePublish = (item: LearningPage) => {
        startTransition(async () => {
            const res = await toggleLearningPagePublished(item.id, !item.isPublished);
            if (res.success) {
                toast.success(item.isPublished ? "Unpublished" : "Published");
                setPages((prev) =>
                    prev.map((p) =>
                        p.id === item.id ? { ...p, isPublished: !p.isPublished } : p
                    )
                );
            } else {
                toast.error(res.error ?? "Failed");
            }
        });
    };

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Learning Pages</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage learning content pages for each internship.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Page
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search pages..."
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
                        {internshipOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                                {opt.name}
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
                                <TableHead>Title</TableHead>
                                <TableHead>Internship</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[70px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : pages.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No pages found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pages.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <BookOpen className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.title}</span>
                                                    <span className="line-clamp-1 text-xs text-muted-foreground">
                                                        {item.description || "No description"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.internshipName ?? "—"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <ListOrdered className="h-3.5 w-3.5" />
                                                {item.order}
                                            </div>
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
                                                    <DropdownMenuGroup>

                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
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
                    Showing {pages.length} of {total} pages
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
          DRAWER - Create / Edit
      ========================================================= */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent
                    side="bottom"
                    className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
                >
                    <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                        <SheetTitle>
                            {editing ? "Edit Learning Page" : "Create Learning Page"}
                        </SheetTitle>
                        <SheetDescription>
                            {editing
                                ? "Update the learning page details below."
                                : "Fill in the details to create a new learning page."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                        {/* Left column */}
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label>
                                    Internship <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.internshipId}
                                    onValueChange={(v) =>
                                        setForm({ ...form, internshipId: v as any })
                                    }
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
                                            internshipOptions.map((opt) => (
                                                <SelectItem key={opt.id} value={opt.id}>
                                                    {opt.name}
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
                                    placeholder="e.g. Introduction to React"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Short description..."
                                    rows={3}
                                    value={form.description ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Full learning content (markdown supported)..."
                                    rows={8}
                                    value={form.content ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, content: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="image">Image URL</Label>
                                <Input
                                    id="image"
                                    placeholder="https://..."
                                    value={form.image ?? ""}
                                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>What You Learn</Label>
                                <TagInput
                                    value={form.whatYouLearn}
                                    onChange={(tags) =>
                                        setForm({ ...form, whatYouLearn: tags })
                                    }
                                    placeholder="Type a point and press Enter or comma..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Press <kbd className="rounded border px-1">Enter</kbd> or{" "}
                                    <kbd className="rounded border px-1">,</kbd> to add. Backspace to
                                    remove last.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="order">Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    min={0}
                                    value={form.order}
                                    onChange={(e) =>
                                        setForm({ ...form, order: Number(e.target.value) || 0 })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lower number = appears first
                                </p>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label>Published</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show this page to students
                                    </p>
                                </div>
                                <Switch
                                    checked={form.isPublished}
                                    onCheckedChange={(v) =>
                                        setForm({ ...form, isPublished: v })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
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
                            {editing ? "Update Page" : "Create Page"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* =========================================================
          DELETE CONFIRM
      ========================================================= */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Page?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">{deleteTarget?.title}</span>? This
                            action cannot be undone.
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
        </div>
    );
}