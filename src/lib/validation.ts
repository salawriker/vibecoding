// 클라이언트(즉시 피드백)와 서버 액션(권위 있는 검증)이 공유하는 리드 검증 로직.

export type LeadValues = {
  name: string;
  email: string;
  phone: string;
};

export type LeadErrors = Partial<Record<keyof LeadValues, string>>;

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
