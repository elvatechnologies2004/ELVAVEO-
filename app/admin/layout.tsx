import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console | ELVAVEO",
  description:
    "ELVAVEO administration panel, inquiry management, and digital product dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-ice text-navy selection:bg-blue/20">{children}</div>;
}
