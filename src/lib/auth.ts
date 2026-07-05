// Basic Auth 자격 검증 — proxy(라우트 보호)와 어드민 서버 액션(심층 방어)에서 공유합니다.
// 순수 함수만 두어 proxy 런타임에서도 안전하게 import할 수 있게 합니다.

const expectedUser = process.env.ADMIN_USER || "admin";
const expectedPassword = process.env.ADMIN_PASSWORD;

export function isValidBasicAuth(
  authHeader: string | null | undefined,
): boolean {
  // 비밀번호가 설정되지 않았으면 모든 접근을 차단합니다(안전한 기본값).
  if (!expectedPassword) return false;
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    // atob는 UTF-8 디코딩을 하지 않으므로 TextDecoder로 정확히 복원합니다.
    const binary = atob(authHeader.slice("Basic ".length).trim());
    decoded = new TextDecoder().decode(
      Uint8Array.from(binary, (ch) => ch.charCodeAt(0)),
    );
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  return user === expectedUser && password === expectedPassword;
}
