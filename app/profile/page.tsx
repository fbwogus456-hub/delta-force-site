"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

type Profile = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      // profiles 테이블에서 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("프로필 로드 실패:", profileError);
        // 프로필이 없으면 기본값으로 설정
        setProfile({
          id: user.id,
          nickname: user.user_metadata?.preferred_username || user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
        setNickname(user.user_metadata?.preferred_username || user.user_metadata?.full_name || "");
      } else {
        setProfile(profileData);
        setNickname(profileData.nickname || "");
      }

      setLoading(false);
    };

    fetchUserAndProfile();
  }, [supabase, router]);

  const handleUpdateNickname = async () => {
    if (!user || !profile) return;

    // 2글자 이상 체크
    if (nickname.trim().length < 2) {
      setError("닉네임은 2글자 이상이어야 합니다.");
      return;
    }

    setError(null);
    setUpdating(true);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ nickname: nickname.trim() })
        .eq("id", user.id);

      if (updateError) {
        // Unique constraint 에러 체크
        if (updateError.code === "23505" || updateError.message.includes("unique")) {
          setError("이미 사용 중인 닉네임입니다.");
        } else {
          setError("닉네임 변경에 실패했습니다. 다시 시도해주세요.");
        }
        setUpdating(false);
        return;
      }

      // 성공
      alert("닉네임이 변경되었습니다.");
      window.location.reload();
    } catch (err) {
      console.error("업데이트 오류:", err);
      setError("예기치 않은 오류가 발생했습니다.");
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto mb-4" />
          <p>프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const avatarUrl = profile.avatar_url || user.user_metadata?.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";
  const displayNickname = profile.nickname || user.user_metadata?.preferred_username || user.user_metadata?.full_name || "닉네임 없음";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">
            User Profile
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            프로필 관리
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            닉네임을 변경하고 프로필을 관리하세요.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-lg shadow-black/40">
          {/* 아바타 및 현재 닉네임 표시 */}
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <Image
                src={avatarUrl}
                alt={displayNickname}
                width={96}
                height={96}
                className="rounded-full ring-4 ring-yellow-400/30"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                현재 닉네임
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {displayNickname}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {user.email}
              </p>
            </div>
          </div>

          {/* 닉네임 변경 폼 */}
          <div className="border-t border-white/10 pt-8">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              닉네임 변경
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError(null);
                }}
                placeholder="새 닉네임을 입력하세요 (2글자 이상)"
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
                disabled={updating}
              />
              <button
                onClick={handleUpdateNickname}
                disabled={updating || nickname.trim().length < 2}
                className="rounded-lg bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating ? "변경 중..." : "변경하기"}
              </button>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <p className="mt-3 text-sm font-medium text-red-400">
                {error}
              </p>
            )}

            {/* 안내 문구 */}
            <p className="mt-3 text-xs text-zinc-500">
              닉네임은 2글자 이상이어야 하며, 다른 사용자가 사용 중인 닉네임은 사용할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



