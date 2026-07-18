import { requireSuperAdmin } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSuperAdmin();

  // Badge compteur des demandes en attente (sidebar + bottom nav)
  const admin = createAdminClient();
  const { count } = await admin
    .from("organization_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const pendingCount = count ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <AdminSidebar pendingCount={pendingCount} />
      <div className="flex flex-1 flex-col pb-16 lg:pb-0 lg:pl-60">
        <AdminTopBar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <AdminBottomNav pendingCount={pendingCount} />
    </div>
  );
}
