"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
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
  }, [supabase]);

  const handleLogin = async () => {
    try {
      // NEXT_PUBLIC_SITE_URL 환경 변수를 우선적으로 사용, 없으면 window.location.origin 사용
      const origin = 
        process.env.NEXT_PUBLIC_SITE_URL || 
        (typeof window !== "undefined" ? window.location.origin : "");
      
      if (!origin) {
        console.error("Origin을 가져올 수 없습니다.");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
        },
      });

      if (error) {
        console.error("로그인 오류:", error);
        alert("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (err) {
      console.error("로그인 중 오류:", err);
      alert("로그인 중 오류가 발생했습니다.");
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
    <button
      onClick={handleLogin}
      className="rounded-md bg-[#5865F2] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4752C4]"
    >
      디스코드로 로그인
    </button>
  );
}

