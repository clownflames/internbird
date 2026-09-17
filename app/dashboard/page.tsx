import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {session.user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* baaki dashboard content */}
    </div>
  );
}