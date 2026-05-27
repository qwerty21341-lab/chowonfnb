import { redirect } from "next/navigation";
import { hasLocale } from "@/dictionaries";

export async function generateStaticParams() {
  return [{ lang: "ko" }, { lang: "en" }];
}

export default async function LangIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    redirect("/ko/danso");
  }

  redirect(`/${lang}/danso`);
}
