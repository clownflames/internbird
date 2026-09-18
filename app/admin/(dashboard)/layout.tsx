import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminDashboardClient } from "./AdminDashboardClient";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-me";

export type AdminPayload = {
  username: string;
  role: "admin";
  image: string;
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  let admin: AdminPayload | null = null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (decoded.role !== "admin") {
      redirect("/admin/login");
    }
    admin = decoded;
  } catch {
    redirect("/admin/login");
  }

  return (
    <SidebarProvider>
      <AdminDashboardClient admin={admin} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}