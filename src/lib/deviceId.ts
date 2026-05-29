/**
 * 브라우저 fingerprint 기반 기기 ID 생성
 * - 동일 브라우저/기기에서는 항상 같은 ID
 * - localStorage에 캐시하여 성능 최적화
 */

const STORAGE_KEY = "tduri_device_id";

function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // unsigned 32-bit
  }
  return hash.toString(16).padStart(8, "0");
}

function buildFingerprint(): string {
  const parts: string[] = [];

  // 브라우저/OS 정보
  parts.push(navigator.userAgent);
  parts.push(navigator.language);
  parts.push(navigator.platform ?? "");
  parts.push(String(navigator.hardwareConcurrency ?? 0));

  // 화면 정보
  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  parts.push(String(screen.pixelDepth ?? 0));

  // 타임존
  parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // 캔버스 fingerprint (가벼운 버전)
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("tduri-fp", 2, 15);
      ctx.fillStyle = "rgba(102,204,0,0.7)";
      ctx.fillText("tduri-fp", 4, 17);
      parts.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    parts.push("no-canvas");
  }

  return hashString(parts.join("|"));
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  const fp = buildFingerprint();
  const id = `dev_${fp}`;
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
