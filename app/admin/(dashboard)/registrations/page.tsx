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
  GraduationCap,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import type { RegistrationInput } from "./actions";
import {
  getRegistrations,
  getUserOptions,
  getInternshipOptions,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  updateRegistrationStatus,
} from "./actions";

/* =========================================================
   TYPES
========================================================= */

type Registration = {
  id: string;
  userId: string;
  internshipId: string;
  university: string;
  collegeName: string;
  branch: string;
  degree: string;
  academicYear: string | null;
  semester: number | null;
  passingYear: number | null;
  address: string | null;
  aboutUser: string | null;
  status: "pending" | "active" | "completed" | "cancelled" | "rejected";
  registeredAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  internshipName: string | null;
};

type UserOption = { id: string; name: string; email: string };
type InternshipOption = { id: string; name: string };

/* ---------- form state: numbers kept as strings for input ---------- */

type FormState = Omit<RegistrationInput, "semester" | "passingYear"> & {
  semester: string;
  passingYear: string;
};

const EMPTY_FORM: FormState = {
  userId: "",
  internshipId: "",
  university: "",
  collegeName: "",
  branch: "",
  degree: "",
  academicYear: "",
  semester: "",
  passingYear: "",
  address: "",
  aboutUser: "",
  status: "pending",
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: Registration["status"]) {
  const map: Record<
    Registration["status"],
    { label: string; className: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Pending",
      className: "bg-yellow-500 hover:bg-yellow-600 text-white",
      icon: <Clock className="h-3 w-3" />,
    },
    active: {
      label: "Active",
      className: "bg-green-600 hover:bg-green-700 text-white",
      icon: <UserCheck className="h-3 w-3" />,
    },
    completed: {
      label: "Completed",
      className: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-500 hover:bg-gray-600 text-white",
      icon: <Ban className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-600 hover:bg-red-700 text-white",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const s = map[status];
  return (
    <Badge className={`gap-1 ${s.className}`}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterInternship, setFilterInternship] = useState("all");
  const [loading, setLoading] = useState(true);

  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [internshipOptions, setInternshipOptions] = useState<
    InternshipOption[]
  >([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [, startTransition] = useTransition();

  /* ---------- debounce ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------- options ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [users, ints] = await Promise.all([
          getUserOptions(),
          getInternshipOptions(),
        ]);
        setUserOptions(users);
        setInternshipOptions(ints);
      } catch {
        toast.error("Failed to load options");
      }
    })();
  }, []);

  /* ---------- load data ---------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getRegistrations({
        search: debouncedSearch,
        status: filterStatus,
        internshipId: filterInternship,
        page,
        limit: 10,
      });
      setRegistrations(res.data as Registration[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus, filterInternship, page]);

  /* ---------- open create ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  /* ---------- open edit ---------- */
  const openEdit = (item: Registration) => {
    setEditing(item);
    setForm({
      userId: item.userId,
      internshipId: item.internshipId,
      university: item.university,
      collegeName: item.collegeName,
      branch: item.branch,
      degree: item.degree,
      academicYear: item.academicYear ?? "",
      semester: item.semester != null ? String(item.semester) : "",
      passingYear: item.passingYear != null ? String(item.passingYear) : "",
      address: item.address ?? "",
      aboutUser: item.aboutUser ?? "",
      status: item.status,
    });
    setDrawerOpen(true);
  };

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    if (!form.userId) return toast.error("Please select a user");
    if (!form.internshipId) return toast.error("Please select an internship");
    if (!form.university.trim()) return toast.error("University is required");
    if (!form.collegeName.trim()) return toast.error("College is required");
    if (!form.branch.trim()) return toast.error("Branch is required");
    if (!form.degree.trim()) return toast.error("Degree is required");

    setSaving(true);
    try {
      const payload: RegistrationInput = {
        userId: form.userId,
        internshipId: form.internshipId,
        university: form.university,
        collegeName: form.collegeName,
        branch: form.branch,
        degree: form.degree,
        academicYear: form.academicYear || null,
        semester: form.semester === "" ? null : Number(form.semester),
        passingYear: form.passingYear === "" ? null : Number(form.passingYear),
        address: form.address || null,
        aboutUser: form.aboutUser || null,
        status: form.status,
      };

      const res = editing
        ? await updateRegistration(editing.id, payload)
        : await createRegistration(payload);

      if (res.success) {
        toast.success(
          editing
            ? "Registration updated successfully"
            : "Registration created successfully"
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
      const res = await deleteRegistration(deleteTarget.id);
      if (res.success) {
        toast.success("Registration deleted");
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
    item: Registration,
    status: Registration["status"]
  ) => {
    startTransition(async () => {
      const res = await updateRegistrationStatus(item.id, status);
      if (res.success) {
        toast.success(`Marked as ${status}`);
        setRegistrations((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, status } : r))
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
          <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
          <p className="text-sm text-muted-foreground">
            Manage student internship registrations and their academic details.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Registration
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student, college, branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterInternship}
          onValueChange={(v) => {
            setFilterInternship(v as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-65">
            <SelectValue placeholder="Internship" />
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
                <TableHead>Student</TableHead>
                <TableHead>Internship</TableHead>
                <TableHead>Academic</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-17.5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {item.userName ?? "—"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {item.userEmail ?? ""}
                        </span>
                        {item.userPhone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {item.userPhone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.internshipName ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.degree} · {item.branch}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.collegeName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.registeredAt)}
                    </TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        {/* ✅ asChild hata diya */}
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
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
                              onClick={() => handleStatusChange(item, "pending")}
                            >
                              <Clock className="mr-2 h-4 w-4" /> Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item, "active")}
                            >
                              <UserCheck className="mr-2 h-4 w-4" /> Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item, "completed")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item, "cancelled")}
                            >
                              <Ban className="mr-2 h-4 w-4" /> Cancelled
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item, "rejected")}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Rejected
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
          Showing {registrations.length} of {total} registrations
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
              {editing ? "Edit Registration" : "Create Registration"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the registration details below."
                : "Select a student and internship, then fill academic details."}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            {/* Left */}
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label>
                  Student <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.userId}
                  onValueChange={(v) => setForm({ ...form, userId: v as any })}
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent className="max-h-75">
                    {userOptions.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No users available
                      </div>
                    ) : (
                      userOptions.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {u.name ?? ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {u.email ?? ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>
                  Internship <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.internshipId}
                  onValueChange={(v) => setForm({ ...form, internshipId: v as any })}
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select internship" />
                  </SelectTrigger>
                  <SelectContent className="max-h-75">
                    {internshipOptions.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No internships available
                      </div>
                    ) : (
                      internshipOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name ?? ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {editing && (
                  <p className="text-xs text-muted-foreground">
                    Student &amp; internship can&apos;t be changed after
                    creation.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="university">
                  University <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="university"
                  placeholder="e.g. Mumbai University"
                  value={form.university}
                  onChange={(e) =>
                    setForm({ ...form, university: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="collegeName">
                  College Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="collegeName"
                  placeholder="e.g. IIT Bombay"
                  value={form.collegeName}
                  onChange={(e) =>
                    setForm({ ...form, collegeName: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="degree">
                    Degree <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="degree"
                    placeholder="e.g. B.Tech"
                    value={form.degree}
                    onChange={(e) =>
                      setForm({ ...form, degree: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch">
                    Branch <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branch"
                    placeholder="e.g. Computer Science"
                    value={form.branch}
                    onChange={(e) =>
                      setForm({ ...form, branch: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  placeholder="e.g. 2025-2026"
                  value={form.academicYear ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, academicYear: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    type="number"
                    min={1}
                    max={12}
                    placeholder="e.g. 6"
                    value={form.semester}
                    onChange={(e) =>
                      setForm({ ...form, semester: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passingYear">Passing Year</Label>
                  <Input
                    id="passingYear"
                    type="number"
                    min={2000}
                    max={2100}
                    placeholder="e.g. 2027"
                    value={form.passingYear}
                    onChange={(e) =>
                      setForm({ ...form, passingYear: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      status: v as FormState["status"],
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  placeholder="Full address..."
                  value={form.address ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="aboutUser">About Student</Label>
                <Textarea
                  id="aboutUser"
                  rows={4}
                  placeholder="Short bio, interests, goals..."
                  value={form.aboutUser ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, aboutUser: e.target.value })
                  }
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
              {editing ? "Update Registration" : "Create Registration"}
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
            <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the registration for{" "}
              <span className="font-semibold">
                {deleteTarget?.userName ?? "this student"}
              </span>{" "}
              ({deleteTarget?.internshipName ?? "internship"})? This will also
              remove any linked offer letters, certificates, LORs and payments.
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