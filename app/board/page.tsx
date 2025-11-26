import Link from "next/link";
import postsData from "../data/posts.json";

type Category = "팁" | "질문" | "자유";

type Post = {
  id: number;
  category: Category;
  title: string;
  author: string;
  date: string;
  views: number;
  recommends: number;
};

const POSTS = postsData as Post[];

export default function BoardPage() {
  const sortedByRecommend = [...POSTS].sort(
    (a, b) => b.recommends - a.recommends,
  );
  const hotPosts = sortedByRecommend.slice(0, 3);
  const hotIds = new Set(hotPosts.map((p) => p.id));
  const normalPosts = POSTS.filter((p) => !hotIds.has(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">
              Tactical Board
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              전술 게시판
            </h1>
            <p className="mt-2 text-xs text-zinc-400">
              분대 전술, 맵 운영 팁, 무기 세팅까지. 실전 경험을 서로 공유해 보세요.
            </p>
          </div>

          <Link
            href="/board/write"
            className="inline-flex items-center justify-center rounded-md bg-yellow-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-lg shadow-yellow-500/40 transition-transform hover:-translate-y-0.5 hover:bg-yellow-300"
          >
            글쓰기
          </Link>
        </header>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/70 shadow-xl">
          {/* Table header */}
          <div className="grid grid-cols-[64px,80px,1fr,120px,120px,80px] border-b border-white/10 bg-black/60 px-4 py-2 text-[11px] font-semibold text-zinc-400">
            <div className="text-center">번호</div>
            <div className="text-center">분류</div>
            <div>제목</div>
            <div className="text-center">작성자</div>
            <div className="text-center">작성일</div>
            <div className="text-center">조회</div>
          </div>

          {/* Hot posts */}
          {hotPosts.map((post) => (
            <div
              key={post.id}
              className="grid grid-cols-[64px,80px,1fr,120px,120px,80px] items-center border-b border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-zinc-900/80 to-black/80 px-4 py-2 text-xs hover:bg-yellow-500/10"
            >
              <div className="text-center text-yellow-300">★</div>
              <div className="text-center text-[11px] text-yellow-200">
                {post.category}
              </div>
              <div className="flex items-center gap-2">
                <span className="line-clamp-1 font-medium text-zinc-50">
                  {post.title}
                </span>
                <span className="text-[10px] text-yellow-400">
                  +{post.recommends}
                </span>
              </div>
              <div className="text-center text-zinc-300">{post.author}</div>
              <div className="text-center text-zinc-500">{post.date}</div>
              <div className="text-center text-zinc-400">{post.views}</div>
            </div>
          ))}

          {/* Normal posts */}
          {normalPosts.map((post) => (
            <div
              key={post.id}
              className="grid grid-cols-[64px,80px,1fr,120px,120px,80px] items-center border-b border-white/5 bg-black/40 px-4 py-2 text-xs hover:bg-black/70"
            >
              <div className="text-center text-zinc-500">{post.id}</div>
              <div className="text-center text-[11px] text-zinc-300">
                {post.category}
              </div>
              <div className="line-clamp-1 text-zinc-100">{post.title}</div>
              <div className="text-center text-zinc-300">{post.author}</div>
              <div className="text-center text-zinc-500">{post.date}</div>
              <div className="text-center text-zinc-400">{post.views}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




