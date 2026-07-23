"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/Skeleton";

function Guard({
  children,
  title,
  subtitle,
  actions,
  admin,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  admin?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (admin && user.role !== "ADMIN") router.replace("/");
  }, [user, loading, admin, router]);

  if (loading || !user || (admin && user.role !== "ADMIN")) {
    return <PageSkeleton />;
  }

  return (
    <AppShell title={title} subtitle={subtitle} actions={actions}>
      {children}
    </AppShell>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

export function AuthedShell({
  children,
  title,
  subtitle,
  actions,
  admin,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  admin?: boolean;
}) {
  return (
    <Guard title={title} subtitle={subtitle} actions={actions} admin={admin}>
      {children}
    </Guard>
  );
}
