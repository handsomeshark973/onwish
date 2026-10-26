import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ComponentShowcase } from "./ComponentShowcase";

export const metadata: Metadata = { title: "부품 확인" };

// 개발 중 부품을 한눈에 보는 화면. 배포(production)에서는 열리지 않는다.
export default async function DevPage({ params }: PageProps<"/[locale]/dev">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <>
      <h1 className="ow-h1">공통 부품 확인</h1>
      <ComponentShowcase />
    </>
  );
}
