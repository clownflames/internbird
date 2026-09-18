"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleProjectActive,
  toggleProjectPublished,
  getInternshipOptions,
  getExamOptions,
  type ProjectInput,
} from "./actions";

import {
  EMPTY_FORM,
  type Project,
  type InternshipOption,
} from "./_components/types";
import { ProjectsTable } from "./_components/projects-table";
import { ProjectFormSheet } from "./_components/project-form-sheet";
import { DeleteDialog } from "./_components/delete-dialog";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterInternship, setFilterInternship] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const [internships, setInternships] = useState<InternshipOption[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
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

  /* ---------- load internship options once ---------- */
  useEffect(() => {
    getInternshipOptions().then(setInternships);
  }, []);

  /* ---------- load data ---------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getProjects({
        search: debouncedSearch,
        internshipId:
          filterInternship === "all" ? undefined : filterInternship,
        page,
        limit: 10,
      });
      setProjects(res.data as Project[]);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, filterInternship]);

  /* ---------- create / edit ---------- */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEdit = async (item: Project) => {
    setEditing(item);
    setForm({
      internshipId: item.internshipId,
      examId: item.examId,
      title: item.title,
      description: item.description ?? "",
      image: item.image ?? "",
      requirements: item.requirements ?? [],
      skills: item.skills ?? [],
      totalScore: item.totalScore,
      passingScore: item.passingScore,
      durationDays: item.durationDays,
      resources: item.resources ?? [],
      attachments: item.attachments ?? [],
      order: item.order,
      isPublished: item.isPublished,
      isActive: item.isActive,
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
      toast.error("Project title is required");
      return;
    }
    if (form.passingScore > form.totalScore) {
      toast.error("Passing score cannot exceed total score");
      return;
    }

    setSaving(true);
    try {
      const payload: ProjectInput = {
        ...form,
        description: form.description || null,
        image: form.image || null,
        examId: form.examId || null,
      };

      const res = editing
        ? await updateProject(editing.id, payload)
        : await createProject(payload);

      if (res.success) {
        toast.success(
          editing ? "Project updated" : "Project created"
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
      const res = await deleteProject(deleteTarget.id);
      if (res.success) {
        toast.success("Project deleted");
        setDeleteTarget(null);
        loadData();
      } else {
        toast.error(res.error ?? "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- toggles ---------- */
  const handleToggleActive = (item: Project) => {
    startTransition(async () => {
      const res = await toggleProjectActive(item.id, !item.isActive);
      if (res.success) {
        toast.success(item.isActive ? "Marked inactive" : "Marked active");
        setProjects((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, isActive: !i.isActive } : i
          )
        );
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const handleTogglePublished = (item: Project) => {
    startTransition(async () => {
      const res = await toggleProjectPublished(item.id, !item.isPublished);
      if (res.success) {
        toast.success(
          item.isPublished ? "Unpublished" : "Published"
        );
        setProjects((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, isPublished: !i.isPublished } : i
          )
        );
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const hasFilters =
    search.trim() !== "" || filterInternship !== "all";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage projects for internships. Projects unlock
            after end exams.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
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
          <SelectTrigger className="w-full sm:w-64">
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All internships" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All internships</SelectItem>
            {internships.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterInternship("all");
              setPage(1);
            }}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <ProjectsTable
        projects={projects}
        loading={loading}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onToggleActive={handleToggleActive}
        onTogglePublished={handleTogglePublished}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {projects.length} of {total} projects
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
      <ProjectFormSheet
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={handleSubmit}
        internships={internships}
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