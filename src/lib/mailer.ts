import "server-only";

// 메일 보내기. 개발 환경에서는 실제로 보내지 않고 서버 콘솔에 링크를 찍는다.
// 실제 발송은 환경변수로 연결한다: AUTH_EMAIL_MODE=resend + RESEND_API_KEY + AUTH_EMAIL_FROM
//   console  : 서버 콘솔에 출력 (개발 기본값)
//   resend   : Resend로 우리 문구(한/영 템플릿)의 메일을 보낸다
//   supabase : Supabase가 자기 메일 양식으로 보낸다 (운영 기본값, Resend 키가 없을 때)
export type MailMode = "console" | "resend" | "supabase";

export function mailMode(): MailMode {
  const v = process.env.AUTH_EMAIL_MODE;
  if (v === "console" || v === "resend" || v === "supabase") return v;
  if (process.env.NODE_ENV !== "production") return "console";
  return process.env.RESEND_API_KEY ? "resend" : "supabase";
}

type Mail = { to: string; subject: string; html: string; text: string; link: string };

export async function sendMail(mail: Mail): Promise<boolean> {
  if (mailMode() === "resend") {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.AUTH_EMAIL_FROM;
    if (!key || !from) {
      console.error("[mail] RESEND_API_KEY / AUTH_EMAIL_FROM이 없어 메일을 보내지 못했습니다");
      return false;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) console.error("[mail] Resend 발송 실패", res.status);
    return res.ok;
  }
  // 개발: 메일 대신 링크를 콘솔에 출력한다
  console.log(`\n[개발용 메일] ${mail.subject}\n  받는 사람: ${mail.to}\n  링크: ${mail.link}\n`);
  return true;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function renderMail(opts: { subject: string; body: string; button: string; link: string }) {
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#17181a">
<p style="font-size:18px;font-weight:700;margin:0 0 16px">ONWISH</p>
<p style="line-height:1.6;margin:0 0 24px">${esc(opts.body)}</p>
<p style="margin:0 0 24px"><a href="${esc(opts.link)}" style="display:inline-block;background:#5a48e8;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700">${esc(opts.button)}</a></p>
<p style="font-size:12px;color:#5a5f6a;word-break:break-all;margin:0">${esc(opts.link)}</p></div>`;
  return { html, text: `${opts.body}\n\n${opts.link}` };
}
