/**
 * 라이선스 & 무료 체험 로직 (클라이언트 측)
 *
 * 상태 종류:
 *  - trial   : 7일 무료 체험 중
 *  - active  : 유효한 라이선스 키 활성화됨
 *  - expired : 체험 기간 만료 (키 입력 필요)
 */

import { getDeviceId } from "./deviceId";

const TRIAL_START_KEY = "tduri_trial_start";
const LICENSE_KEY_KEY = "tduri_license_key";
const LICENSE_EXPIRY_KEY = "tduri_license_expiry";
const TRIAL_DAYS = 7;

export type LicenseStatus =
  | { type: "trial"; daysLeft: number; expiresAt: Date }
  | { type: "active"; key: string; expiresAt: Date | null }
  | { type: "expired" };

/** 현재 라이선스 상태 반환 */
export function getLicenseStatus(): LicenseStatus {
  if (typeof window === "undefined") return { type: "expired" };

  // 활성 라이선스 키 체크
  const key = localStorage.getItem(LICENSE_KEY_KEY);
  const expiryStr = localStorage.getItem(LICENSE_EXPIRY_KEY);

  if (key) {
    const expiresAt = expiryStr ? new Date(expiryStr) : null;
    // null = 무기한 (관리자가 만료일 없이 발급)
    if (!expiresAt || expiresAt > new Date()) {
      return { type: "active", key, expiresAt };
    }
    // 만료된 키 → 제거
    localStorage.removeItem(LICENSE_KEY_KEY);
    localStorage.removeItem(LICENSE_EXPIRY_KEY);
  }

  // 체험 기간 체크
  const trialStartStr = localStorage.getItem(TRIAL_START_KEY);
  if (!trialStartStr) {
    // 첫 방문 → 체험 시작
    const now = new Date().toISOString();
    localStorage.setItem(TRIAL_START_KEY, now);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);
    return { type: "trial", daysLeft: TRIAL_DAYS, expiresAt };
  }

  const trialStart = new Date(trialStartStr);
  const expiresAt = new Date(trialStart);
  expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

  const now = new Date();
  if (now < expiresAt) {
    const msLeft = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return { type: "trial", daysLeft, expiresAt };
  }

  return { type: "expired" };
}

/** 라이선스 키 활성화 시도 (서버 API 호출) */
export async function activateLicense(inputKey: string): Promise<
  | { success: true; expiresAt: Date | null }
  | { success: false; error: string }
> {
  const deviceId = getDeviceId();
  const basePath = "/todolist";

  try {
    const res = await fetch(`${basePath}/api/license/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: inputKey.trim().toUpperCase(), deviceId }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error ?? "알 수 없는 오류" };
    }

    // 로컬에 저장
    localStorage.setItem(LICENSE_KEY_KEY, inputKey.trim().toUpperCase());
    if (data.expiresAt) {
      localStorage.setItem(LICENSE_EXPIRY_KEY, data.expiresAt);
    } else {
      localStorage.removeItem(LICENSE_EXPIRY_KEY);
    }

    return { success: true, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null };
  } catch {
    return { success: false, error: "네트워크 오류. 다시 시도해주세요." };
  }
}

/** 라이선스 접근 가능 여부 (trial + active = 허용) */
export function hasAccess(status: LicenseStatus): boolean {
  return status.type === "trial" || status.type === "active";
}

/** 현재 기기 ID 반환 (UI 표시용) */
export function getCurrentDeviceId(): string {
  return getDeviceId();
}
