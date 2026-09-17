"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  FileText,
  ExternalLink,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Send,
  Ban,
  RefreshCw,
  Gift,
  BadgeCheck,
  User,
  X,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

import type { OfferLetterInput } from "./actions";
import {
  getOfferLetters,
  searchRegistrations,
  createOfferLetter,
  updateOfferLetter,
  deleteOfferLetter,
  updateOfferLetterStatus,
} from "./actions";

/* =========================================================
   TYPES
========================================================= */

type OfferLetter = {
  id: string;
  userId: string;
  internshipId: string;
  registrationId: string;
  offerNumber: string;
  position: string;
  department: string | null;
  documentType: "paid" | "unpaid";
  startDate: Date | null;
  endDate: Date | null;
  issueDate: Date | null;
  stipend: string | null;
  stipendCurrency: string | null;
  terms: string | null;
  status: "draft" | "issued" | "accepted" | "rejected" | "revoked";
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userEmail: string | null;
  internshipName: string | null;
};

type RegistrationResult = {
  id: string;
  userId: string;
  internshipId: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  internshipName: string | null;
  internshipMode: string | null;
  internshipLocation: string | null;
  internshipDuration: string | null;
  university: string | null;
  collegeName: string | null;
  degree: string | null;
  branch: string | null;
  academicYear: string | null;
  status: string;
};

