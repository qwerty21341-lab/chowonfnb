"use client";

import { useEffect, useState } from "react";
import { getLicenseStatus, hasAccess, type LicenseStatus } from "./license";

export function useLicense() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);

  useEffect(() => {
    setStatus(getLicenseStatus());
  }, []);

  const refresh = () => setStatus(getLicenseStatus());

  return {
    status,
    loading: status === null,
    allowed: status ? hasAccess(status) : false,
    refresh,
  };
}
