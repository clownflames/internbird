"use client";

import {
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  UploadCloud,
  Loader2,
  CheckCircle2,
  XCircle,
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

import type { Project } from "./types";

export function ProjectsTable({
  projects,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onTogglePublished,
}: {
  projects: Project[];
  loading: boolean;
  onEdit: (item: Project) => void;
  onDelete: (item: Project) => void;
  onToggleActive: (item: Project) => void;
  onTogglePublished: (item: Project) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Internship</TableHead>
              <TableHead>Unlock after</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
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
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {item.description || "No description"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {item.internshipName ?? "—"}
                  </TableCell>

                  <TableCell>
                    {item.examTitle ? (
                      <Badge variant="outline" className="capitalize">
                        {item.examTitle}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Always available
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {item.durationDays} days
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">
                      {item.passingScore}/{item.totalScore}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {item.isActive ? (
                        <Badge className="w-fit bg-green-600 hover:bg-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit">
                          Inactive
                        </Badge>
                      )}
                      {item.isPublished ? (
                        <Badge
                          variant="outline"
                          className="w-fit border-blue-500 text-blue-600"
                        >
                          Published
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="w-fit border-orange-500 text-orange-600"
                        >
                          Draft
                        </Badge>
                      )}
                    </div>
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
                            onClick={() => onTogglePublished(item)}
                          >
                            {item.isPublished ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />{" "}
                                Unpublish
                              </>
                            ) : (
                              <>
                                <UploadCloud className="mr-2 h-4 w-4" />{" "}
                                Publish
                              </>
                            )}
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