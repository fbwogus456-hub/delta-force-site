"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function BoardWritePage() {
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("글이 등록되었습니다!");
    router.push("/board");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="border-b border-white/10 pb-5">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">
            Tactical Board
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            글쓰기
          </h1>
          <p className="mt-2 text-xs text-zinc-400">
            현재는 테스트 모드입니다. 작성된 내용은 실제로 저장되지 않습니다.
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
              className="h-9 rounded-md border border-white/15 bg-black/70 px-3 text-xs text-zinc-100 outline-none ring-yellow-400/40 focus:border-yellow-400 focus:ring"
              defaultValue="팁"
            >
              <option value="팁">팁</option>
              <option value="질문">질문</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              제목
            </label>
            <input
              name="title"
              placeholder="예) 항구 맵 B거점 수비 루트 정리"
              className="h-9 rounded-md border border-white/15 bg-black/70 px-3 text-xs text-zinc-100 outline-none ring-yellow-400/40 placeholder:text-zinc-600 focus:border-yellow-400 focus:ring"
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
              className="min-h-[220px] rounded-md border border-white/15 bg-black/70 px-3 py-2 text-xs text-zinc-100 outline-none ring-yellow-400/40 placeholder:text-zinc-600 focus:border-yellow-400 focus:ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 text-xs">
            <button
              type="button"
              onClick={() => router.push("/board")}
              className="rounded-md border border-white/15 bg-black/60 px-4 py-2 font-semibold text-zinc-300 hover:border-zinc-400 hover:bg-black/80"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-yellow-400 px-5 py-2 font-semibold text-black shadow-lg shadow-yellow-500/40 hover:bg-yellow-300"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




