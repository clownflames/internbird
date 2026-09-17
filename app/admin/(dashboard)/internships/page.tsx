"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  getInternships,
  createInternship,
  updateInternship,
  deleteInternship,
  toggleInternshipActive,
  toggleRegistrationOpen,
} from "./actions";
import {
  EMPTY_FORM,
  type Internship,
  type InternshipInput,
} from "./_components/types";
import { InternshipsTable } from "./_components/internships-table";
import { InternshipFormSheet } from "./_components/internship-form-sheet";
import { DeleteDialog } from "./_components/delete-dialog";

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Internship | null>(null);
  const [form, setForm] = useState<InternshipInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Internship | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [, startTransition] = useTransition();

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* load data */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getInternships({
        search: debouncedSearch,
        page,
        limit: 10,
      });
      setInternships(res.data as Internship[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  /* open create / edit */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (item: Internship) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      image: item.image ?? "",
      skills: item.skills ?? [],
      qualifications: item.qualifications ?? [],
      duration: item.duration ?? "",
      mode: item.mode,
      location: item.location ?? "",

      // pricing
      pricing: item.pricing ?? "free",
      price: item.price ?? "",
      discountPrice: item.discountPrice ?? "",
      currency: item.currency ?? "INR",
      paymentType: item.paymentType ?? "one_time",
      pricingNote: item.pricingNote ?? "",

      registrationOpen: item.registrationOpen,
      isActive: item.isActive,
    });
    setDrawerOpen(true);
  };

  /* submit */
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Internship name is required");
      return;
    }

    if (
      form.pricing === "paid" &&
      (!form.price || Number(form.price) <= 0)
    ) {
      toast.error("Price is required for paid internships");
      return;
    }

    setSaving(true);
    try {
      const payload: InternshipInput = {
        ...form,
        image: form.image || null,
        description: form.description || null,
        duration: form.duration || null,
        location: form.location || null,
        price: form.pricing === "paid" ? form.price || null : null,
        discountPrice:
          form.pricing === "paid" ? form.discountPrice || null : null,
        pricingNote:
          form.pricing === "paid" ? form.pricingNote || null : null,
      };

      const res = editing
        ? await updateInternship(editing.id, payload)
        : await createInternship(payload);

      if (res.success) {
        toast.success(
          editing
            ? "Internship updated successfully"
            : "Internship created successfully"
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

  /* delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteInternship(deleteTarget.id);
      if (res.success) {
        toast.success("Internship deleted");
        setDeleteTarget(null);
        loadData();
      } else {
        toast.error(res.error ?? "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  };

  /* toggles */
  const handleToggleActive = (item: Internship) => {
    startTransition(async () => {
      const res = await toggleInternshipActive(item.id, !item.isActive);
      if (res.success) {
        toast.success(item.isActive ? "Marked inactive" : "Marked active");
        setInternships((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, isActive: !i.isActive } : i
          )
        );
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const handleToggleRegistration = (item: Internship) => {
    startTransition(async () => {
      const res = await toggleRegistrationOpen(
        item.id,
        !item.registrationOpen
      );
      if (res.success) {
        toast.success(
          item.registrationOpen
            ? "Registration closed"
            : "Registration opened"
        );
        setInternships((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, registrationOpen: !i.registrationOpen }
              : i
          )
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
          <h1 className="text-2xl font-bold tracking-tight">Internships</h1>
          <p className="text-sm text-muted-foreground">
            Manage all internship programs — create, edit, and control
            availability.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Internship
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search internships..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <InternshipsTable
        internships={internships}
        loading={loading}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onToggleActive={handleToggleActive}
        onToggleRegistration={handleToggleRegistration}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {internships.length} of {total} internships
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

      {/* Drawer */}
      <InternshipFormSheet
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={handleSubmit}
      />

      {/* Delete dialog */}
      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}