"use client";

import {
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Clock,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

import type { Internship } from "./types";

export function InternshipsTable({
  internships,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleRegistration,
}: {
  internships: Internship[];
  loading: boolean;
  onEdit: (item: Internship) => void;
  onDelete: (item: Internship) => void;
  onToggleActive: (item: Internship) => void;
  onToggleRegistration: (item: Internship) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Internship</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead className="w-[70px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : internships.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No internships found.
                </TableCell>
              </TableRow>
            ) : (
              internships.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {item.description || "No description"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.mode}
                    </Badge>
                  </TableCell>

                  {/* ===== Pricing ===== */}
                  <TableCell>
                    {item.pricing === "free" ? (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-600"
                      >
                        Free
                      </Badge>
                    ) : (
                      <div className="flex flex-col">
                        {item.discountPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-green-600">
                              {item.currency} {item.discountPrice}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {item.currency} {item.price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold">
                            {item.currency} {item.price}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {item.paymentType === "one_time"
                            ? "One-time"
                            : "Monthly"}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {item.duration || "—"}
                  </TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.registrationOpen ? (
                      <Badge
                        variant="outline"
                        className="border-blue-500 text-blue-600"
                      >
                        Open
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-orange-500 text-orange-600"
                      >
                        Closed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleActive(item)}
                          >
                            {item.isActive ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" /> Mark
                                Inactive
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" /> Mark Active
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleRegistration(item)}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            {item.registrationOpen
                              ? "Close Registration"
                              : "Open Registration"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
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