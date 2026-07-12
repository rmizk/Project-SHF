import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-16 lg:pb-0 lg:pl-60">
        <TopBar />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
