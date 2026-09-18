"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Award,
  Eye,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Ban,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Trophy,
  Copy,
  ScrollText,
  Download,
  Gift,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  getMyCertificates,
  getMyCertificateDetail,
  type MyCertificate,
} from "./actions";

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

function statusBadge(status: MyCertificate["status"]) {
  const map: Record<
    MyCertificate["status"],
    { label: string; className: string; icon: React.ReactNode }
  > = {
    draft: {
      label: "Draft",
      className: "bg-gray-500 text-white",
      icon: <Clock className="h-3 w-3" />,
    },
    issued: {
      label: "Issued",
      className: "bg-green-600 hover:bg-green-700 text-white",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    revoked: {
      label: "Revoked",
      className: "bg-red-600 hover:bg-red-700 text-white",
      icon: <Ban className="h-3 w-3" />,
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

function typeBadge(type: "paid" | "unpaid") {
  if (type === "paid") {
    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full border-emerald-500/40 bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
      >
        <BadgeCheck className="h-2.5 w-2.5" />
        Paid
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-full border-muted-foreground/30 bg-muted/40 text-[10px] font-medium text-muted-foreground"
    >
      <Gift className="h-2.5 w-2.5" />
      Unpaid
    </Badge>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MyCertificatesPage() {
  const [items, setItems] = useState<MyCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<MyCertificate | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ---------- load list ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCertificates();
        if (res.success) setItems(res.data);
        else toast.error(res.error ?? "Failed to load certificates");
      } catch {
        toast.error("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- open drawer ---------- */
  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await getMyCertificateDetail(id);
      if (res.success && res.data) setDetail(res.data);
      else {
        toast.error(res.error ?? "Failed to load");
        setDrawerOpen(false);
      }
    } catch {
      toast.error("Failed to load");
      setDrawerOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ---------- copy code ---------- */
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Verification code copied");
  };

  /* ---------- grouping ---------- */
  const { active, revoked } = useMemo(() => {
    const active: MyCertificate[] = [];
    const revoked: MyCertificate[] = [];
    for (const it of items) {
      if (it.status === "issued") active.push(it);
      else revoked.push(it);
    }
    return { active, revoked };
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
        <p className="text-sm text-muted-foreground">
          View and download your internship completion certificates.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Award className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No certificates yet</p>
              <p className="text-sm text-muted-foreground">
                Your completion certificates will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              Issued
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-xs"
              >
                {active.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="revoked" className="gap-2">
              Revoked
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-xs"
              >
                {revoked.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {active.length === 0 ? (
              <EmptyBlock />
            ) : (
              <CertificatesTable items={active} onView={openDetail} />
            )}
          </TabsContent>

          <TabsContent value="revoked" className="mt-6">
            {revoked.length === 0 ? (
              <EmptyBlock />
            ) : (
              <CertificatesTable items={revoked} onView={openDetail} />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* =========================================================
          DETAIL DRAWER
      ========================================================= */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} modal>
        <SheetContent
          side="bottom"
          className="flex h-[92vh] flex-col overflow-hidden rounded-t-2xl p-0 sm:max-w-full"
        >
          <SheetHeader className="shrink-0 border-b bg-background px-6 py-4">
            <SheetTitle className="line-clamp-1">
              {detail?.title ?? "Certificate"}
            </SheetTitle>
            <SheetDescription>
              {detail ? (
                <>
                  <span className="font-mono">
                    {detail.certificateNumber}
                  </span>{" "}
                  · {detail.internshipName}
                </>
              ) : (
                "Loading..."
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loadingDetail ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : detail ? (
              <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                {/* LEFT */}
                <div className="flex flex-col gap-5">
                  <Card className="overflow-hidden border-amber-500/30">
                    <div className="relative h-40 w-full bg-gradient-to-br from-amber-400/30 via-yellow-200/20 to-transparent dark:from-amber-500/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500/50 bg-background shadow">
                          <Award className="h-12 w-12 text-amber-600" />
                        </div>
                      </div>
                      <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                        {statusBadge(detail.status)}
                        {typeBadge(detail.documentType)}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                        Certificate of Completion
                      </p>
                      <h3 className="mt-2 text-center text-lg font-bold">
                        {detail.studentName}
                      </h3>
                      <p className="mt-1 text-center text-sm text-muted-foreground">
                        has successfully completed
                      </p>
                      <p className="mt-1 text-center text-base font-semibold">
                        {detail.internshipName}
                      </p>
                      {detail.position && (
                        <p className="mt-0.5 text-center text-xs text-muted-foreground">
                          as {detail.position}
                        </p>
                      )}

                      <Separator className="my-4" />

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Grade
                          </p>
                          <p className="text-sm font-semibold">
                            {detail.grade ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Score
                          </p>
                          <p className="text-sm font-semibold">
                            {detail.score ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Issued
                          </p>
                          <p className="text-sm font-semibold">
                            {formatDate(detail.issueDate)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Download PDF button */}
                  <Button  className="w-full gap-2" size="lg">
                    <a
                      href={`/api/documents/certificate/${detail.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="h-4 w-4" />
                      Download Certificate PDF
                    </a>
                  </Button>

                  {/* Verification */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Verification
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Share this code to verify the certificate
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                        <code className="flex-1 font-mono text-xs">
                          {detail.verificationCode}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => copyCode(detail.verificationCode)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-5">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4" />
                        Internship Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y pt-0 text-sm">
                      <InfoRow
                        icon={<Briefcase className="h-4 w-4" />}
                        label="Program"
                        value={detail.internshipName}
                      />
                      {detail.internshipMode && (
                        <InfoRow
                          icon={<Sparkles className="h-4 w-4" />}
                          label="Mode"
                          value={
                            <span className="capitalize">
                              {detail.internshipMode}
                            </span>
                          }
                        />
                      )}
                      {detail.internshipLocation && (
                        <InfoRow
                          icon={<MapPin className="h-4 w-4" />}
                          label="Location"
                          value={detail.internshipLocation}
                        />
                      )}
                      {detail.internshipDuration && (
                        <InfoRow
                          icon={<Clock className="h-4 w-4" />}
                          label="Duration"
                          value={detail.internshipDuration}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y pt-0 text-sm">
                      <InfoRow
                        icon={<Calendar className="h-4 w-4" />}
                        label="Start Date"
                        value={formatDate(detail.startDate)}
                      />
                      <InfoRow
                        icon={<Calendar className="h-4 w-4" />}
                        label="End Date"
                        value={formatDate(detail.endDate)}
                      />
                      <InfoRow
                        icon={<Calendar className="h-4 w-4" />}
                        label="Issued On"
                        value={formatDate(detail.issueDate)}
                      />
                    </CardContent>
                  </Card>

                  {detail.skills.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Sparkles className="h-4 w-4" />
                          Skills Acquired
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2 pt-0">
                        {detail.skills.map((s, i) => (
                          <Badge key={i} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {detail.description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <ScrollText className="h-4 w-4" />
                          Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="whitespace-pre-wrap pt-0 text-sm text-muted-foreground">
                        {detail.description}
                      </CardContent>
                    </Card>
                  )}

                  <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
                    This is a digital view of your certificate. For any issues,
                    please contact the administrator.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function CertificatesTable({
  items,
  onView,
}: {
  items: MyCertificate[];
  onView: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate #</TableHead>
              <TableHead>Internship</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Grade / Score</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nothing here.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs font-medium">
                        {item.certificateNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {item.internshipName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.position ?? "—"}
                  </TableCell>
                  <TableCell>{typeBadge(item.documentType)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      {item.grade && (
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {item.grade}
                        </span>
                      )}
                      {item.score && (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {item.score}
                        </span>
                      )}
                      {!item.grade && !item.score && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.issueDate)}
                  </TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onView(item.id)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {item.status === "issued" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-primary hover:text-primary"
                        
                          title="Download PDF"
                        >
                          <a
                            href={`/api/documents/certificate/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function EmptyBlock() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Award className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Nothing here</p>
          <p className="text-sm text-muted-foreground">
            No certificates in this category.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
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
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}