"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-zinc-800" />
    );
  }

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url;
    const username = user.user_metadata?.full_name || user.user_metadata?.preferred_username || user.email?.split("@")[0] || "User";

    return (
      <div className="flex items-center gap-3">
        {avatarUrl && (
          <Link href="/profile" className="transition-opacity hover:opacity-80">
            <Image
              src={avatarUrl}
              alt={username}
              width={32}
              height={32}
              className="rounded-full ring-2 ring-yellow-400/50 cursor-pointer"
            />
          </Link>
        )}
        <div className="flex flex-col items-end">
          <Link
            href="/profile"
            className="text-xs font-medium text-white hover:text-yellow-400 transition-colors"
          >
            {username}
          </Link>
          <button
            onClick={handleLogout}
            className="text-[10px] text-zinc-400 hover:text-yellow-400 transition-colors"
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

