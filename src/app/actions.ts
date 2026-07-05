"use server";

import { after } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { sendLeadNotification } from "@/lib/email";
import { normalizeLead, validateLead, type LeadActionResult } from "@/lib/validation";

export type CreateLeadState = LeadActionResult;

// useActionState용 폼 액션. 서버 액션은 UI를 거치지 않고 직접 호출될 수 있으므로
// 여기서 검증을 다시 수행합니다.
export async function createLead(
  _prevState: CreateLeadState | null,
  formData: FormData,
): Promise<CreateLeadState> {
  const values = normalizeLead({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  const errors = validateLead(values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  try {
    await db.insert(leads).values(values);

    // 관리자 알림 이메일 (best-effort). 응답을 지연시키지 않도록 응답 후 실행합니다.
    after(() => sendLeadNotification(values));

    return { ok: true };
  } catch (error) {
    console.error("리드 저장 실패:", error);
    return {
      ok: false,
      message: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      values,
    };
  }
}
