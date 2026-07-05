import type { Metadata } from "next";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { leads, leadNotes, type LeadNote } from "@/db/schema";
import { LeadsTable } from "./leads-table";

export const metadata: Metadata = {
  title: "리드 관리",
};

// 접수된 리드를 항상 최신 상태로 보여주기 위해 요청 시마다 렌더링합니다.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));

  // 리드별 메모를 한 번의 쿼리로 가져와(N+1 방지) 리드 id 기준으로 그룹핑합니다.
  // 오래된 것부터 최신 순으로 정렬해 대화처럼 위에서 아래로 쌓이게 합니다.
  const notesByLead = new Map<string, LeadNote[]>();
  if (rows.length > 0) {
    const notes = await db
      .select()
      .from(leadNotes)
      .where(
        inArray(
          leadNotes.leadId,
          rows.map((r) => r.id),
        ),
      )
      .orderBy(leadNotes.createdAt);
    for (const note of notes) {
      const bucket = notesByLead.get(note.leadId);
      if (bucket) bucket.push(note);
      else notesByLead.set(note.leadId, [note]);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">리드 관리</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            접수된 상담 신청을 조회, 수정, 삭제할 수 있습니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-black/5 px-3 py-1 text-sm font-medium tabular-nums dark:bg-white/10">
          총 {rows.length}건
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 px-6 py-16 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
          아직 접수된 리드가 없습니다.
        </div>
      ) : (
        <LeadsTable
          leads={rows}
          notesByLead={Object.fromEntries(notesByLead)}
        />
      )}
    </main>
  );
}
