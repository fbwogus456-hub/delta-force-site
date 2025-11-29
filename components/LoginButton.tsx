"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase 클라이언트 초기화 (에러 처리 포함)
  const supabase: SupabaseClient | null = useMemo(() => {
    try {
      return createClient();
    } catch (err) {
      console.error("Supabase 클라이언트 초기화 실패:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Supabase 클라이언트가 없으면 에러 상태 설정
    if (!supabase) {
      setError("Supabase 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.");
      setLoading(false);
      return;
    }

    const fetchProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", userId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("프로필 로드 오류:", error);
        }

        return profile?.nickname || null;
      } catch (err) {
        console.error("프로필 조회 중 오류:", err);
        return null;
      }
    };

    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("사용자 인증 오류:", error);
          setLoading(false);
          return;
        }

        setUser(user);
        
        // 프로필에서 닉네임 가져오기
        if (user) {
          const profileNickname = await fetchProfile(user.id);
          
          setNickname(
            profileNickname ||
            user.user_metadata?.preferred_username ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User"
          );
        } else {
          setNickname(null);
        }
      } catch (err) {
        console.error("사용자 정보 로드 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // 프로필에서 닉네임 가져오기
      if (session?.user) {
        const profileNickname = await fetchProfile(session.user.id);
        
        setNickname(
          profileNickname ||
          session.user.user_metadata?.preferred_username ||
          session.user.user_metadata?.full_name ||
          session.user.email?.split("@")[0] ||
          "User"
        );
      } else {
        setNickname(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    // Supabase 클라이언트 확인
    if (!supabase) {
      alert("로그인 기능을 사용할 수 없습니다. Supabase 설정을 확인해주세요.");
      console.error("Supabase 클라이언트가 초기화되지 않았습니다.");
      return;
    }

    // 이미 로그인 중이면 중복 실행 방지
    if (isLoggingIn) {
      console.log("로그인 진행 중입니다...");
      return;
    }

    try {
      setIsLoggingIn(true);
      setError(null);
      console.log("디스코드 로그인 시작...");

      // 로컬 환경 감지: localhost 또는 127.0.0.1인 경우 항상 window.location.origin 사용
      // 프로덕션 환경에서만 NEXT_PUBLIC_SITE_URL 사용
      let origin = "";
      
      if (typeof window !== "undefined") {
        const isLocal = 
          window.location.hostname === "localhost" || 
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.startsWith("192.168.") ||
          window.location.hostname.startsWith("10.");
        
        if (isLocal) {
          // 로컬 환경: 항상 현재 origin 사용
          origin = window.location.origin;
        } else {
          // 프로덕션 환경: NEXT_PUBLIC_SITE_URL 우선, 없으면 현재 origin
          origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        }
      } else {
        // SSR 환경: 환경 변수 사용
        origin = process.env.NEXT_PUBLIC_SITE_URL || "";
      }
      
      console.log("사용할 Origin:", origin);
      
      if (!origin) {
        console.error("Origin을 가져올 수 없습니다.");
        setError("로그인 설정에 문제가 있습니다. 페이지를 새로고침해주세요.");
        alert("로그인 설정에 문제가 있습니다. 페이지를 새로고침해주세요.");
        setIsLoggingIn(false);
        return;
      }

      console.log("Supabase OAuth 요청 시작...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
        },
      });

      // 에러 처리: error가 있으면 즉시 반환
      if (error) {
        console.error("로그인 오류:", error);
        setError(error.message || "로그인에 실패했습니다.");
        alert(`로그인에 실패했습니다: ${error.message}`);
        setIsLoggingIn(false);
        return;
      }

      console.log("로그인 응답 데이터:", data);

      // data.url이 존재하는지 확인하고 즉시 리다이렉트
      if (data?.url) {
        console.log("디스코드 인증 페이지로 리다이렉트:", data.url);
        window.location.assign(data.url);
      } else {
        console.error("로그인 URL을 가져올 수 없습니다. data:", data);
        setError("로그인 페이지로 이동할 수 없습니다.");
        alert("로그인 페이지로 이동할 수 없습니다. 다시 시도해주세요.");
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error("로그인 중 오류:", err);
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      alert(`로그인 중 오류가 발생했습니다: ${errorMessage}`);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 상태 먼저 초기화
      setUser(null);
      setNickname(null);
      
      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut({
        scope: "global"
      });
      
      if (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃에 실패했습니다. 다시 시도해주세요.");
        // 에러가 발생해도 페이지 새로고침
        window.location.href = "/";
        return;
      }
      
      // 로그아웃 성공 후 홈으로 리다이렉트
      window.location.href = "/";
    } catch (err) {
      console.error("로그아웃 중 오류:", err);
      // 에러가 발생해도 페이지 새로고침하여 상태 초기화
      window.location.href = "/";
    }
  };

  // Supabase 클라이언트가 없으면 에러 메시지 표시
  if (!supabase) {
    return (
      <div className="text-xs text-red-400 px-2 py-1">
        로그인 불가
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-zinc-800" />
    );
  }

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";
    const displayName = nickname || user.user_metadata?.preferred_username || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

    return (
      <div className="flex items-center gap-3">
        <Link href="/profile" className="transition-opacity hover:opacity-80">
          <Image
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-cyan-400/50 cursor-pointer"
          />
        </Link>
        <div className="flex flex-col items-end">
          <Link
            href="/profile"
            className="text-xs font-medium text-white hover:text-cyan-400 transition-colors"
          >
            {displayName}
          </Link>
          <button
            onClick={handleLogout}
            className="text-[10px] text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleLogin}
        disabled={isLoggingIn}
        className="rounded-md bg-[#5865F2] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
      >
        {isLoggingIn ? "로그인 중..." : "디스코드로 로그인"}
      </button>
      {error && (
        <span className="text-[10px] text-red-400 max-w-[200px] text-right">
          {error}
        </span>
      )}
    </div>
  );
}

