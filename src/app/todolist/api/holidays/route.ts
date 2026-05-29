import { NextRequest, NextResponse } from "next/server";

interface HolidayItem {
  dateName: string;
  locdate: number;
  isHoliday: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const key = process.env.HOLIDAY_API_KEY;

  if (!key || !year || !month) {
    return NextResponse.json({ items: [] });
  }

  try {
    const url = new URL(
      "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
    );
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("solYear", year);
    url.searchParams.set("solMonth", month.padStart(2, "0"));
    url.searchParams.set("_type", "json");
    url.searchParams.set("numOfRows", "20");

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    const json = await res.json();

    const raw = json?.response?.body?.items?.item ?? [];
    const items: HolidayItem[] = Array.isArray(raw) ? raw : [raw];

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
