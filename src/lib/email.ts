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
      // RESEND_FROM이 이미 "이름 <주소>" 형식이면 그대로 사용(이중 래핑 방지).
      from: from.includes("<") ? from : `리드 알림 <${from}>`,
      to: adminEmail,
      replyTo: lead.email,
      subject: `새 리드 접수: ${lead.name}`,
      html: `
        <h2>새 리드가 접수되었습니다</h2>
        <ul>
          <li><strong>이름:</strong> ${escapeHtml(lead.name)}</li>
          <li><strong>이메일:</strong> ${escapeHtml(lead.email)}</li>
          <li><strong>전화번호:</strong> ${escapeHtml(lead.phone)}</li>
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
