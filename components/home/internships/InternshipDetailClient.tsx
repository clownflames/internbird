"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
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
  Bookmark,
  Share2,
  Calendar,
  Award,
  CheckCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import InternshipDrawer from "./InternshipDrawer";

import type { InternshipDetail } from "@/app/(home)/internships/[id]/actions";

/* =========================================================
   MODE CONFIG
========================================================= */

const modeConfig = {
  remote: {
    label: "Remote",
    icon: Wifi,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  onsite: {
    label: "On-site",
    icon: Building2,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  hybrid: {
    label: "Hybrid",
    icon: Briefcase,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Application Pending",
  active: "Currently Active",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  active: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  completed: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
  cancelled: "border-muted bg-muted/30 text-muted-foreground",
  rejected: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
};

/* =========================================================
   MAIN
========================================================= */

interface Props {
  internship: InternshipDetail;
}

export default function InternshipDetailClient({ internship }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"details" | "apply">("apply");
  const [localRegistered, setLocalRegistered] = useState(
    internship.hasRegistered
  );
  const [localApplicantCount, setLocalApplicantCount] = useState(
    internship.applicantCount
  );
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const mode = modeConfig[internship.mode];
  const ModeIcon = mode.icon;

  const alreadyApplied =
    localRegistered &&
    internship.registrationStatus !== "cancelled" &&
    internship.registrationStatus !== "rejected";

  const showStatusBadge =
    localRegistered &&
    internship.registrationStatus &&
    internship.registrationStatus !== "cancelled" &&
    internship.registrationStatus !== "rejected";

  /* ---------- open apply drawer ---------- */
  function openApply() {
    setDrawerMode("apply");
    setDrawerOpen(true);
  }

  /* ---------- after apply success ---------- */
  function handleApplied() {
    setLocalRegistered(true);
    setLocalApplicantCount((c) => c + 1);
  }

  /* ---------- copy link ---------- */
  function handleCopyLink() {
    const url = `${window.location.origin}/internships/${internship.id}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <>
      <div className="space-y-3">
        {/* ================= HERO CARD ================= */}
        <Card className="overflow-hidden py-0 gap-0">
          {/* banner */}
          <div
            className={cn(
              "relative h-32 w-full overflow-hidden bg-gradient-to-br sm:h-40",
              mode.gradient
            )}
          >
            {/* decorative circles */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.1),transparent_50%)]" />

            {/* badge top-left */}
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
                <Sparkles className="h-3 w-3" />
                {internship.registrationOpen ? "Now Hiring" : "Closed"}
              </Badge>

              {showStatusBadge && (
                <Badge
                  className={cn(
                    "border",
                    STATUS_COLOR[internship.registrationStatus!]
                  )}
                >
                  <CheckCircle className="h-3 w-3" />
                  {STATUS_LABEL[internship.registrationStatus!]}
                </Badge>
              )}
            </div>

            {/* save + share */}
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <button
                onClick={() => setSaved((s) => !s)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
                  saved
                    ? "bg-primary text-primary-foreground"
                    : "bg-black/40 text-white hover:bg-black/60"
                )}
                aria-label="Save internship"
              >
                <Bookmark
                  className={cn("h-4 w-4", saved && "fill-current")}
                />
              </button>

              <button
                onClick={handleCopyLink}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                aria-label="Share internship"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* logo overlapping bottom */}
            <div className="absolute -bottom-8 left-5 sm:left-6">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-background shadow-lg sm:h-20 sm:w-20">
                {internship.image ? (
                  <Image
                    src={internship.image}
                    alt={internship.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Briefcase className="h-7 w-7 text-primary sm:h-9 sm:w-9" />
                )}
              </div>
            </div>
          </div>

          {/* header content */}
          <CardContent className="px-5 pt-12 pb-5 sm:px-6 sm:pt-14">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {internship.name}
            </h1>

            {/* meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                  mode.color
                )}
              >
                <ModeIcon className="h-3.5 w-3.5" />
                {mode.label}
              </span>

              {internship.duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {internship.duration}
                </span>
              )}

              {internship.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {internship.location}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {formatCount(localApplicantCount)} applied
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Posted {formatDate(internship.createdAt)}
              </span>
            </div>

            <Separator className="my-5" />

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-2">
              {alreadyApplied ? (
                <Button variant="outline" disabled className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Already Applied
                </Button>
              ) : !internship.registrationOpen ? (
                <Button variant="outline" disabled>
                  Registration Closed
                </Button>
              ) : (
                <Button onClick={openApply} className="gap-1.5 px-6">
                  Apply now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ================= ABOUT ================= */}
        {internship.description && (
          <Card className="py-0 gap-0">
            <CardContent className="p-5 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                About this internship
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {internship.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ================= SKILLS + QUALIFICATIONS ================= */}
        <div className="grid gap-3 lg:grid-cols-2">
          {/* skills */}
          {internship.skills.length > 0 && (
            <Card className="py-0 gap-0">
              <CardContent className="p-5 sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Skills you'll use
                </h2>
                <div className="flex flex-wrap gap-2">
                  {internship.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="rounded-md px-3 py-1 text-xs font-normal"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* qualifications */}
          {internship.qualifications.length > 0 && (
            <Card className="py-0 gap-0">
              <CardContent className="p-5 sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  Requirements
                </h2>
                <ul className="space-y-2.5">
                  {internship.qualifications.map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-foreground/90"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ================= PERKS ================= */}
        <Card className="py-0 gap-0">
          <CardContent className="p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              What you'll get
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PerkCard
                icon={Award}
                title="Certificate of Completion"
                description="Get an official certificate after finishing"
              />
              <PerkCard
                icon={GraduationCap}
                title="Letter of Recommendation"
                description="Based on your performance"
              />
              <PerkCard
                icon={Briefcase}
                title="Real-world Experience"
                description="Work on actual projects"
              />
              <PerkCard
                icon={Users}
                title="Mentorship"
                description="Guidance from industry experts"
              />
            </div>
          </CardContent>
        </Card>

        {/* ================= STATUS NOTICE ================= */}
        {alreadyApplied && internship.registrationStatus && (
          <Card
            className={cn(
              "border py-0 gap-0",
              STATUS_COLOR[internship.registrationStatus]
            )}
          >
            <CardContent className="flex items-start gap-3 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {STATUS_LABEL[internship.registrationStatus]}
                </p>
                <p className="mt-0.5 text-xs opacity-80">
                  Your application has been received. You'll be notified when
                  there's an update.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ================= APPLY DRAWER ================= */}
      <InternshipDrawer
        internship={{
          id: internship.id,
          name: internship.name,
          description: internship.description,
          image: internship.image,
          skills: internship.skills,
          qualifications: internship.qualifications,
          duration: internship.duration,
          mode: internship.mode,
          location: internship.location,
          registrationOpen: internship.registrationOpen,
          createdAt: internship.createdAt,
        } as any}
        open={drawerOpen}
        mode={drawerMode}
        onOpenChange={setDrawerOpen}
        onApplied={handleApplied}
      />
    </>
  );
}

/* =========================================================
   SUB COMPONENTS
========================================================= */

function PerkCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Award;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}