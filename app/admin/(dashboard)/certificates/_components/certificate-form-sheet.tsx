"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  X,
  Sparkles,
  BadgeCheck,
  Gift,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import { TagListInput } from "./tag-list-input";
import { searchOfferLetters } from "../actions";
import type {
  Certificate,
  CertificateInput,
  OfferLetterResult,
} from "./types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* =========================================================
   FORM SHEET
========================================================= */

export function CertificateFormSheet({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Certificate | null;
  form: CertificateInput;
  setForm: (f: CertificateInput) => void;
  saving: boolean;
  onSubmit: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-2xl p-0 sm:max-w-full"
      >
        <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <SheetTitle>
            {editing ? "Edit Certificate" : "New Certificate"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the certificate details."
              : "Search a student with an offer letter. Details auto-fill."}
          </SheetDescription>
        </SheetHeader>

        <div className="mx-auto w-full max-w-3xl px-6 py-6">
          {editing ? (
            <EditForm form={form} setForm={setForm} editing={editing} />
          ) : (
            <CreateForm form={form} setForm={setForm} />
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {editing ? "Update" : "Create Certificate"}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================
   CREATE FORM
========================================================= */

function CreateForm({
  form,
  setForm,
}: {
  form: CertificateInput;
  setForm: (f: CertificateInput) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OfferLetterResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<OfferLetterResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ---------- debounced search ---------- */
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      setError(null);
      try {
        const res = await searchOfferLetters(query);
        setResults(res as OfferLetterResult[]);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Search failed. Please try again.");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  /* ---------- click outside ---------- */
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

  function pickOffer(r: OfferLetterResult) {
    setSelected(r);
    // 🔥 AUTO-FILL everything from the offer letter
    setForm({
      ...form,
      registrationId: r.registrationId,
      position: r.offerPosition,
      department: r.offerDepartment ?? "",
      documentType: r.offerDocumentType,
      startDate: r.offerStartDate
        ? new Date(r.offerStartDate).toISOString().split("T")[0]
        : "",
      endDate: r.offerEndDate
        ? new Date(r.offerEndDate).toISOString().split("T")[0]
        : "",
    });
    setQuery("");
    setShowResults(false);
    setResults([]);
  }

  function clearStudent() {
    setSelected(null);
    setForm({
      ...form,
      registrationId: "",
      position: "",
      department: "",
      startDate: "",
      endDate: "",
    });
  }

  return (
    <div className="space-y-6">
      {/* ================= OFFER LETTER SEARCH ================= */}
      <div className="space-y-2">
        <Label>
          Student Offer Letter <span className="text-red-500">*</span>
        </Label>

        {selected ? (
          /* Selected card */
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
                <span className="font-mono text-primary">
                  {selected.offerNumber}
                </span>
                <span>·</span>
                <span>{selected.internshipName}</span>
                {selected.collegeName && (
                  <>
                    <span>·</span>
                    <span>{selected.collegeName}</span>
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
          /* Search */
          <div ref={searchRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, offer #, or internship..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="pl-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}

            {showResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-md border bg-popover shadow-md">
                {results.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground">
                    {searching
                      ? "Searching..."
                      : query.trim()
                      ? "No matching students with offer letters (they may already have a certificate)"
                      : "Start typing to search..."}
                  </div>
                ) : (
                  <div className="p-1">
                    {results.map((r) => (
                      <button
                        key={r.offerLetterId}
                        type="button"
                        onClick={() => pickOffer(r)}
                        className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-accent"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.userImage ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(r.userName ?? "??")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {r.userName}
                            </p>
                            <span className="font-mono text-[10px] text-primary">
                              {r.offerNumber}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.userEmail}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {r.internshipName} · {r.offerPosition}
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

        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Only students with an issued offer letter (and no certificate yet)
          appear here. Position, type, and dates are auto-filled.
        </p>
      </div>

      {selected && (
        <>
          <Separator />

          {/* Auto-filled banner */}
          <div className="flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">
                Auto-filled from offer letter{" "}
                <span className="font-mono">{selected.offerNumber}</span>
              </p>
              <p className="mt-0.5 text-blue-700/80 dark:text-blue-400/80">
                Position, type, and dates are pre-filled. You can adjust if
                needed.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>
                Position <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Software Engineering Intern"
                value={form.position}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Grade</Label>
              <Input
                placeholder="e.g. A, Excellent, Distinction"
                value={form.grade ?? ""}
                onChange={(e) =>
                  setForm({ ...form, grade: e.target.value })
                }
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Skills</Label>
            <TagListInput
              value={form.skills}
              onChange={(tags) => setForm({ ...form, skills: tags })}
              placeholder="React, Node.js, MongoDB..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Description (optional)</Label>
            <Textarea
              rows={4}
              placeholder="Leave empty to use default description."
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   EDIT FORM
========================================================= */

function EditForm({
  form,
  setForm,
  editing,
}: {
  form: CertificateInput;
  setForm: (f: CertificateInput) => void;
  editing: Certificate;
}) {
  return (
    <div className="space-y-6">
      {/* Student locked */}
      <div className="space-y-2">
        <Label>Student</Label>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {getInitials(editing.studentName ?? "??")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{editing.studentName}</p>
            <p className="text-xs text-muted-foreground">
              {editing.userEmail}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {editing.internshipName} · {editing.certificateNumber}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>
            Position <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.position}
            onChange={(e) =>
              setForm({ ...form, position: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>Grade</Label>
          <Input
            value={form.grade ?? ""}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
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
          <Label>
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm({ ...form, startDate: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={form.endDate ?? ""}
            onChange={(e) =>
              setForm({ ...form, endDate: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Skills</Label>
        <TagListInput
          value={form.skills}
          onChange={(tags) => setForm({ ...form, skills: tags })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Description</Label>
        <Textarea
          rows={4}
          value={form.description ?? ""}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
      </div>
    </div>
  );
}