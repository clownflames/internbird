"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Eye,
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Ban,
  Briefcase,
  ScrollText,
  Gift,
  BadgeCheck,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getMyOfferLetters,
  getMyOfferLetterDetail,
  type MyOfferLetter,
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

function statusBadge(status: MyOfferLetter["status"]) {
  const map: Record<
    MyOfferLetter["status"],
    { label: string; className: string; icon: React.ReactNode }
  > = {
    draft: {
      label: "Draft",
      className: "bg-gray-500 text-white",
      icon: <Clock className="h-3 w-3" />,
    },
    issued: {
      label: "Issued",
      className: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: <Send className="h-3 w-3" />,
    },
    accepted: {
      label: "Accepted",
      className: "bg-green-600 hover:bg-green-700 text-white",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-600 hover:bg-red-700 text-white",
      icon: <XCircle className="h-3 w-3" />,
    },
    revoked: {
      label: "Revoked",
      className: "bg-gray-700 text-white",
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

export default function MyOfferLettersPage() {
  const [items, setItems] = useState<MyOfferLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<MyOfferLetter | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ---------- load list ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyOfferLetters();
        if (res.success) setItems(res.data);
        else toast.error(res.error ?? "Failed to load offer letters");
      } catch {
        toast.error("Failed to load offer letters");
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
      const res = await getMyOfferLetterDetail(id);
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

  /* ---------- grouping ---------- */
  const { active, archived } = useMemo(() => {
    const active: MyOfferLetter[] = [];
    const archived: MyOfferLetter[] = [];
    for (const it of items) {
      if (it.status === "issued" || it.status === "accepted") active.push(it);
      else archived.push(it);
    }
    return { active, archived };
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offer Letters</h1>
        <p className="text-sm text-muted-foreground">
          View your internship offer letters.
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
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No offer letters</p>
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any offer letters yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              Active
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-xs"
              >
                {active.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              Archived
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-xs"
              >
                {archived.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {active.length === 0 ? (
              <EmptyBlock />
            ) : (
              <OfferLettersTable items={active} onView={openDetail} />
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            {archived.length === 0 ? (
              <EmptyBlock />
            ) : (
              <OfferLettersTable items={archived} onView={openDetail} />
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
              {detail?.position ?? "Offer Letter"}
            </SheetTitle>
            <SheetDescription>
              {detail ? (
                <>
                  <span className="font-mono">{detail.offerNumber}</span> ·{" "}
                  {detail.internshipName ?? "—"}
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
                  <Card>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Offer Number
                            </p>
                            <p className="font-mono text-sm font-semibold">
                              {detail.offerNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {statusBadge(detail.status)}
                          {typeBadge(detail.documentType)}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Position
                        </p>
                        <p className="text-base font-semibold">
                          {detail.position}
                        </p>
                        {detail.department && (
                          <p className="text-xs text-muted-foreground">
                            {detail.department}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4" />
                        Internship
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y pt-0 text-sm">
                      <InfoRow
                        icon={<Building2 className="h-4 w-4" />}
                        label="Program"
                        value={detail.internshipName ?? "—"}
                      />
                      {detail.internshipMode && (
                        <InfoRow
                          icon={<Briefcase className="h-4 w-4" />}
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
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-5">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Schedule & Compensation
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
                        label="Issue Date"
                        value={formatDate(detail.issueDate)}
                      />
                      <InfoRow
                        icon={<IndianRupee className="h-4 w-4" />}
                        label="Stipend"
                        value={
                          detail.documentType === "paid" && detail.stipend
                            ? `${detail.stipend} ${detail.stipendCurrency ?? "INR"}`
                            : "Unpaid"
                        }
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ScrollText className="h-4 w-4" />
                        Terms & Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground">
                      {detail.terms ? (
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {detail.terms}
                        </div>
                      ) : (
                        <p className="italic text-xs">
                          No terms provided.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
                    This is a system-generated view of your offer letter. For
                    any corrections, please contact the administrator.
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

function OfferLettersTable({
  items,
  onView,
}: {
  items: MyOfferLetter[];
  onView: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Offer #</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Internship</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stipend</TableHead>
              <TableHead>Start — End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px] text-right">Actions</TableHead>
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
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs font-medium">
                        {item.offerNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {item.position}
                      </span>
                      {item.department && (
                        <span className="text-xs text-muted-foreground">
                          {item.department}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {item.internshipName ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>{typeBadge(item.documentType)}</TableCell>
                  <TableCell className="text-sm">
                    {item.documentType === "paid" && item.stipend ? (
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {item.stipend}
                        <span className="text-xs text-muted-foreground">
                          {item.stipendCurrency ?? "INR"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.startDate)}
                    {item.endDate ? ` → ${formatDate(item.endDate)}` : ""}
                  </TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onView(item.id)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-primary hover:text-primary"
                        
                        title="Download PDF"
                      >
                        <a
                          href={`/api/documents/offer-letter/${item.id}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onView(item.id)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Nothing here</p>
          <p className="text-sm text-muted-foreground">
            No offer letters in this category.
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