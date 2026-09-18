"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import Script from "next/script";
import {
  Briefcase,
  MapPin,
  Clock,
  Wifi,
  Building2,
  Users,
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  GraduationCap,
  AlertCircle,
  IndianRupee,
  Gift,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import {
  applyToInternship,
  createInternshipPaymentOrder,
  verifyInternshipPayment,
  getApplicantDefaults,
  type InternshipListItem,
  type ApplicationFormData,
} from "@/app/(home)/internships/actions";

/* =========================================================
   RAZORPAY TYPES
========================================================= */

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* =========================================================
   MODE CONFIG
========================================================= */

const modeConfig = {
  remote: {
    label: "Remote",
    icon: Wifi,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  onsite: {
    label: "On-site",
    icon: Building2,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  hybrid: {
    label: "Hybrid",
    icon: Briefcase,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
};

/* =========================================================
   TYPES
========================================================= */

type Mode = "details" | "apply";
type Step = "form" | "payment";

interface Props {
  internship: InternshipListItem | null;
  open: boolean;
  mode: Mode;
  onOpenChange: (open: boolean) => void;
  onApplied?: (internshipId: string) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function InternshipDrawer({
  internship,
  open,
  mode,
  onOpenChange,
  onApplied,
}: Props) {
  if (!internship) return null;

  return (
    <>
      {/* Razorpay script — loaded once */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl p-0 gap-0"
        >
          {mode === "details" ? (
            <DetailsView
              internship={internship}
              onApply={() => {
                onOpenChange(false);
                setTimeout(() => onApplied?.(internship.id), 100);
              }}
            />
          ) : (
            <ApplyView
              internship={internship}
              onSuccess={() => {
                onApplied?.(internship.id);
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/* =========================================================
   DETAILS VIEW (unchanged mostly, pricing badge added)
========================================================= */

function DetailsView({
  internship,
  onApply,
}: {
  internship: InternshipListItem;
  onApply: () => void;
}) {
  const mode = modeConfig[internship.mode];
  const ModeIcon = mode.icon;

  const alreadyApplied =
    internship.hasRegistered &&
    internship.registrationStatus !== "cancelled" &&
    internship.registrationStatus !== "rejected";

  const isFree = internship.pricing === "free";
  const isPaid = internship.pricing === "paid";

  return (
    <div className="flex flex-col">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

      <SheetHeader className="px-5 pt-4 pb-0 text-left">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {internship.image ? (
              <Image
                src={internship.image}
                alt={internship.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <Briefcase className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <SheetTitle className="text-left text-lg leading-tight">
              {internship.name}
            </SheetTitle>
            <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                  mode.color
                )}
              >
                <ModeIcon className="h-3 w-3" />
                {mode.label}
              </span>

              {internship.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {internship.duration}
                </span>
              )}

              {internship.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {internship.location}
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {internship.applicantCount} applied
              </span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 px-5 py-5">
        {/* ===== Pricing ===== */}
        <Section title="Pricing">
          {isFree ? (
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
              <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Free
                </p>
                <p className="text-xs text-muted-foreground">
                  No cost to apply — 100% free program
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                {internship.discountPrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      {internship.currency} {internship.discountPrice}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {internship.currency} {internship.price}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {internship.currency} {internship.price}
                  </span>
                )}
                {internship.paymentType === "monthly" && (
                  <span className="text-xs text-muted-foreground">/month</span>
                )}
              </div>
              {internship.pricingNote && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {internship.pricingNote}
                </p>
              )}
              <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Secure payment via Razorpay
              </p>
            </div>
          )}
        </Section>

        {internship.description && (
          <Section title="About this internship">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {internship.description}
            </p>
          </Section>
        )}

        {internship.skills.length > 0 && (
          <Section title="Skills you'll use">
            <div className="flex flex-wrap gap-1.5">
              {internship.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="rounded-md px-2.5 py-1 text-xs font-normal"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {internship.qualifications.length > 0 && (
          <Section title="Requirements">
            <ul className="space-y-2">
              {internship.qualifications.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Perks">
          <div className="grid grid-cols-2 gap-2">
            <Perk icon={Sparkles} label="Certificate of completion" />
            <Perk icon={GraduationCap} label="Letter of recommendation" />
            <Perk icon={Briefcase} label="Real-world experience" />
            <Perk icon={Users} label="Mentorship" />
          </div>
        </Section>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 border-t bg-background/95 px-5 py-3 backdrop-blur">
        {alreadyApplied ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-center text-xs">
            <p className="font-medium text-emerald-600 dark:text-emerald-400">
              ✓ You have already applied
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Status: {internship.registrationStatus}
            </p>
          </div>
        ) : !internship.registrationOpen ? (
          <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-center text-xs">
            <p className="font-medium text-muted-foreground">
              Registration closed
            </p>
          </div>
        ) : (
          <Button onClick={onApply} className="w-full gap-2" size="lg">
            {isFree ? (
              <>
                Apply now
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Enroll now — {internship.currency}{" "}
                {internship.discountPrice ?? internship.price}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   APPLY VIEW (form → payment if paid)
========================================================= */

function ApplyView({
  internship,
  onSuccess,
  onCancel,
}: {
  internship: InternshipListItem;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isPaid = internship.pricing === "paid";

  const [form, setForm] = useState<ApplicationFormData>({
    university: "",
    collegeName: "",
    branch: "",
    degree: "",
    academicYear: "",
    semester: undefined,
    passingYear: undefined,
    address: "",
    aboutUser: "",
  });

  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingDefaults(true);
      const d = await getApplicantDefaults();
      if (cancelled) return;
      setForm({
        university: d.university,
        collegeName: d.collegeName,
        branch: d.branch,
        degree: d.degree,
        academicYear: d.academicYear,
        semester: d.semester ? Number(d.semester) : undefined,
        passingYear: d.passingYear ? Number(d.passingYear) : undefined,
        address: d.address,
        aboutUser: d.aboutUser,
      });
      setLoadingDefaults(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof ApplicationFormData>(
    key: K,
    value: ApplicationFormData[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.university.trim()) return "University is required";
    if (!form.collegeName.trim()) return "College name is required";
    if (!form.branch.trim()) return "Branch is required";
    if (!form.degree.trim()) return "Degree is required";
    return null;
  }

  /* ---------- FREE: direct submit ---------- */
  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    startTransition(async () => {
      const res = await applyToInternship(internship.id, form);
      setSubmitting(false);

      if (res.success) onSuccess();
      else setError(res.error ?? "Something went wrong");
    });
  }

  /* ---------- PAID: razorpay ---------- */
  async function handlePaidSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    if (!window.Razorpay) {
      setError("Payment SDK not loaded. Please refresh and try again.");
      return;
    }

    setSubmitting(true);

    startTransition(async () => {
      // 1. create order
      const orderRes = await createInternshipPaymentOrder(internship.id, form);

      if (!orderRes.success || !orderRes.order) {
        setSubmitting(false);
        setError(orderRes.error ?? "Failed to create payment order");
        return;
      }

      const order = orderRes.order;

      // 2. open razorpay checkout
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: "Internship Program",
        description: internship.name,
        order_id: order.id,

        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 3. verify signature server-side
          const verifyRes = await verifyInternshipPayment(internship.id, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          setSubmitting(false);

          if (verifyRes.success) {
            onSuccess();
          } else {
            setError(verifyRes.error ?? "Payment verification failed");
          }
        },

        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setError("Payment cancelled");
          },
        },

        theme: {
          color: "#0f172a",
        },
      });

      rzp.on("payment.failed", (response: any) => {
        setSubmitting(false);
        setError(
          response?.error?.description ?? "Payment failed. Please try again."
        );
      });

      rzp.open();
    });
  }

  const handleSubmit = isPaid ? handlePaidSubmit : handleFreeSubmit;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

      <SheetHeader className="px-5 pt-4 pb-3 text-left">
        <SheetTitle className="text-left text-lg">
          {isPaid ? "Enroll for" : "Apply for"}
        </SheetTitle>
        <SheetDescription className="text-left">
          {internship.name}
        </SheetDescription>

        {/* price banner for paid */}
        {isPaid && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-1 items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Total payable
              </span>
              <div className="flex items-baseline gap-1.5">
                {internship.discountPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {internship.currency} {internship.price}
                  </span>
                )}
                <span className="text-base font-semibold text-amber-600 dark:text-amber-400">
                  {internship.currency}{" "}
                  {internship.discountPrice ?? internship.price}
                </span>
                {internship.paymentType === "monthly" && (
                  <span className="text-[11px] text-muted-foreground">
                    /mo
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetHeader>

      <Separator />

      <div className="space-y-4 px-5 py-4">
        {loadingDefaults ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">
              Loading your details...
            </span>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Academic details
              </h3>

              <Field label="University *">
                <Input
                  value={form.university}
                  onChange={(e) => update("university", e.target.value)}
                  placeholder="e.g. Mumbai University"
                />
              </Field>

              <Field label="College name *">
                <Input
                  value={form.collegeName}
                  onChange={(e) => update("collegeName", e.target.value)}
                  placeholder="e.g. IIT Bombay"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Degree *">
                  <Input
                    value={form.degree}
                    onChange={(e) => update("degree", e.target.value)}
                    placeholder="B.Tech"
                  />
                </Field>

                <Field label="Branch *">
                  <Input
                    value={form.branch}
                    onChange={(e) => update("branch", e.target.value)}
                    placeholder="CSE"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Academic year">
                  <Input
                    value={form.academicYear}
                    onChange={(e) => update("academicYear", e.target.value)}
                    placeholder="2023-27"
                  />
                </Field>

                <Field label="Semester">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={form.semester ?? ""}
                    onChange={(e) =>
                      update(
                        "semester",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="6"
                  />
                </Field>

                <Field label="Passing year">
                  <Input
                    type="number"
                    min={2020}
                    max={2100}
                    value={form.passingYear ?? ""}
                    onChange={(e) =>
                      update(
                        "passingYear",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="2027"
                  />
                </Field>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Additional info
              </h3>

              <Field label="Address">
                <Input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="City, State"
                />
              </Field>

              <Field label="About you">
                <Textarea
                  value={form.aboutUser}
                  onChange={(e) => update("aboutUser", e.target.value)}
                  placeholder="Tell us why you'd be a great fit..."
                  rows={3}
                />
              </Field>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 flex gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || loadingDefaults}
          className="flex-1 gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPaid ? "Processing..." : "Submitting..."}
            </>
          ) : (
            <>
              {isPaid ? (
                <>
                  Pay {internship.currency}{" "}
                  {internship.discountPrice ?? internship.price}
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Submit application
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Perk({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}