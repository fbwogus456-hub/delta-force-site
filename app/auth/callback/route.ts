import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  
  // next 파라미터가 있으면 사용, 없으면 홈으로
  const next = requestUrl.searchParams.get("next") ?? "/";
  
  // 현재 요청의 origin 사용 (이전 사이트로 가지 않도록)
  const redirectUrl = new URL(next, requestUrl.origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("세션 교환 오류:", error);
      // 에러가 발생해도 홈으로 리다이렉트
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }
  }

  // 현재 사이트의 홈으로 리다이렉트
  return NextResponse.redirect(redirectUrl);
}



