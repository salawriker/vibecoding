// PostHog 이벤트/신원 식별을 감싸는 얇은 헬퍼.
// 키가 없으면 no-op이 되도록 해, 계측 미설정 환경에서도 폼이 그대로 동작합니다.
import posthog from "posthog-js";

// 키가 있고 프로덕션(배포) 환경일 때만 활성화합니다. 로컬 개발에서는 no-op이 되어
// 테스트 활동이 분석 데이터에 남지 않습니다. (instrumentation-client의 초기화 조건과 일치)
const enabled =
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
  process.env.NODE_ENV === "production";

// 리드 폼 퍼널을 추적하는 이벤트 이름. 오타를 막기 위해 상수로 모아둡니다.
export const LeadEvent = {
  FormStarted: "lead_form_started",
  Submitted: "lead_form_submitted",
  ValidationFailed: "lead_form_validation_failed",
  SubmitSucceeded: "lead_submit_succeeded",
} as const;

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!enabled) return;
  posthog.capture(event, properties);
}

// 익명 세션 활동을 특정 잠재고객(이메일 기준)에 연결합니다.
export function identifyLead(
  email: string,
  props: { name: string; phone: string },
): void {
  if (!enabled) return;
  posthog.identify(email, { email, name: props.name, phone: props.phone });
}
