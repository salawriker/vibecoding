// 클라이언트(즉시 피드백)와 서버 액션(권위 있는 검증)이 공유하는 리드 검증 로직.

export type LeadValues = {
  name: string;
  email: string;
  phone: string;
};

export type LeadErrors = Partial<Record<keyof LeadValues, string>>;

// 리드를 다루는 서버 액션들이 공유하는 결과 타입.
export type LeadActionResult =
  | { ok: true }
  | { ok: false; errors?: LeadErrors; message?: string; values?: LeadValues };

// 원본 입력(FormData 값, 클라이언트 객체 등)을 신뢰 가능한 LeadValues로 정규화합니다.
// input 자체가 null/undefined거나, 각 필드가 문자열이 아닌 경우(FormData의 File 등)도 안전하게 처리합니다.
export function normalizeLead(
  input?: { name?: unknown; email?: unknown; phone?: unknown } | null,
): LeadValues {
  const clean = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  return {
    name: clean(input?.name),
    email: clean(input?.email),
    phone: clean(input?.phone),
  };
}

export function validateLead(values: LeadValues): LeadErrors {
  const errors: LeadErrors = {};

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
