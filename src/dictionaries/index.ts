import type koJson from "./ko.json";

export type Dict = typeof koJson;
export type Locale = "ko" | "en";

export const locales: Locale[] = ["ko", "en"];
export const defaultLocale: Locale = "ko";

export function hasLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

const dictionaries: Record<Locale, () => Promise<Dict>> = {
  ko: () => import("./ko.json").then((m) => m.default as Dict),
  en: () => import("./en.json").then((m) => m.default as Dict),
};

export async function getDictionary(locale: Locale): Promise<Dict> {
  return dictionaries[locale]();
}