const EMPTY_FORM: OfferLetterInput = {
  registrationId: "",
  position: "",
  department: "",
  documentType: "paid",
  startDate: "",
  endDate: "",
  stipend: "",
  stipendCurrency: "INR",
  terms: "",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function statusColor(status: OfferLetter["status"]) {
  switch (status) {
    case "draft":
      return "secondary";
    case "issued":
      return "default";
    case "accepted":
      return "default";
    case "rejected":
      return "destructive";
    case "revoked":
      return "destructive";
  }
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function OfferLettersPage() {
  const [letters, setLetters] = useState<OfferLetter[]>([]);
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
  const [editing, setEditing] = useState<OfferLetter | null>(null);
  const [form, setForm] = useState<OfferLetterInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OfferLetter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [, startTransition] = useTransition();

  /* ---------- debounce list search ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------- load list ---------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getOfferLetters({
        search: debouncedSearch,
        status: filterStatus,
        documentType: filterType,
        page,
        limit: 10,
      });
      setLetters(res.data as OfferLetter[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load offer letters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus, filterType, page]);

  /* ---------- open create ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  /* ---------- open edit ---------- */
  const openEdit = (item: OfferLetter) => {
    setEditing(item);
    setForm({
      registrationId: item.registrationId,
      position: item.position,
      department: item.department ?? "",
      documentType: item.documentType ?? "unpaid",
      startDate: item.startDate
        ? new Date(item.startDate).toISOString().split("T")[0]
        : "",
      endDate: item.endDate
        ? new Date(item.endDate).toISOString().split("T")[0]
        : "",
      stipend: item.stipend ?? "",
      stipendCurrency: item.stipendCurrency ?? "INR",
      terms: item.terms ?? "",
    });
    setDrawerOpen(true);
  };

  /* ---------- submit (create / update) ---------- */
  const handleSubmit = async () => {
    if (!form.registrationId)
      return toast.error("Please select a student");
    if (!form.position.trim()) return toast.error("Position required");
    if (!form.startDate) return toast.error("Start date required");
    if (form.documentType === "paid" && !form.stipend) {
      return toast.error("Stipend required for paid offer");
    }

    setSaving(true);
    try {
      const payload: OfferLetterInput = {
        ...form,
        department: form.department || null,
        endDate: form.endDate || null,
        stipend: form.documentType === "paid" ? form.stipend : null,
        terms: form.terms || null,
      };

      const res = editing
        ? await updateOfferLetter(editing.id, payload)
        : await createOfferLetter(payload);

      if (res.success) {
        toast.success(
          editing
            ? "Offer letter updated"
            : "Offer letter created successfully"
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

  /* ---------- delete ---------- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteOfferLetter(deleteTarget.id);
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

  /* ---------- status change ---------- */
  const handleStatusChange = (
    item: OfferLetter,
    status: OfferLetter["status"]
  ) => {
    startTransition(async () => {
      const res = await updateOfferLetterStatus(item.id, status);
      if (res.success) {
        toast.success(`Marked as ${status}`);
        setLetters((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, status } : l))
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
          <h1 className="text-2xl font-bold tracking-tight">Offer Letters</h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage internship offer letters.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Offer Letter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by offer #, position, student..."
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
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
                <TableHead>Offer #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Internship</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stipend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : letters.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No offer letters yet.
                  </TableCell>
                </TableRow>
              ) : (
                letters.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">
                          {item.offerNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {item.userName ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.userEmail ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.internshipName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{item.position}</span>
                        {item.department && (
                          <span className="text-xs text-muted-foreground">
                            {item.department}
                          </span>
                        )}
                      </div>
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
                    <TableCell className="text-sm">
                      {item.stipend ? (
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {item.stipend}
                        </span>
                      ) : (
                        "—"
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
                    <TableCell className="text-right">
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          

                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Change Status
                          </DropdownMenuLabel>

                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "issued")}
                          >
                            <Send className="mr-2 h-4 w-4" /> Mark Issued
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(item, "accepted")
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Accepted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(item, "rejected")
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Rejected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "revoked")}
                          >
                            <Ban className="mr-2 h-4 w-4" /> Revoke
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "draft")}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" /> Back to Draft
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
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
          Showing {letters.length} of {total} offer letters
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
          DRAWER — minimal create / edit
      ========================================================= */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
        >
          <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <SheetTitle>
              {editing ? "Edit Offer Letter" : "Generate Offer Letter"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the offer details."
                : "Search a student and fill basic details. Everything else auto-fills from their registration."}
            </SheetDescription>
          </SheetHeader>

          <div className="mx-auto w-full max-w-3xl px-6 py-6">
            {editing ? (
              // EDIT MODE — show student (locked) + basic fields
              <EditForm
                form={form}
                setForm={setForm}
                editing={editing}
              />
            ) : (
              // CREATE MODE — search + form
              <CreateForm
                form={form}
                setForm={setForm}
              />
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setDrawerOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {editing ? "Update" : "Create Offer Letter"}
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer Letter?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-mono font-semibold">
                {deleteTarget?.offerNumber}
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

/* =========================================================
   CREATE FORM — student search + basic fields
========================================================= */

function CreateForm({
  form,
  setForm,
}: {
  form: OfferLetterInput;
  setForm: (f: OfferLetterInput) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistrationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<RegistrationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ---------- search students (debounced) ---------- */
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchRegistrations(query);
        setResults(res as RegistrationResult[]);
        setShowResults(true);
      } catch {
        toast.error("Search failed");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  /* ---------- click outside to close dropdown ---------- */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pickStudent(r: RegistrationResult) {
    setSelected(r);
    setForm({ ...form, registrationId: r.id });
    setQuery("");
    setShowResults(false);
    setResults([]);
  }

  function clearStudent() {
    setSelected(null);
    setForm({ ...form, registrationId: "" });
  }

  return (
    <div className="space-y-6">
      {/* ================= STUDENT SEARCH ================= */}
      <div className="space-y-2">
        <Label>
          Student <span className="text-red-500">*</span>
        </Label>

        {selected ? (
          /* Selected student card */
          <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={selected.userImage ?? undefined} />
              <AvatarFallback>
                {getInitials(selected.userName ?? "??")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{selected.userName}</p>
              <p className="text-xs text-muted-foreground">
                {selected.userEmail}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>{selected.internshipName}</span>
                {selected.collegeName && (
                  <>
                    <span>·</span>
                    <span>{selected.collegeName}</span>
                  </>
                )}
                {selected.degree && selected.branch && (
                  <>
                    <span>·</span>
                    <span>
                      {selected.degree} — {selected.branch}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearStudent}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Search input */
          <div ref={searchRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search student by name, email, or internship..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="pl-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}

            {/* Results dropdown */}
            {showResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-md border bg-popover shadow-md">
                {results.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground">
                    {searching
                      ? "Searching..."
                      : query
                        ? "No matching students found (they may already have an offer)."
                        : ""}
                  </div>
                ) : (
                  <div className="p-1">
                    {results.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => pickStudent(r)}
                        className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.userImage ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(r.userName ?? "??")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {r.userName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.userEmail}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {r.internshipName}
                            {r.collegeName && ` · ${r.collegeName}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Student details, internship, college, and degree are auto-filled.
        </p>
      </div>

      {/* ================= BASIC FIELDS ================= */}
      {selected && (
        <>
          <Separator />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="position">
                Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                placeholder="e.g. Software Engineering Intern"
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. Engineering"
                value={form.department ?? ""}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </div>
          </div>

          {/* Type */}
          <div className="grid gap-2">
            <Label>
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.documentType}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  documentType: v as "paid" | "unpaid",
                  ...(v === "unpaid"
                    ? { stipend: "", stipendCurrency: "INR" }
                    : {}),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    Paid
                  </div>
                </SelectItem>
                <SelectItem value="unpaid">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    Unpaid
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Stipend only for paid */}
          {form.documentType === "paid" && (
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stipend">
                  Stipend <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stipend"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 15000"
                  value={form.stipend ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, stipend: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={form.stipendCurrency}
                  onValueChange={(v) =>
                    setForm({ ...form, stipendCurrency: v as any })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Terms (optional — auto-generated if empty) */}
          <div className="grid gap-2">
            <Label htmlFor="terms">Terms (optional)</Label>
            <Textarea
              id="terms"
              rows={4}
              placeholder="Leave empty to auto-generate standard terms."
              value={form.terms ?? ""}
              onChange={(e) =>
                setForm({ ...form, terms: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use default terms.
            </p>
          </div>

          {/* Auto-fill info note */}
          <div className="flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">Auto-filled from registration</p>
              <p className="mt-0.5 text-blue-700/80 dark:text-blue-400/80">
                Offer number, issue date, student details, internship info,
                college, university, and degree.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   EDIT FORM — student locked, only basic fields editable
========================================================= */

function EditForm({
  form,
  setForm,
  editing,
}: {
  form: OfferLetterInput;
  setForm: (f: OfferLetterInput) => void;
  editing: OfferLetter;
}) {
  return (
    <div className="space-y-6">
      {/* Student (locked) */}
      <div className="space-y-2">
        <Label>Student</Label>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {getInitials(editing.userName ?? "??")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{editing.userName}</p>
            <p className="text-xs text-muted-foreground">
              {editing.userEmail}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {editing.internshipName} · {editing.offerNumber}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Student and offer number cannot be changed.
        </p>
      </div>

      <Separator />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="position">
            Position <span className="text-red-500">*</span>
          </Label>
          <Input
            id="position"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={form.department ?? ""}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Type</Label>
        <Select
          value={form.documentType}
          onValueChange={(v) =>
            setForm({
              ...form,
              documentType: v as "paid" | "unpaid",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm({ ...form, startDate: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={form.endDate ?? ""}
            onChange={(e) =>
              setForm({ ...form, endDate: e.target.value })
            }
          />
        </div>
      </div>

      {form.documentType === "paid" && (
        <div className="grid grid-cols-[1fr_120px] gap-4">
          <div className="grid gap-2">
            <Label htmlFor="stipend">Stipend</Label>
            <Input
              id="stipend"
              type="number"
              value={form.stipend ?? ""}
              onChange={(e) =>
                setForm({ ...form, stipend: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={form.stipendCurrency}
              onValueChange={(v) =>
                setForm({ ...form, stipendCurrency: v as any })
              }
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="terms">Terms</Label>
        <Textarea
          id="terms"
          rows={4}
          value={form.terms ?? ""}
          onChange={(e) => setForm({ ...form, terms: e.target.value })}
        />
      </div>
    </div>
  );
}