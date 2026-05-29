import AppLayout from "@/components/layout/AppLayout";
import LicenseGuard from "@/components/LicenseGuard";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <LicenseGuard>
      <AppLayout>{children}</AppLayout>
    </LicenseGuard>
  );
}
