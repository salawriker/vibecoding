"use client";

import { useState, type FormEvent } from "react";

type FormValues = {
  name: string;
  email: string;
  phone: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  name: "",
  email: "",
  phone: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "이름을 입력해주세요.";
  }

  if (!values.email.trim()) {
    errors.email = "이메일을 입력해주세요.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "올바른 이메일 형식이 아닙니다.";
  }

  if (!values.phone.trim()) {
    errors.phone = "전화번호를 입력해주세요.";
  } else if (!/^[0-9-+\s()]{7,20}$/.test(values.phone.trim())) {
    errors.phone = "올바른 전화번호 형식이 아닙니다.";
  }

  return errors;
}

export default function Home() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // TODO: 서버/DB 연동 예정. 지금은 프론트엔드만 동작합니다.
    console.log("제출된 리드:", values);
    setSubmitted(true);
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setSubmitted(false);
  }

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

          {submitted ? (
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
                onClick={handleReset}
                className="mt-6 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                다시 신청하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Field
                id="name"
                label="이름"
                type="text"
                placeholder="홍길동"
                autoComplete="name"
                value={values.name}
                onChange={handleChange("name")}
                error={errors.name}
              />
              <Field
                id="email"
                label="이메일"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={values.email}
                onChange={handleChange("email")}
                error={errors.email}
              />
              <Field
                id="phone"
                label="전화번호"
                type="tel"
                placeholder="010-1234-5678"
                autoComplete="tel"
                value={values.phone}
                onChange={handleChange("phone")}
                error={errors.phone}
              />

              <button
                type="submit"
                className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
              >
                신청하기
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-black/40 dark:text-white/40">
          제출하신 정보는 상담 목적으로만 사용됩니다.
        </p>
      </div>
    </main>
  );
}

type FieldProps = {
  id: keyof FormValues;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  value,
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
        value={value}
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
