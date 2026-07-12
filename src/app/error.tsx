"use client"; // 에러 바운더리는 반드시 클라이언트 컴포넌트여야 합니다.

import { useEffect } from "react";
import { reportError } from "./actions";

// 라우트 세그먼트에서 발생한 예상치 못한 예외를 잡는 바운더리.
// (검증 실패·DB 저장 실패는 서버 액션이 반환값으로 처리하므로 여기까지 오지 않습니다.)
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("처리되지 않은 오류:", error);
    // 관리자에게 이메일 알림(best-effort). 실패해도 화면에는 영향 없음.
    reportError({
      scope: "page",
      message: error.message,
      digest: error.digest,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    }).catch(() => {});
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600 dark:bg-red-500/15">
            !
          </div>
          <h1 className="text-lg font-semibold">일시적인 문제가 발생했습니다</h1>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            잠시 후 다시 시도해주세요. 문제가 계속되면 나중에 다시 방문해주세요.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-6 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          >
            다시 시도
          </button>
        </div>
      </div>
    </main>
  );
}
