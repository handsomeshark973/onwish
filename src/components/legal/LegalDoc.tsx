import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Section = { h: string; p?: string[]; ul?: string[] };

// 번역 파일의 간단한 표시를 화면 요소로 바꾼다: <b>굵게</b>, [[/주소|링크 글자]], {변수}
function inline(text: string, vars: Record<string, string | number>): ReactNode[] {
  const filled = text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
  return filled.split(/(<b>.*?<\/b>|\[\[[^\]]+\]\])/g).map((part, i) => {
    const b = part.match(/^<b>(.*)<\/b>$/);
    if (b) return <strong key={i}>{b[1]}</strong>;
    const l = part.match(/^\[\[(\/[^|\]]*)\|([^\]]+)\]\]$/);
    if (l) return <Link key={i} href={l[1]}>{l[2]}</Link>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function LegalDoc({ title, effective, lead, sections, vars = {} }: { title: string; effective: string; lead: string; sections: Section[]; vars?: Record<string, string | number> }) {
  return (
    <article className="ow-article">
      <h1 className="ow-h1">{title}</h1>
      <p className="ow-meta">{effective}</p>
      <p className="ow-article-lead">{lead}</p>
      {sections.map((s, i) => (
        <section key={i}>
          <h2>{s.h}</h2>
          {s.p?.map((p, j) => <p key={`p${j}`}>{inline(p, vars)}</p>)}
          {s.ul && <ul>{s.ul.map((li, j) => <li key={j}>{inline(li, vars)}</li>)}</ul>}
        </section>
      ))}
    </article>
  );
}
