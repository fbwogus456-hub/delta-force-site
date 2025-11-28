"use client";

import Link from "next/link";
import newsData from "../data/news.json";

type NewsCategory = "업데이트" | "이벤트" | "공지";

type NewsItem = {
  id: string;
  title: string;
  category: NewsCategory;
  date: string;
  summary: string;
  content: string;
  imageUrl: string;
};

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  업데이트: "bg-blue-500/20 text-blue-300 border-blue-500/60",
  이벤트: "bg-emerald-500/20 text-emerald-300 border-emerald-500/60",
  공지: "bg-red-500/20 text-red-300 border-red-500/60",
};

const NEWS = newsData as NewsItem[];

export default function NewsPage() {
  const [main, ...rest] = NEWS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.4em] bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Intel Feed
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            작전 브리핑 & 패치 리포트
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            델타포스 전장에서 벌어지는 최신 업데이트, 이벤트, 공지 사항을 한 곳에서 확인하세요.
          </p>
        </header>

        <main className="grid gap-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
          {/* Main news */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900/70 to-black shadow-2xl shadow-black/50">
            <Link href={`/news/${main.id}`} className="flex h-full flex-col lg:flex-row">
              <div className="relative h-52 w-full overflow-hidden bg-zinc-900/80 lg:h-auto lg:w-2/5">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-blue-500/20" />
                {/* 썸네일 */}
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                    Tactical Briefing
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6 lg:p-7">
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${CATEGORY_COLORS[main.category]}`}
                  >
                    {main.category}
                  </span>
                  <span className="text-zinc-500">{main.date}</span>
                </div>
                <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
                  {main.title}
                </h2>
                <p className="line-clamp-4 text-sm text-zinc-300">
                  {main.summary}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-400">
                  <span>자세히 보기</span>
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                    Delta Force News
                  </span>
                </div>
              </div>
            </Link>
          </section>

          {/* Side list */}
          <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">
                최신 뉴스 리스트
              </h2>
              <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Live Feed
              </span>
            </div>
            <div className="space-y-3">
              {rest.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group flex gap-3 rounded-xl border border-transparent bg-zinc-900/50 px-3 py-3 text-sm transition-colors hover:border-cyan-500/60 hover:bg-zinc-900"
                >
                  <div className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-950/80 ring-1 ring-white/5 group-hover:ring-cyan-400/40" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${CATEGORY_COLORS[item.category]}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-zinc-500">{item.date}</span>
                    </div>
                    <p className="truncate text-xs font-semibold text-zinc-100">
                      {item.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] text-zinc-400">
                      {item.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}




