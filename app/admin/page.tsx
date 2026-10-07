"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar, { type AdminTab } from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminInquiries from "@/components/admin/AdminInquiries";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminProjects from "@/components/admin/AdminProjects";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminAuthModal from "@/components/admin/AdminAuthModal";
import type { InquiryItem } from "@/app/api/admin/inquiries/route";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    try {
      const auth = sessionStorage.getItem("elvaveo_admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    } catch {
      // sessionStorage might fail in restricted environments
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem("elvaveo_admin_auth", "true");
    } catch {}
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem("elvaveo_admin_auth");
    } catch {}
  };

  // Fetch inquiries from API
  const fetchInquiries = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/inquiries");
      if (res.ok) {
        const data = await res.json();
        if (data.inquiries) {
          setInquiries(data.inquiries);
        }
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInquiries();
    }
  }, [isAuthenticated, fetchInquiries]);

  // Inquiries mutation handlers
  const handleUpdateStatus = async (
    id: string,
    status: "new" | "replied" | "archived"
  ) => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
    }
  };

  const handleAddInquiry = async (item: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inquiry) {
          setInquiries((prev) => [data.inquiry, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to add inquiry:", err);
    }
  };

  const unreadCount = inquiries.filter((i) => i.status === "new").length;

  if (!isAuthChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-ice">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuthModal onUnlock={handleUnlock} />;
  }

  return (
    <div className="relative min-h-screen bg-ice font-sans text-navy antialiased">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none fixed -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-cyan/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/3 -left-20 h-[500px] w-[500px] rounded-full bg-blue/10 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-32 right-10 h-[600px] w-[600px] rounded-full bg-violet/8 blur-[140px]"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadInquiriesCount={unreadCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLock={handleLock}
      />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col lg:pl-72">
        <AdminHeader
          currentTab={currentTab}
          onOpenMobile={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={fetchInquiries}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === "overview" && (
              <AdminOverview
                inquiries={inquiries}
                onSelectTab={setCurrentTab}
                onViewInquiry={() => setCurrentTab("inquiries")}
              />
            )}

            {currentTab === "inquiries" && (
              <AdminInquiries
                inquiries={inquiries}
                onUpdateStatus={handleUpdateStatus}
                onDeleteInquiry={handleDeleteInquiry}
                onAddInquiry={handleAddInquiry}
                searchQuery={searchQuery}
              />
            )}

            {currentTab === "products" && <AdminProducts />}

            {currentTab === "team" && <AdminTeam />}

            {currentTab === "projects" && <AdminProjects />}

            {currentTab === "settings" && <AdminSettings inquiries={inquiries} />}
          </div>
        </main>
      </div>
    </div>
  );
}
