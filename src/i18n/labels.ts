import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { TAXONOMY_KEYS } from "@/types/taxonomy";

type Tr = (key: string) => string;
type Group = keyof typeof TAXONOMY_KEYS;
export type Labels = { [G in Group]: Record<string, string> } & { appealHint: Record<string, string>; stageHint: Record<string, string> };

// 분류 이름(어필·단계·구도 등)을 현재 언어로 바꾼 표. 서버·클라이언트 컴포넌트 어디서나 쓴다.
export function buildLabels(t: Tr): Labels {
  const out = {} as Labels;
  for (const g of Object.keys(TAXONOMY_KEYS) as Group[]) {
    out[g] = Object.fromEntries(TAXONOMY_KEYS[g].map((k) => [k, t(`${g}.${k}`)]));
  }
  out.appealHint = Object.fromEntries(TAXONOMY_KEYS.appeal.map((k) => [k, t(`appealHint.${k}`)]));
  out.stageHint = Object.fromEntries(TAXONOMY_KEYS.stage.map((k) => [k, t(`stageHint.${k}`)]));
  return out;
}

/** 컴포넌트 안에서 */
export function useLabels(): Labels {
  return buildLabels(useTranslations("taxonomy") as unknown as Tr);
}

/** 비동기 서버 코드에서 */
export async function getLabels(locale?: string): Promise<Labels> {
  const t = locale ? await getTranslations({ locale, namespace: "taxonomy" }) : await getTranslations("taxonomy");
  return buildLabels(t as unknown as Tr);
}
