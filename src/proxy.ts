import { NextResponse, type NextRequest } from "next/server";
import { isValidBasicAuth } from "@/lib/auth";

// Next 16: middleware → proxy로 이름이 바뀐 파일 규약.
// /admin 경로(페이지 렌더 + 서버 액션 POST)를 Basic Auth로 보호합니다.
export function proxy(request: NextRequest) {
  if (isValidBasicAuth(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return new NextResponse("인증이 필요합니다.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"',
    },
  });
}

// "/admin" 자체와 그 하위 경로 모두 매칭합니다.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
