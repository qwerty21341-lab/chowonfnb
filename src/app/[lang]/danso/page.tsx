import { getDictionary, hasLocale } from "@/dictionaries";
import { DansoPage } from "./danso-client";
import { notFound } from "next/navigation";
import type { Locale } from "@/dictionaries";

export async function generateStaticParams() {
  return [{ lang: "ko" }, { lang: "en" }];
}

export default async function DansoRoute({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang as Locale);
  return <DansoPage dict={dict} lang={lang as Locale} />;
}
