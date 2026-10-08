"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLoginPage from "@/components/admin/AdminLoginPage";

export default function AdminLoginRoute() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.replace("/admin");
            return;
          }
        }
      } catch {}
      setIsChecking(false);
    }
    checkAuth();
  }, [router]);

  const handleUnlock = () => {
    router.replace("/admin");
  };

  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#051124]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return <AdminLoginPage onUnlock={handleUnlock} />;
}
