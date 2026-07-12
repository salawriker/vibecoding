"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createLead } from "./actions";
import {
  MAX_MESSAGE_LENGTH,
  normalizeLead,
  validateLead,
  type LeadValues as FormValues,
  type LeadErrors as FormErrors,
} from "@/lib/validation";
import { LeadEvent, identifyLead, trackEvent } from "@/lib/analytics";

export default function Home() {
  // 제출 완료 후 "다시 신청하기" 시 LeadForm을 리마운트해 상태를 초기화합니다.
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">무료 상담 신청</h1>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              아래 정보를 남겨주시면 빠르게 연락드리겠습니다.
            </p>
          </header>

          <LeadForm
            key={instanceKey}
            onReset={() => setInstanceKey((k) => k + 1)}
          />
        </div>

        <p className="mt-4 text-center text-xs text-black/40 dark:text-white/40">
          제출하신 정보는 상담 목적으로만 사용됩니다.
        </p>
      </div>
    </main>
  );
}

function LeadForm({ onReset }: { onReset: () => void }) {
  const [state, formAction, isPending] = useActionState(createLead, null);
  const [errors, setErrors] = useState<FormErrors>({});
  // 방문자가 폼 작성을 "시작"한 순간을 한 번만 기록하기 위한 플래그.
  const startedRef = useRef(false);

  // 제출이 서버에서 최종 성공하면 성공 이벤트를 한 번 기록합니다.
  useEffect(() => {
    if (state?.ok) {
      trackEvent(LeadEvent.SubmitSucceeded);
    }
  }, [state?.ok]);

  if (state?.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-500/15">
          ✓
        </div>
        <h2 className="text-lg font-semibold">신청이 완료되었습니다</h2>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          입력하신 정보로 곧 연락드리겠습니다.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          다시 신청하기
        </button>
      </div>
    );
  }

  // 클라이언트 즉시 검증. 오류가 있으면 preventDefault로 서버 액션 실행을 막습니다.
  // (JS가 없으면 이 핸들러는 실행되지 않고 서버 액션이 검증을 담당합니다.)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const values = normalizeLead({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      message: formData.get("message"),
    });

    const nextErrors = validateLead(values);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      trackEvent(LeadEvent.ValidationFailed, {
        fields: Object.keys(nextErrors),
      });
    } else {
      setErrors({});
      // 검증을 통과한 제출 시점에 세션을 이 잠재고객(이메일)에 연결하고
      // 제출 이벤트를 남깁니다. 이후 서버 액션이 실제 저장을 처리합니다.
      identifyLead(values.email, { name: values.name, phone: values.phone });
      trackEvent(LeadEvent.Submitted);
    }
  }

  // 첫 입력 시 "작성 시작"을 한 번만 기록합니다(퍼널 진입 지점).
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent(LeadEvent.FormStarted);
  }

  function clearError(field: keyof FormValues) {
    markStarted();
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const previous = state && !state.ok ? state.values : undefined;

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field
        id="name"
        label="이름"
        type="text"
        placeholder="홍길동"
        autoComplete="name"
        defaultValue={previous?.name}
        onChange={() => clearError("name")}
        error={errors.name}
      />
      <Field
        id="email"
        label="이메일"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        defaultValue={previous?.email}
        onChange={() => clearError("email")}
        error={errors.email}
      />
      <Field
        id="phone"
        label="전화번호"
        type="tel"
        placeholder="010-1234-5678"
        autoComplete="tel"
        defaultValue={previous?.phone}
        onChange={() => clearError("phone")}
        error={errors.phone}
      />
      <TextareaField
        id="message"
        label="문의 내용"
        optional
        placeholder="상담받고 싶은 내용을 자유롭게 남겨주세요. (선택)"
        defaultValue={previous?.message}
        onChange={() => clearError("message")}
        error={errors.message}
      />

      {state && !state.ok && (state.message || state.errors) && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
        >
          {state.message ?? "입력값을 다시 확인해주세요."}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "제출 중..." : "신청하기"}
      </button>
    </form>
  );
}

type FieldProps = {
  id: keyof FormValues;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  defaultValue?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  defaultValue,
  onChange,
  error,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none transition placeholder:text-black/30 focus:ring-2 dark:placeholder:text-white/30 ${
          error
            ? "border-red-400 focus:ring-red-400/40"
            : "border-black/15 focus:border-foreground focus:ring-foreground/20 dark:border-white/20"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

type TextareaFieldProps = {
  id: keyof FormValues;
  label: string;
  placeholder: string;
  optional?: boolean;
  defaultValue?: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
};

function TextareaField({
  id,
  label,
  placeholder,
  optional,
  defaultValue,
  onChange,
  error,
}: TextareaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-black/40 dark:text-white/40">
            (선택)
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={id}
        rows={4}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full resize-y rounded-lg border bg-transparent px-3.5 py-2.5 text-sm outline-none transition placeholder:text-black/30 focus:ring-2 dark:placeholder:text-white/30 ${
          error
            ? "border-red-400 focus:ring-red-400/40"
            : "border-black/15 focus:border-foreground focus:ring-foreground/20 dark:border-white/20"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
