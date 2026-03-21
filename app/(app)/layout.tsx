import { Sidebar } from "@/components/Sidebar";

// All authenticated app pages share this layout (sidebar + main)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
