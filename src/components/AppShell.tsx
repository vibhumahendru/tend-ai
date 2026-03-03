"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";

// Routes that don't need the sidebar or auth checks
const PUBLIC_ROUTES = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // While checking auth, show a blank dark screen to avoid flash
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Public pages (login) — no sidebar, no padding
  if (isPublic) {
    return <>{children}</>;
  }

  // Authenticated app shell
  if (session) {
    return (
      <>
        <Sidebar />
        <main className="md:ml-60 min-h-screen p-4 pb-20 md:p-8 md:pb-8">
          {children}
        </main>
      </>
    );
  }

  // Not authenticated and not on a public route — show nothing
  // (each protected page handles its own redirect to /login)
  return (
    <main className="min-h-screen p-4 pb-20 md:p-8 md:pb-8">
      {children}
    </main>
  );
}
