"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Award,
    Download,
    CheckCircle2,
    XCircle,
    Send,
    RefreshCw,
    Gift,
    BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import type { Certificate, CertificateInput } from "./_components/types";
import { EMPTY_FORM } from "./_components/types";
import {
    getCertificates,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    updateCertificateStatus,
} from "./actions";
import { CertificateFormSheet } from "./_components/certificate-form-sheet";

function statusColor(status: Certificate["status"]) {
    switch (status) {
        case "draft":
            return "secondary";
        case "issued":
            return "default";
        case "revoked":
            return "destructive";
    }
}

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState<"all" | "paid" | "unpaid">(
        "all"
    );
    const [loading, setLoading] = useState(true);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<Certificate | null>(null);
    const [form, setForm] = useState<CertificateInput>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [, startTransition] = useTransition();

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getCertificates({
                search: debouncedSearch,
                status: filterStatus,
                documentType: filterType,
                page,
                limit: 10,
            });
            setCertificates(res.data as Certificate[]);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            toast.error("Failed to load certificates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, filterStatus, filterType, page]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setDrawerOpen(true);
    };

    const openEdit = (item: Certificate) => {
        setEditing(item);
        setForm({
            registrationId: item.registrationId,
            position: item.position ?? "",
            department: "",
            documentType: item.documentType ?? "unpaid",
            startDate: item.startDate
                ? new Date(item.startDate).toISOString().split("T")[0]
                : "",
            endDate: item.endDate
                ? new Date(item.endDate).toISOString().split("T")[0]
                : "",
            grade: item.grade ?? "",
            score: item.score ?? "",
            skills: item.skills ?? [],
            description: item.description ?? "",
            status: item.status,
        });
        setDrawerOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.registrationId)
            return toast.error("Please select a student");
        if (!form.position.trim()) return toast.error("Position required");
        if (!form.startDate) return toast.error("Start date required");

        setSaving(true);
        try {
            const payload: CertificateInput = {
                ...form,
                department: form.department || null,
                endDate: form.endDate || null,
                grade: form.grade || null,
                score: form.score === "" ? null : form.score,
                description: form.description || null,
            };

            const res = editing
                ? await updateCertificate(editing.id, payload as any)
                : await createCertificate(payload as any);

            if (res.success) {
                toast.success(
                    editing
                        ? "Certificate updated"
                        : "Certificate created successfully"
                );
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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await deleteCertificate(deleteTarget.id);
            if (res.success) {
                toast.success("Deleted");
                setDeleteTarget(null);
                loadData();
            } else {
                toast.error(res.error ?? "Failed to delete");
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = (
        item: Certificate,
        status: Certificate["status"]
    ) => {
        startTransition(async () => {
            const res = await updateCertificateStatus(item.id, status);
            if (res.success) {
                toast.success(`Marked as ${status}`);
                setCertificates((prev) =>
                    prev.map((c) => (c.id === item.id ? { ...c, status } : c))
                );
            } else {
                toast.error(res.error ?? "Failed");
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
                    <p className="text-sm text-muted-foreground">
                        Generate and manage internship completion certificates.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Certificate
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by certificate #, student, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={filterType}
                    onValueChange={(v) => {
                        setFilterType(v as "all" | "paid" | "unpaid");
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filterStatus}
                    onValueChange={(v) => {
                        setFilterStatus(v as any);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Certificate #</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Internship</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Issued</TableHead>
                                <TableHead className="w-[100px] text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center">
                                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : certificates.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No certificates found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                certificates.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Award className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-mono text-xs font-medium">
                                                    {item.certificateNumber}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {item.studentName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.userEmail ?? ""}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {item.internshipName}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {item.position ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                            {item.documentType === "paid" ? (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 rounded-full border-emerald-500/40 bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                                                >
                                                    <BadgeCheck className="h-2.5 w-2.5" />
                                                    Paid
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 rounded-full border-muted-foreground/30 bg-muted/40 text-[10px] font-medium text-muted-foreground"
                                                >
                                                    <Gift className="h-2.5 w-2.5" />
                                                    Unpaid
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={statusColor(item.status)}
                                                className="capitalize"
                                            >
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {item.issueDate
                                                ? new Date(item.issueDate).toLocaleDateString()
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-0.5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-primary hover:text-primary"
                                                    
                                                    title="Download PDF"
                                                >
                                                    <a
                                                        href={`/api/documents/certificate/${item.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuGroup>

                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                onClick={() => openEdit(item)}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                                                Change Status
                                                            </DropdownMenuLabel>

                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStatusChange(item, "issued")
                                                                }
                                                            >
                                                                <Send className="mr-2 h-4 w-4" /> Mark Issued
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStatusChange(item, "revoked")
                                                                }
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4" /> Revoke
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleStatusChange(item, "draft")
                                                                }
                                                            >
                                                                <RefreshCw className="mr-2 h-4 w-4" /> Back to
                                                                Draft
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
                                            </div>
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
                    Showing {certificates.length} of {total} certificates
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

            {/* Form Sheet */}
            <CertificateFormSheet
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                editing={editing}
                form={form}
                setForm={setForm}
                saving={saving}
                onSubmit={handleSubmit}
            />

            {/* Delete dialog */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => !o && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Certificate?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Delete{" "}
                            <span className="font-mono font-semibold">
                                {deleteTarget?.certificateNumber}
                            </span>
                            ? This cannot be undone.
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