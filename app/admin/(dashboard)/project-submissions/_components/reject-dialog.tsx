"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, XCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { AdminSubmission } from "../actions";

export function RejectDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: AdminSubmission | null;
  onClose: () => void;
  onConfirm: (sub: AdminSubmission, feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setFeedback("");
      setError(null);
      setSubmitting(false);
    }
  }, [target]);

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = feedback.trim();
    if (trimmed.length < 5) {
      setError("Please provide a reason (min 5 characters)");
      return;
    }

    setSubmitting(true);
    onConfirm(target!, trimmed);
  }

  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject submission?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Rejecting{" "}
            <span className="font-semibold">
              {target?.userName}
            </span>
            &apos;s submission for{" "}
            <span className="font-semibold">{target?.projectTitle}</span>.
            The student will see your feedback and can resubmit.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reject-feedback" className="text-xs">
            Reason for rejection <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reject-feedback"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Explain what needs to be improved..."
            disabled={submitting}
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject submission
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}