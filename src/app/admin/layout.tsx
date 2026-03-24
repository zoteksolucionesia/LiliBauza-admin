"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin";
import { colors } from "@/lib/theme";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
