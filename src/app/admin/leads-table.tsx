"use client";

import { useState, useTransition } from "react";
import {
  validateLead,
  type LeadValues,
  type LeadErrors,
} from "@/lib/validation";
import type { Lead } from "@/db/schema";
import { deleteLead, updateLead } from "./actions";

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

export function LeadsTable({ leads }: { leads: Lead[] }) {
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
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const [editing, setEditing] = useState(false);
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
    <tr className={rowClass}>
      <td className="px-4 py-3 font-medium">{lead.name}</td>
      <td className="px-4 py-3 text-black/70 dark:text-white/70">{lead.email}</td>
      <td className="px-4 py-3 text-black/70 dark:text-white/70">{lead.phone}</td>
      <td className="px-4 py-3 text-black/40 dark:text-white/40">
        {dateFormatter.format(lead.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
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
