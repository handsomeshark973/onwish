import { useTranslations } from "next-intl";

type Props = {
  name: string;
  src?: string; // 공식 스토어·보도자료 이미지. 권리를 확인하지 못하면 비워 둔다(자리 표시자가 나온다)
  alt?: string;
  source?: string; // 출처. 이미지가 있을 때만 캡션으로 보여 준다
  variant?: "card" | "hero";
};

// 게임 이미지 한 곳. 이미지·대체 글·출처·자리 표시자 규칙을 여기서만 정한다.
export function GameImage({ name, src, alt, source, variant = "card" }: Props) {
  const t = useTranslations("game");
  const g = useTranslations("gameImage");
  return (
    <figure className={`ow-media ow-media-${variant}`}>
      <div className="ow-media-frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? t("imageAlt", { name })} loading={variant === "hero" ? "eager" : "lazy"} />
        ) : (
          <span className="ow-media-placeholder" role="img" aria-label={t("imagePending", { name })}>
            <span aria-hidden="true">{name.slice(0, 1)}</span>
            <span className="ow-media-pending" aria-hidden="true">{g("pending")}</span>
          </span>
        )}
      </div>
      {src && source && <figcaption className="ow-meta">{t("imageSource", { source })}</figcaption>}
    </figure>
  );
}
