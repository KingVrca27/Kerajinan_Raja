"use client";

import React from "react";
import { AdminAuthProvider } from "@/src/context/AdminAuthContext";
import AdminLayout from "@/src/components/admin/AdminLayout";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthProvider>
  );
}
