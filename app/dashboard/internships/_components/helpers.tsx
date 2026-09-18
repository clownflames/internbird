import {
  CheckCircle2,
  XCircle,
  Clock3,
  Ban,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RegistrationStatus } from "./types";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusBadge(status: RegistrationStatus) {
  const map: Record<
    RegistrationStatus,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  > = {
    pending: {
      label: "Pending",
      className: "bg-yellow-500 hover:bg-yellow-600 text-white",
      icon: <Clock3 className="h-3 w-3" />,
    },
    active: {
      label: "Active",
      className: "bg-green-600 hover:bg-green-700 text-white",
      icon: <UserCheck className="h-3 w-3" />,
    },
    completed: {
      label: "Completed",
      className: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-500 hover:bg-gray-600 text-white",
      icon: <Ban className="h-3 w-3" />,
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-600 hover:bg-red-700 text-white",
      icon: <XCircle className="h-3 w-3" />,
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