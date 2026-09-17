"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    ClipboardList,
    BarChart3,
    Users,
    CreditCard,
    Award,
    FileBadge,
    LogOut,
    ChevronDown,
    FolderHeart,
    FolderBookmark,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AdminPayload } from "./layout";

const NAV_ITEMS = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Internships", url: "/admin/internships", icon: Briefcase },
    { title: "Pages", url: "/admin/pages", icon: FileText },
    { title: "Projects", url: "/admin/projects", icon: FolderHeart },
    { title: "Project Submissions", url: "/admin/project-submissions", icon: FolderBookmark },

    { title: "Exams", url: "/admin/exams", icon: ClipboardList },
    { title: "Exam Results", url: "/admin/exam-results", icon: BarChart3 },
    { title: "Registrations", url: "/admin/registrations", icon: Users },
    { title: "Payments", url: "/admin/payments", icon: CreditCard },
    { title: "Certificates", url: "/admin/certificates", icon: Award },
    { title: "Offer Letters", url: "/admin/offer-letters", icon: FileBadge },
];

export function AdminDashboardClient({ admin }: { admin: AdminPayload }) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/admin/logout", { method: "POST" });
        toast.success("Logged out");
        router.push("/admin/login");
        router.refresh();
    }

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <LayoutDashboard className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Admin Panel</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    Manage everything
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map((item) => {
                                const isActive =
                                    item.url === "/admin"
                                        ? pathname === "/admin"
                                        : pathname.startsWith(item.url);

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            render={<Link href={item.url} />}
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="outline" />}>
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={admin.image || "/admin.png"}
                                        alt={admin.username}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {admin.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {admin.username}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Administrator
                                    </span>
                                </div>

                                <ChevronDown className="ml-auto size-4" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                className="min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                                <AvatarImage
                                                    src={admin.image || "/admin.png"}
                                                    alt={admin.username}
                                                />
                                                <AvatarFallback className="rounded-lg">
                                                    {admin.username.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">
                                                    {admin.username}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    Administrator
                                                </span>
                                            </div>

                                            <Badge variant="secondary" className="text-[10px]">
                                                Admin
                                            </Badge>
                                        </div>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 size-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}