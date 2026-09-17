"use client";

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

import { TagInput } from "./tag-input";
import type { Internship, InternshipInput } from "./types";

export function InternshipFormSheet({
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
  editing: Internship | null;
  form: InternshipInput;
  setForm: (form: InternshipInput) => void;
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
            {editing ? "Edit Internship" : "Create Internship"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Update the internship details below."
              : "Fill in the details to create a new internship program."}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Full Stack Web Development"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the internship..."
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
              <TagInput
                value={form.skills}
                onChange={(tags) => setForm({ ...form, skills: tags })}
                placeholder="Type a skill and press Enter or comma..."
              />
              <p className="text-xs text-muted-foreground">
                Press <kbd className="rounded border px-1">Enter</kbd> or{" "}
                <kbd className="rounded border px-1">,</kbd> to add. Backspace to
                remove last.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Qualifications</Label>
              <TagInput
                value={form.qualifications}
                onChange={(tags) =>
                  setForm({ ...form, qualifications: tags })
                }
                placeholder="e.g. B.Tech, Any Graduate..."
              />
              <p className="text-xs text-muted-foreground">
                Press <kbd className="rounded border px-1">Enter</kbd> or{" "}
                <kbd className="rounded border px-1">,</kbd> to add.
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(v) =>
                  setForm({ ...form, mode: v as InternshipInput["mode"] })
                }
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Bangalore, India"
                value={form.location ?? ""}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 3 Months"
                value={form.duration ?? ""}
                onChange={(e) =>
                  setForm({ ...form, duration: e.target.value })
                }
              />
            </div>

            <Separator />

            {/* ===== PRICING ===== */}
            <div className="grid gap-2">
              <Label>Pricing</Label>
              <Select
                value={form.pricing}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    pricing: v as InternshipInput["pricing"],
                    ...(v === "free"
                      ? { price: "", discountPrice: "", pricingNote: "" }
                      : {}),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.pricing === "paid" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="price">
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.currency}
                      onValueChange={(v) => setForm({ ...form, currency: v as any })}
                    >
                      <SelectTrigger className="w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="4999"
                      value={form.price ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="discountPrice">Discount Price (optional)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2999"
                    value={form.discountPrice ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, discountPrice: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Payment Type</Label>
                  <Select
                    value={form.paymentType}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        paymentType: v as InternshipInput["paymentType"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pricingNote">Pricing Note (optional)</Label>
                  <Textarea
                    id="pricingNote"
                    rows={2}
                    placeholder="e.g. One-time payment, lifetime access"
                    value={form.pricingNote ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, pricingNote: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Registration Open</Label>
                <p className="text-xs text-muted-foreground">
                  Allow students to register
                </p>
              </div>
              <Switch
                checked={form.registrationOpen}
                onCheckedChange={(v) =>
                  setForm({ ...form, registrationOpen: v })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Show this internship publicly
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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
            {editing ? "Update Internship" : "Create Internship"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}