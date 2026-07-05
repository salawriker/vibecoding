"use client";

import { useState, useTransition } from "react";
import {
  validateLead,
  type LeadValues,
  type LeadErrors,
} from "@/lib/validation";
import type { Lead, LeadNote } from "@/db/schema";
import {
  addLeadNote,
  deleteLead,
  deleteLeadNote,
  updateLead,
} from "./actions";

// 서버/클라이언트 렌더 결과가 일치하도록 로케일·타임존을 고정합니다.
// (locale/timezone을 고정해도 Node/브라우저 간 ICU 버전 차이로 미세하게 다를 수 있어
//  날짜 셀에는 suppressHydrationWarning을 함께 사용합니다.)
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

// aria-label은 스크린리더가 읽는 사용자 대상 텍스트이므로 한국어로 노출합니다.
const FIELD_LABELS: Record<keyof LeadValues, string> = {
  name: "이름",
  email: "이메일",
  phone: "전화번호",
};

// 표의 열 개수(이름·이메일·전화번호·접수일시·작업). 메모 패널 행의 colSpan에 사용합니다.
const COLUMN_COUNT = 5;

export function LeadsTable({
  leads,
  notesByLead,
}: {
  leads: Lead[];
  notesByLead: Record<string, LeadNote[]>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-black/[0.03] text-left text-xs font-medium uppercase tracking-wide text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            <th className="px-4 py-3 font-medium">이름</th>
            <th className="px-4 py-3 font-medium">이메일</th>
            <th className="px-4 py-3 font-medium">전화번호</th>
            <th className="px-4 py-3 font-medium">접수일시</th>
            <th className="px-4 py-3 text-right font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              notes={notesByLead[lead.id] ?? []}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadRow({ lead, notes }: { lead: Lead; notes: LeadNote[] }) {
  const [editing, setEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [values, setValues] = useState<LeadValues>({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
  });
  const [errors, setErrors] = useState<LeadErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setValues({ name: lead.name, email: lead.email, phone: lead.phone });
    setErrors({});
    setMessage(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setMessage(null);
  }

  const setField = (field: keyof LeadValues, value: string) =>
    setValues((s) => ({ ...s, [field]: value }));

  function save() {
    const nextErrors = validateLead(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setMessage(null);
    startTransition(async () => {
      const result = await updateLead(lead.id, values);
      if (result.ok) {
        setEditing(false);
      } else {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? null);
      }
    });
  }

  function remove() {
    if (!window.confirm(`'${lead.name}' 님의 리드를 삭제할까요?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (!result.ok) {
        setMessage(result.message ?? "삭제에 실패했습니다.");
      }
    });
  }

  const rowClass =
    "border-b border-black/[0.06] last:border-0 align-top dark:border-white/[0.06]";

  if (editing) {
    return (
      <tr className={rowClass}>
        <td className="px-4 py-3">
          <EditCell
            field="name"
            value={values.name}
            error={errors.name}
            onChange={setField}
          />
        </td>
        <td className="px-4 py-3">
          <EditCell
            field="email"
            type="email"
            value={values.email}
            error={errors.email}
            onChange={setField}
          />
        </td>
        <td className="px-4 py-3">
          <EditCell
            field="phone"
            type="tel"
            value={values.phone}
            error={errors.phone}
            onChange={setField}
          />
        </td>
        <td
          className="px-4 py-3 text-black/40 dark:text-white/40"
          suppressHydrationWarning
        >
          {dateFormatter.format(lead.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isPending}
              className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium transition hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
            >
              취소
            </button>
          </div>
          {message && (
            <p className="mt-2 text-right text-xs text-red-500">{message}</p>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className={rowClass}>
        <td className="px-4 py-3 font-medium">{lead.name}</td>
        <td className="px-4 py-3 text-black/70 dark:text-white/70">
          {lead.email}
        </td>
        <td className="px-4 py-3 text-black/70 dark:text-white/70">
          {lead.phone}
        </td>
        <td
          className="px-4 py-3 text-black/40 dark:text-white/40"
          suppressHydrationWarning
        >
          {dateFormatter.format(lead.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              aria-expanded={showNotes}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                showNotes
                  ? "border-foreground bg-black/5 dark:bg-white/10"
                  : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              }`}
            >
              메모{notes.length > 0 ? ` ${notes.length}` : ""}
            </button>
            <button
              type="button"
              onClick={startEdit}
              disabled={isPending}
              className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium transition hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
            >
              수정
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {isPending ? "처리 중..." : "삭제"}
            </button>
          </div>
          {message && (
            <p className="mt-2 text-right text-xs text-red-500">{message}</p>
          )}
        </td>
      </tr>
      {showNotes && (
        <tr className="border-b border-black/[0.06] bg-black/[0.015] dark:border-white/[0.06] dark:bg-white/[0.015]">
          <td colSpan={COLUMN_COUNT} className="px-4 py-4">
            <NotesPanel leadId={lead.id} notes={notes} />
          </td>
        </tr>
      )}
    </>
  );
}

function NotesPanel({
  leadId,
  notes,
}: {
  leadId: string;
  notes: LeadNote[];
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function add() {
    const clean = body.trim();
    if (!clean) {
      setError("메모 내용을 입력해주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addLeadNote(leadId, clean);
      if (result.ok) {
        setBody("");
      } else {
        setError(result.message);
      }
    });
  }

  function remove(noteId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteLeadNote(noteId);
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        메모
      </h3>

      {notes.length === 0 ? (
        <p className="mb-3 text-sm text-black/40 dark:text-white/40">
          아직 메모가 없습니다.
        </p>
      ) : (
        <ul className="mb-3 space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-black/10 bg-background px-3 py-2 dark:border-white/10"
            >
              <div className="min-w-0">
                <p className="whitespace-pre-wrap break-words text-sm">
                  {note.body}
                </p>
                <p
                  className="mt-1 text-xs text-black/40 dark:text-white/40"
                  suppressHydrationWarning
                >
                  {dateFormatter.format(note.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(note.id)}
                disabled={isPending}
                aria-label="메모 삭제"
                className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          aria-label="새 메모"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="메모를 입력하세요"
          className="w-full resize-y rounded-md border border-black/15 bg-transparent px-2.5 py-1.5 text-sm outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/20 dark:border-white/20"
        />
        <button
          type="button"
          onClick={add}
          disabled={isPending}
          className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "처리 중..." : "추가"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function EditCell({
  field,
  type = "text",
  value,
  error,
  onChange,
}: {
  field: keyof LeadValues;
  type?: string;
  value: string;
  error?: string;
  onChange: (field: keyof LeadValues, value: string) => void;
}) {
  return (
    <div>
      <input
        aria-label={FIELD_LABELS[field]}
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none transition focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-400/40"
            : "border-black/15 focus:border-foreground focus:ring-foreground/20 dark:border-white/20"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
