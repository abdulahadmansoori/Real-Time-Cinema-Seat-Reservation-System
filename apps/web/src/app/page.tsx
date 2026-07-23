"use client";

import { AuthedShell } from "@/components/layout/Providers";
import { BookingPanel } from "@/features/seats/BookingPanel";

export default function HomePage() {
  return (
    <AuthedShell title="Book seats" subtitle="Pick seats live — conflicts resolve instantly across users.">
      <BookingPanel />
    </AuthedShell>
  );
}
