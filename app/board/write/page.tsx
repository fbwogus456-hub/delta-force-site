"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function BoardWritePage() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const category = formData.get("category") as string;
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;

      if (!title.trim() || !content.trim()) {
        alert("제목과 본문을 모두 입력해주세요.");
        setSubmitting(false);
        return;
      }

      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("로그인이 필요합니다.");
        router.push("/");
        return;
      }

      // 프로필에서 닉네임 가져오기
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();

      const author = profile?.nickname || user.user_metadata?.preferred_username || user.email?.split("@")[0] || "Anonymous";

      // 로컬스토리지에서 기존 게시글 가져오기
      const existingPosts = JSON.parse(localStorage.getItem("boardPosts") || "[]");
      
      // 새 게시글 ID 생성 (기존 최대값 + 1)
      const maxId = existingPosts.length > 0 
        ? Math.max(...existingPosts.map((p: any) => p.id))
        : 100;
      const newId = maxId + 1;

      // 새 게시글 생성
      const newPost = {
        id: newId,
        category: category as "팁" | "질문" | "자유",
        title: title.trim(),
        author: author,
        date: new Date().toISOString().split("T")[0],
        views: 0,
        recommends: 0,
        comments: 0,
        content: content.trim(),
        userId: user.id,
      };

      // 로컬스토리지에 저장
      const updatedPosts = [newPost, ...existingPosts];
      localStorage.setItem("boardPosts", JSON.stringify(updatedPosts));

      alert("글이 등록되었습니다!");
      router.push("/board");
    } catch (error) {
      console.error("글 등록 오류:", error);
      alert("글 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="border-b border-white/10 pb-5">
          <p className="text-xs uppercase tracking-[0.4em] bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Information Sharing
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            글쓰기
          </h1>
          <p className="mt-2 text-xs text-zinc-400">
            전술 팁, 질문, 자유로운 의견을 공유해주세요.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              카테고리
            </label>
            <select
              name="category"
              className="h-9 rounded-md border border-white/15 bg-black/70 px-3 text-xs text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400 focus:ring"
              defaultValue="팁"
              required
            >
              <option value="팁">팁</option>
              <option value="질문">질문</option>
              <option value="자유">자유</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              제목
            </label>
            <input
              name="title"
              placeholder="예) 항구 맵 B거점 수비 루트 정리"
              className="h-9 rounded-md border border-white/15 bg-black/70 px-3 text-xs text-zinc-100 outline-none ring-cyan-400/40 placeholder:text-zinc-600 focus:border-cyan-400 focus:ring"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              본문
            </label>
            <textarea
              name="content"
              placeholder="전술 팁, 시야각, 동선, 부착물 세팅 등 공유하고 싶은 내용을 자유롭게 적어 주세요."
              className="min-h-[220px] rounded-md border border-white/15 bg-black/70 px-3 py-2 text-xs text-zinc-100 outline-none ring-cyan-400/40 placeholder:text-zinc-600 focus:border-cyan-400 focus:ring resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 text-xs">
            <button
              type="button"
              onClick={() => router.push("/board")}
              className="rounded-md border border-white/15 bg-black/60 px-4 py-2 font-semibold text-zinc-300 hover:border-zinc-400 hover:bg-black/80 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2 font-semibold text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
