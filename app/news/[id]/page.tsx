import Link from "next/link";
import newsData from "../../data/news.json";

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

const NEWS = newsData as NewsItem[];

type Props = {
  params: { id: string };
};

export function generateStaticParams() {
  return NEWS.map((item) => ({ id: item.id }));
}

export default function NewsDetailPage({ params }: Props) {
  const articleId = params.id;
  const article = NEWS.find((item) => item.id === articleId);

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        해당 뉴스를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <article className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="border-b border-white/10 pb-5">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">
            Delta Force News
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="rounded-full border border-yellow-400/60 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-300">
              {article.category}
            </span>
            <span>{article.date}</span>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-sm leading-relaxed text-zinc-200 shadow-xl shadow-black/50">
          {article.content.split("\n\n").map((block, idx) => (
            <p key={idx} className="mb-4 whitespace-pre-wrap last:mb-0">
              {block}
            </p>
          ))}
        </div>

        <footer className="mt-2 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-zinc-500">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-zinc-950/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:border-yellow-400 hover:text-yellow-300"
          >
            ← 목록으로 돌아가기
          </Link>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-zinc-600 sm:inline">
            Operations Intel Archive
          </span>
        </footer>
      </article>
    </div>
  );
}


