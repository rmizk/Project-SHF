import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { OrganizationProvider } from "@/components/OrganizationProvider";
import { getCurrentOrganization } from "@/lib/organization";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Le proxy protège déjà les routes ; ceci couvre le cas limite d'une
  // session valide sans organisation associée.
  const organization = await getCurrentOrganization();
  if (!organization) {
    redirect("/connexion");
  }

  return (
    <OrganizationProvider organization={organization}>
      <div className="flex min-h-screen flex-col">
        <Sidebar />
        <div className="flex flex-1 flex-col pb-16 lg:pb-0 lg:pl-60">
          <TopBar />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </OrganizationProvider>
  );
}
