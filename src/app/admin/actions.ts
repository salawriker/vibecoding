"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import {
  normalizeLead,
  validateLead,
  type LeadActionResult,
  type LeadValues,
} from "@/lib/validation";

export type MutateResult = LeadActionResult;

// 어드민에서 리드를 수정합니다. 클라이언트에서 넘어온 값도 신뢰할 수 없으므로
// 서버에서 다시 검증합니다. (현재 인증 없음 — 추후 인가 검사 추가 지점)
export async function updateLead(
  id: string,
  values: LeadValues,
): Promise<MutateResult> {
  const clean = normalizeLead(values);

  const errors = validateLead(clean);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  try {
    await db.update(leads).set(clean).where(eq(leads.id, id));
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("리드 수정 실패:", error);
    return { ok: false, message: "수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// 어드민에서 리드를 삭제합니다.
export async function deleteLead(id: string): Promise<MutateResult> {
  try {
    await db.delete(leads).where(eq(leads.id, id));
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("리드 삭제 실패:", error);
    return { ok: false, message: "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
