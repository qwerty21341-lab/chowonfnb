import { hasLocale, type Locale } from "@/dictionaries";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { notFound } from "next/navigation";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  return (
    <>
      <LanguageSwitcher lang={lang as Locale} />
      <div data-lang={lang} style={{ display: "contents" }}>
        {children}
      </div>
    </>
  );
}
