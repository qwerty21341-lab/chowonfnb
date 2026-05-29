"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLicense } from "@/lib/useLicense";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { status, loading, allowed } = useLicense();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/todolist/activate");
    }
  }, [loading, allowed]); // eslint-disable-line

  if (loading || !status) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
