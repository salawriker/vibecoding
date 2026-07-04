import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { LeadsTable } from "./leads-table";

export const metadata: Metadata = {
  title: "리드 관리",
};

// 접수된 리드를 항상 최신 상태로 보여주기 위해 요청 시마다 렌더링합니다.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));

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
        <LeadsTable leads={rows} />
      )}
    </main>
  );
}
