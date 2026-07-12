import { Resend } from "resend";
import type { LeadValues } from "@/lib/validation";

const apiKey = process.env.RESEND_API_KEY;
// 도메인 인증 없이 쓰려면 onboarding@resend.dev (Resend 계정 소유 이메일로만 배달됨).
const from = process.env.RESEND_FROM || "onboarding@resend.dev";
const adminEmail = process.env.ADMIN_EMAIL;

// db/supabase 클라이언트처럼 모듈 로드 시 한 번만 생성합니다.
const resend = apiKey ? new Resend(apiKey) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// RESEND_FROM이 이미 "이름 <주소>" 형식이면 그대로 사용(이중 래핑 방지).
function fromWithLabel(label: string): string {
  return from.includes("<") ? from : `${label} <${from}>`;
}

// best-effort: 키가 없거나 발송에 실패해도 예외를 던지지 않아 리드 저장 흐름을 막지 않습니다.
export async function sendLeadNotification(lead: LeadValues): Promise<void> {
  if (!resend || !adminEmail) {
    console.warn(
      "RESEND_API_KEY 또는 ADMIN_EMAIL 미설정 — 리드 알림 이메일을 건너뜁니다.",
    );
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromWithLabel("리드 알림"),
      to: adminEmail,
      replyTo: lead.email,
      subject: `새 리드 접수: ${lead.name}`,
      html: `
        <h2>새 리드가 접수되었습니다</h2>
        <ul>
          <li><strong>이름:</strong> ${escapeHtml(lead.name)}</li>
          <li><strong>이메일:</strong> ${escapeHtml(lead.email)}</li>
          <li><strong>전화번호:</strong> ${escapeHtml(lead.phone)}</li>
          <li><strong>문의 내용:</strong> ${
            lead.message
              ? escapeHtml(lead.message).replace(/\n/g, "<br>")
              : "(없음)"
          }</li>
        </ul>
      `,
    });

    if (error) {
      console.error("리드 알림 이메일 발송 실패:", error);
    }
  } catch (error) {
    console.error("리드 알림 이메일 발송 중 예외:", error);
  }
}

export type ErrorReport = {
  message: string;
  digest?: string;
  url?: string;
  scope?: string; // "page" | "global" 등 어느 바운더리에서 잡혔는지
};

// 같은 오류가 반복(렌더 루프)되거나 공개 엔드포인트가 남용될 때
// 관리자 메일함이 폭주하지 않도록 동일 메시지는 일정 시간 1건만 발송합니다.
// (서버리스에서는 인스턴스별 메모리라 완벽하진 않지만 대량 발송을 크게 줄여줍니다.)
const THROTTLE_MS = 60_000;
const recentErrorSends = new Map<string, number>();

// best-effort: 알림 발송 실패가 앱 흐름에 영향을 주지 않습니다.
export async function sendErrorNotification(report: ErrorReport): Promise<void> {
  if (!resend || !adminEmail) {
    console.warn(
      "RESEND_API_KEY 또는 ADMIN_EMAIL 미설정 — 오류 알림 이메일을 건너뜁니다.",
    );
    return;
  }

  const now = Date.now();
  const key = `${report.scope ?? "unknown"}:${report.message}`;
  const last = recentErrorSends.get(key);
  if (last && now - last < THROTTLE_MS) {
    return; // 최근에 동일 오류를 이미 알렸으므로 건너뜀
  }
  recentErrorSends.set(key, now);
  // 오래된 항목 정리(맵이 무한정 커지지 않도록).
  for (const [k, t] of recentErrorSends) {
    if (now - t > THROTTLE_MS) recentErrorSends.delete(k);
  }

  try {
    const { error } = await resend.emails.send({
      from: fromWithLabel("사이트 오류 알림"),
      to: adminEmail,
      subject: `⚠️ 사이트 오류 발생 (${report.scope ?? "unknown"})`,
      html: `
        <h2>처리되지 않은 오류가 발생했습니다</h2>
        <ul>
          <li><strong>범위:</strong> ${escapeHtml(report.scope ?? "unknown")}</li>
          <li><strong>메시지:</strong> ${escapeHtml(report.message)}</li>
          <li><strong>digest:</strong> ${escapeHtml(report.digest ?? "-")}</li>
          <li><strong>URL:</strong> ${escapeHtml(report.url ?? "-")}</li>
        </ul>
        <p style="color:#888;font-size:12px">프로덕션에서는 보안상 메시지가 일반 문구로 대체될 수 있으며, digest로 서버 로그와 대조할 수 있습니다.</p>
      `,
    });

    if (error) {
      console.error("오류 알림 이메일 발송 실패:", error);
    }
  } catch (err) {
    console.error("오류 알림 이메일 발송 중 예외:", err);
  }
}
