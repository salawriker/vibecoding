// Next.js 16 클라이언트 계측: HTML 로드 후·React 하이드레이션 전에 실행됩니다.
// PostHog(제품 분석)를 이 시점에 초기화해 초기 페이지뷰까지 놓치지 않도록 합니다.
import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// 리전별 수집 엔드포인트. 미설정 시 US 클라우드를 기본값으로 둡니다.
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
// 배포(프로덕션) 환경에서만 계측합니다. 로컬 개발(npm run dev)에서는
// 테스트 활동이 분석 데이터에 섞이지 않도록 초기화 자체를 건너뜁니다.
const isProduction = process.env.NODE_ENV === "production";

// 키가 없거나 개발 환경이면 초기화를 건너뛰어 앱이 정상 동작하게 합니다.
// analytics 헬퍼도 같은 조건으로 no-op 처리되므로 이벤트 호출은 안전합니다.
if (key && isProduction) {
  try {
    posthog.init(key, {
      api_host: apiHost,
      // PostHog 최신 권장 기본값 묶음: 자동 캡처, 히스토리 변경 기반 페이지뷰/이탈,
      // 예외 캡처 등을 한 번에 켭니다.
      defaults: "2025-05-24",
      // 세션 리플레이는 PostHog 프로젝트 설정에서 켜면 기록됩니다.
      // 입력 필드 텍스트(이름·이메일·전화번호)는 기본 마스킹되어 저장되지 않습니다.
    });
  } catch (error) {
    // 계측 실패가 앱 동작을 막지 않도록 삼킵니다.
    console.error("PostHog 초기화 실패:", error);
  }
}
