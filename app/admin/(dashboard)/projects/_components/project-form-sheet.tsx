"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

import { TagListInput } from "./tag-list-input";
import { ResourceInput } from "./resource-input";
import type {
  Project,
  ProjectInput,
  InternshipOption,
  ExamOption,
} from "./types";
import { getExamOptions } from "../actions";

export function ProjectFormSheet({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  internships,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Project | null;
  form: ProjectInput;
  setForm: (form: ProjectInput) => void;
  saving: boolean;
  onSubmit: () => void;
  internships: InternshipOption[];
}) {
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  /* ---------- load exams when internship changes ---------- */
  useEffect(() => {
    let cancelled = false;
    if (!form.internshipId) {
      setExams([]);
      return;
    }
    setLoadingExams(true);
    getExamOptions(form.internshipId).then((rows) => {
      if (cancelled) return;
      setExams(rows as ExamOption[]);
      setLoadingExams(false);
    });
    return () => {
      cancelled = true;
    };
  }, [form.internshipId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
      >
        <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <SheetTitle>
            {editing ? "Edit Project" : "Create Project"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the project details below."
              : "Fill in the details to create a new project."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          {/* ================= LEFT ================= */}
          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label>
                Internship <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.internshipId}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    internshipId: v as any,
                    examId: null, // reset exam on internship change
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select internship" />
                </SelectTrigger>
                <SelectContent>
                  {internships.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Unlock after exam (optional)</Label>
              <Select
                value={form.examId ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, examId: v === "none" ? null : v })
                }
                disabled={!form.internshipId || loadingExams}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingExams
                        ? "Loading exams..."
                        : "Always available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Always available</SelectItem>
                  {exams.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.title}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({ex.type})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If selected, students must pass this exam to unlock the
                project.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Build a Full-Stack Todo App"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the project..."
                rows={4}
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

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
              <Label>Skills</Label>
              <TagListInput
                value={form.skills}
                onChange={(v) => setForm({ ...form, skills: v })}
                placeholder="React, Node.js, MongoDB..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Requirements</Label>
              <TagListInput
                value={form.requirements}
                onChange={(v) => setForm({ ...form, requirements: v })}
                placeholder="e.g. Must use TypeScript, Deploy on Vercel..."
              />
            </div>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="durationDays">Duration (days)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationDays: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label>Resources</Label>
              <ResourceInput
                value={form.resources}
                onChange={(items) =>
                  setForm({
                    ...form,
                    resources: items as { title: string; url: string }[],
                  })
                }
                titleKey="title"
                placeholder={{
                  title: "e.g. Starter code, Figma design",
                  url: "https://...",
                }}
                emptyLabel="resource"
              />
            </div>

            <div className="grid gap-2">
              <Label>Attachments</Label>
              <ResourceInput
                value={form.attachments}
                onChange={(items) =>
                  setForm({
                    ...form,
                    attachments: items as { name: string; url: string }[],
                  })
                }
                titleKey="name"
                placeholder={{
                  title: "e.g. project-brief.pdf",
                  url: "https://...",
                }}
                emptyLabel="attachment"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Published</Label>
                <p className="text-xs text-muted-foreground">
                  Visible to students
                </p>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) =>
                  setForm({ ...form, isPublished: v })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable this project
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}