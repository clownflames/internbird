"use client";

import {
  Loader2,
  Eye,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

import type { ExamResult } from "../actions";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function statusBadge(status: ExamResult["status"]) {
  const map = {
    started: {
      label: "Started",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: <PlayCircle className="h-2.5 w-2.5" />,
    },
    submitted: {
      label: "Submitted",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: <Send className="h-2.5 w-2.5" />,
    },
    evaluated: {
      label: "Evaluated",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-2.5 w-2.5" />,
    },
  } as const;
  const s = map[status];
  return (
    <Badge className={`gap-1 rounded-full border-0 text-[10px] font-medium ${s.className}`}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

export function ResultsTable({
  results,
  loading,
  onView,
  onReEvaluate,
  onDelete,
}: {
  results: ExamResult[];
  loading: boolean;
  onView: (id: string) => void;
  onReEvaluate: (id: string) => void;
  onDelete: (result: ExamResult) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Internship</TableHead>
              <TableHead>Attempt</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[70px] text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  No exam results found.
                </TableCell>
              </TableRow>
            ) : (
              results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={r.userImage ?? undefined}
                          alt={r.userName}
                        />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(r.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {r.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.userEmail}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {r.examTitle}
                      </span>
                      <Badge
                        variant="outline"
                        className="mt-0.5 w-fit capitalize text-[10px]"
                      >
                        {r.examType} exam
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.internshipName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      #{r.attemptNumber}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.score !== null && r.totalScore !== null ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {r.score}/{r.totalScore}
                        </span>
                        {r.percentage && (
                          <span className="text-xs text-muted-foreground">
                            {Number(r.percentage).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.passed === true ? (
                      <Badge className="gap-1 rounded-full bg-emerald-600 text-[10px] font-medium text-white hover:bg-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Passed
                      </Badge>
                    ) : r.passed === false ? (
                      <Badge className="gap-1 rounded-full bg-red-600 text-[10px] font-medium text-white hover:bg-red-700">
                        <XCircle className="h-2.5 w-2.5" />
                        Failed
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(r.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => onView(r.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </DropdownMenuItem>

                        {r.status === "submitted" && (
                          <DropdownMenuItem
                            onClick={() => onReEvaluate(r.id)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />{" "}
                            Re-evaluate
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onDelete(r)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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