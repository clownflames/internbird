"use client";

import {
  Briefcase,
  Loader2,
  MapPin,
  Clock,
  Calendar,
  GraduationCap,
  User as UserIcon,
  Building2,
  BookOpen,
  Home,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { formatDate, statusBadge } from "./helpers";
import type { Registration } from "./types";

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export function DetailSheet({
  open,
  onOpenChange,
  detail,
  loadingDetail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: Registration | null;
  loadingDetail: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92vh] flex-col overflow-hidden rounded-t-2xl p-0 sm:max-w-full"
      >
        {/* HEADER */}
        <SheetHeader className="shrink-0 border-b bg-background px-6 py-4">
          <SheetTitle className="line-clamp-1">
            {detail?.internshipName ?? "Internship Details"}
          </SheetTitle>
          <SheetDescription>
            Read-only view of your registration details
          </SheetDescription>
        </SheetHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loadingDetail ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
              {/* ============================= */}
              {/* LEFT                          */}
              {/* ============================= */}
              <div className="flex flex-col gap-5">
                {/* Internship card */}
                <div className="overflow-hidden rounded-lg border">
                  <div className="relative h-40 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                    {detail.internshipImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={detail.internshipImage}
                        alt={detail.internshipName ?? "Internship"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Briefcase className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">
                        {detail.internshipName ?? "—"}
                      </h3>
                      {statusBadge(detail.status)}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {detail.internshipDescription || "No description"}
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
                      {detail.internshipMode && (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="capitalize">
                            {detail.internshipMode}
                          </span>
                        </span>
                      )}
                      {detail.internshipDuration && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {detail.internshipDuration}
                        </span>
                      )}
                      {detail.internshipLocation && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {detail.internshipLocation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule — startDate/endDate REMOVED */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Registration Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 pt-0 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        Registered On
                      </span>
                      <span className="font-medium">
                        {formatDate(detail.registeredAt)}
                      </span>
                    </div>

                    {detail.completedAt && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          Completed On
                        </span>
                        <span className="font-medium">
                          {formatDate(detail.completedAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills */}
                {detail.internshipSkills?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Skills You&apos;ll Learn
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 pt-0">
                      {detail.internshipSkills.map((skill, index) => (
                        <Badge key={`${skill}-${index}`} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Qualifications */}
                {detail.internshipQualifications?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Qualifications</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 pt-0">
                      {detail.internshipQualifications.map(
                        (qualification, index) => (
                          <Badge
                            key={`${qualification}-${index}`}
                            variant="outline"
                          >
                            {qualification}
                          </Badge>
                        )
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* ============================= */}
              {/* RIGHT                         */}
              {/* ============================= */}
              <div className="flex flex-col gap-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4" />
                      Your Registration Details
                    </CardTitle>
                    <CardDescription>
                      Details you submitted while registering
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="divide-y pt-0">
                    <DetailRow
                      icon={<GraduationCap className="h-4 w-4" />}
                      label="University"
                      value={detail.university}
                    />
                    <DetailRow
                      icon={<Building2 className="h-4 w-4" />}
                      label="College"
                      value={detail.collegeName}
                    />
                    <DetailRow
                      icon={<BookOpen className="h-4 w-4" />}
                      label="Degree"
                      value={detail.degree}
                    />
                    <DetailRow
                      icon={<BookOpen className="h-4 w-4" />}
                      label="Branch"
                      value={detail.branch}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Academic Year"
                      value={detail.academicYear}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Semester"
                      value={detail.semester?.toString()}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="Passing Year"
                      value={detail.passingYear?.toString()}
                    />
                    <DetailRow
                      icon={<Home className="h-4 w-4" />}
                      label="Address"
                      value={detail.address}
                    />
                  </CardContent>
                </Card>

                {detail.aboutUser && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">About You</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground whitespace-pre-wrap">
                      {detail.aboutUser}
                    </CardContent>
                  </Card>
                )}

                <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
                  Need to update your details? Please contact the
                  administrator. Registration details can&apos;t be edited once
                  submitted.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}