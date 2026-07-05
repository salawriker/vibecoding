"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, leadNotes } from "@/db/schema";
import { isValidBasicAuth } from "@/lib/auth";
import {
  normalizeLead,
  validateLead,
  validateNoteBody,
  type LeadActionResult,
  type LeadValues,
} from "@/lib/validation";

export type MutateResult = LeadActionResult;

// 심층 방어: proxy가 /admin을 보호하지만, 서버 액션은 개별 POST 엔드포인트이므로
// (Next 문서 권고) 각 뮤테이션 내부에서도 인증을 다시 확인합니다.
async function isAdmin(): Promise<boolean> {
  const requestHeaders = await headers();
  return isValidBasicAuth(requestHeaders.get("authorization"));
}

// 어드민에서 리드를 수정합니다. 클라이언트에서 넘어온 값도 신뢰할 수 없으므로
// 서버에서 다시 검증합니다. (현재 인증 없음 — 추후 인가 검사 추가 지점)
export async function updateLead(
  id: string,
  values: LeadValues,
): Promise<MutateResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "권한이 없습니다." };
  }

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
  if (!(await isAdmin())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  try {
    await db.delete(leads).where(eq(leads.id, id));
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("리드 삭제 실패:", error);
    return { ok: false, message: "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// 메모 뮤테이션 결과 타입. 리드 검증과 무관하므로 별도로 단순하게 둡니다.
export type NoteResult = { ok: true } | { ok: false; message: string };

// 리드에 메모를 추가합니다. 리드당 여러 개를 시간순으로 쌓을 수 있습니다.
export async function addLeadNote(
  leadId: string,
  body: string,
): Promise<NoteResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  // 클라이언트와 동일한 규칙을 공유 헬퍼로 검증합니다(권위 있는 검증).
  const error = validateNoteBody(body);
  if (error) {
    return { ok: false, message: error };
  }
  const clean = body.trim();

  try {
    await db.insert(leadNotes).values({ leadId, body: clean });
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("메모 추가 실패:", error);
    return { ok: false, message: "메모 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// 메모를 개별 삭제합니다.
export async function deleteLeadNote(noteId: string): Promise<NoteResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "권한이 없습니다." };
  }

  try {
    await db.delete(leadNotes).where(eq(leadNotes.id, noteId));
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("메모 삭제 실패:", error);
    return { ok: false, message: "메모 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}
