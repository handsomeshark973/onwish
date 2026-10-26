import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  const t = useTranslations("notFound");
  return <EmptyState title={t("title")} hint={t("hint")} action={<ButtonLink href="/" variant="secondary">{t("home")}</ButtonLink>} />;
}
