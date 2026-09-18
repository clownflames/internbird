"use client";

import Image from "next/image";
import { useState } from "react";
import {
  MapPin,
  Clock,
  Wifi,
  Building2,
  Briefcase,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  IndianRupee,
  Gift,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import InternshipDrawer from "./internships/InternshipDrawer";

import type { FeedInternship } from "@/app/(home)/actions";

/* =========================================================
   HELPERS
========================================================= */

function timeAgo(iso: string) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

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
   INTERNSHIP CARD
========================================================= */

interface InternshipCardProps {
  internship: FeedInternship;
  hasApplied: boolean;
}

export default function InternshipCard({
  internship,
  hasApplied,
}: InternshipCardProps) {
  const mode = modeConfig[internship.mode];
  const ModeIcon = mode.icon;

  const visibleSkills = internship.skills.slice(0, 4);
  const extraSkills = internship.skills.length - visibleSkills.length;

  const isFree = internship.pricing === "free";
  const isPaid = internship.pricing === "paid";

  // local state for instant update after apply
  const [localApplied, setLocalApplied] = useState(false);
  const isApplied = hasApplied || localApplied;

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"details" | "apply">("details");

  const openDetails = () => {
    setDrawerMode("details");
    setDrawerOpen(true);
  };

  const openApply = () => {
    setDrawerMode("apply");
    setDrawerOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden py-0 gap-0 border-primary/20">
        <CardContent className="p-0">
          {/* ================= BANNER ================= */}
          <div className="relative">
            <div className="h-20 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

            <Badge className="absolute left-3 top-3 gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Sparkles className="h-3 w-3" />
              {isApplied ? "Applied" : "Now Hiring"}
            </Badge>

            {/* Pricing badge top-right */}
            <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
              {isFree ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500 bg-background/80 text-emerald-600 backdrop-blur-sm"
                >
                  <Gift className="h-3 w-3" />
                  Free
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500 bg-background/80 text-amber-600 backdrop-blur-sm"
                >
                  <IndianRupee className="h-3 w-3" />
                  {internship.discountPrice ? (
                    <>
                      <span className="line-through opacity-60">
                        {internship.price}
                      </span>
                      <span className="font-semibold">
                        {internship.discountPrice}
                      </span>
                    </>
                  ) : (
                    internship.price
                  )}
                  {internship.paymentType === "monthly" && (
                    <span className="text-[10px] font-normal">/mo</span>
                  )}
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground">
                {timeAgo(internship.createdAt)}
              </span>
            </div>

            <button
              onClick={openDetails}
              className="absolute -bottom-6 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border bg-background shadow-sm transition-opacity hover:opacity-80"
            >
              {internship.image ? (
                <Image
                  src={internship.image}
                  alt={internship.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Briefcase className="h-6 w-6 text-primary" />
              )}
            </button>
          </div>

          {/* ================= HEADER ================= */}
          <div className="px-4 pt-8 pb-3">
            <button
              onClick={openDetails}
              className="block text-left text-base font-semibold leading-tight hover:underline"
            >
              {internship.name}
            </button>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
            </div>
          </div>

          {/* ================= DESCRIPTION ================= */}
          {internship.description && (
            <div className="px-4 pb-3">
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {internship.description}
              </p>
            </div>
          )}

          {/* ================= SKILLS ================= */}
          {visibleSkills.length > 0 && (
            <div className="px-4 pb-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="rounded-md px-2 py-0.5 text-[11px] font-normal"
                  >
                    {skill}
                  </Badge>
                ))}
                {extraSkills > 0 && (
                  <Badge
                    variant="outline"
                    className="rounded-md px-2 py-0.5 text-[11px] font-normal"
                  >
                    +{extraSkills} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* ================= QUALIFICATIONS ================= */}
          {internship.qualifications.length > 0 && (
            <div className="px-4 pb-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Requirements
              </p>
              <ul className="space-y-1">
                {internship.qualifications.slice(0, 2).map((q, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="line-clamp-1">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* ================= FOOTER / CTA ================= */}
          <div className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0">
              {isApplied ? (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Already applied
                </p>
              ) : internship.registrationOpen ? (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Registration open
                </p>
              ) : (
                <p className="text-xs font-medium text-muted-foreground">
                  Registration closed
                </p>
              )}

              <p className="truncate text-[11px] text-muted-foreground">
                {isApplied
                  ? "Application submitted"
                  : isFree
                  ? "Free — no cost to apply"
                  : "Limited seats available"}
              </p>
            </div>

            <div className="shrink-0">
              {isApplied ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={openDetails}
                >
                  View details
                </Button>
              ) : internship.registrationOpen ? (
                <Button size="sm" className="gap-1" onClick={openApply}>
                  {isFree ? "Apply now" : "Enroll now"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={openDetails}
                >
                  View details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= DRAWER ================= */}
      <InternshipDrawer
        internship={internship as any}
        open={drawerOpen}
        mode={drawerMode}
        onOpenChange={setDrawerOpen}
        onApplied={() => {
          setLocalApplied(true);
          setTimeout(() => {
            setDrawerMode("details");
            setDrawerOpen(true);
          }, 250);
        }}
      />
    </>
  );
}