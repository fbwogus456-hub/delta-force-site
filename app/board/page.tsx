"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import postsData from "../data/posts.json";
import { createClient } from "@/utils/supabase/client";

type Category = "팁" | "질문" | "자유";

type Post = {
  id: number;
  category: Category;
  title: string;
  author: string;
  date: string;
  views: number;
  recommends: number;
  comments: number;
  content?: string;
  userId?: string;
};

const DEFAULT_POSTS = postsData as Post[];

type SortType = "recommend" | "recent";
type FilterCategory = "전체" | "팁" | "질문" | "자유";

export default function BoardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("전체");
  const [posts, setPosts] = useState<Post[]>(DEFAULT_POSTS);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, [supabase]);

  // 로컬스토리지에서 게시글 로드
  useEffect(() => {
    const savedPosts = localStorage.getItem("boardPosts");
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        setPosts([...parsed, ...DEFAULT_POSTS]);
      } catch (e) {
        console.error("게시글 로드 오류:", e);
      }
    }
  }, []);

  // 카테고리 필터링
  const categoryFiltered = useMemo(() => {
    if (filterCategory === "전체") return posts;
    return posts.filter((post) => post.category === filterCategory);
  }, [filterCategory, posts]);

  // 검색 필터링
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryFiltered;
    }
    const query = searchQuery.toLowerCase();
    return categoryFiltered.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query)
    );
  }, [searchQuery, categoryFiltered]);

  // 정렬
  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    if (sortType === "recommend") {
      return sorted.sort((a, b) => b.recommends - a.recommends);
    } else {
      return sorted.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    }
  }, [filteredPosts, sortType]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  };

  // 글 삭제 함수
  const handleDelete = async (postId: number) => {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      // 로컬스토리지에서 삭제
      const savedPosts = localStorage.getItem("boardPosts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const filtered = parsed.filter((p: Post) => p.id !== postId);
        localStorage.setItem("boardPosts", JSON.stringify(filtered));
      }

      // 상태에서도 삭제
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      alert("글이 삭제되었습니다.");
    } catch (error) {
      console.error("글 삭제 오류:", error);
      alert("글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Information Sharing
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              정보공유
            </h1>
            <p className="mt-2 text-xs text-zinc-400">
              분대 전술, 맵 운영 팁, 무기 세팅까지. 실전 경험을 서로 공유해 보세요.
            </p>
          </div>

          <Link
            href="/board/write"
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-cyan-500/30 transition-transform hover:-translate-y-0.5 hover:from-cyan-400 hover:to-emerald-400"
          >
            글쓰기
          </Link>
        </header>

        {/* 카테고리 필터 탭 */}
        <div className="flex gap-2 border-b border-white/10">
          {(["전체", "팁", "질문", "자유"] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filterCategory === cat
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 검색 및 정렬 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="제목 또는 작성자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortType("recommend")}
              className={`rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                sortType === "recommend"
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                  : "border border-white/15 bg-zinc-900/60 text-zinc-300 hover:border-cyan-400 hover:text-cyan-400"
              }`}
            >
              추천순
            </button>
            <button
              onClick={() => setSortType("recent")}
              className={`rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                sortType === "recent"
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                  : "border border-white/15 bg-zinc-900/60 text-zinc-300 hover:border-cyan-400 hover:text-cyan-400"
              }`}
            >
              최근순
            </button>
          </div>
        </div>

        {/* 게시판 테이블 */}
        <div className="overflow-hidden rounded-lg border border-white/20 bg-zinc-900/90 shadow-2xl">
          {/* Table Header */}
          <div 
            className="grid gap-4 px-4 py-3.5 border-b-2 border-zinc-600 bg-zinc-800"
            style={{
              gridTemplateColumns: "70px 1fr 150px 110px 90px 80px"
            }}
          >
            <div className="text-center text-xs font-bold text-zinc-300 whitespace-nowrap">번호</div>
            <div className="text-xs font-bold text-zinc-300 whitespace-nowrap">제목</div>
            <div className="text-center text-xs font-bold text-zinc-300 whitespace-nowrap">글쓴이</div>
            <div className="text-center text-xs font-bold text-zinc-300 whitespace-nowrap">등록일</div>
            <div className="text-center text-xs font-bold text-zinc-300 whitespace-nowrap">조회</div>
            <div className="text-center text-xs font-bold text-zinc-300 whitespace-nowrap">추천</div>
          </div>

          {/* 일반 게시글 */}
          {sortedPosts.map((post) => {
            const isMyPost = currentUserId && post.userId === currentUserId;
            return (
              <Link
                key={post.id}
                href={`/board/${post.id}`}
                className="grid gap-4 items-center px-4 py-3 text-sm border-b border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-800/70 transition-colors group"
                style={{
                  gridTemplateColumns: "70px 1fr 150px 110px 90px 80px"
                }}
              >
                <div className="text-center text-zinc-500 text-xs font-medium whitespace-nowrap">
                  {post.id}
                </div>
                <div 
                  className="min-w-0"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span className="text-zinc-200">
                    {post.title}
                  </span>
                  {post.comments > 0 && (
                    <span className="text-red-500 font-bold ml-1">
                      [{post.comments}]
                    </span>
                  )}
                </div>
                <div className="text-center text-zinc-300 text-xs whitespace-nowrap truncate">
                  {post.author}
                </div>
                <div className="text-center text-zinc-500 text-xs whitespace-nowrap">
                  {formatDate(post.date)}
                </div>
                <div className="text-center text-zinc-400 text-xs whitespace-nowrap">
                  {post.views.toLocaleString()}
                </div>
                <div 
                  className="flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <span className="text-zinc-400 text-xs whitespace-nowrap">
                    {post.recommends}
                  </span>
                  {isMyPost && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-base font-bold transition-opacity w-5 h-5 flex items-center justify-center"
                      title="삭제"
                    >
                      ×
                    </button>
                  )}
                </div>
              </Link>
            );
          })}

          {sortedPosts.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-zinc-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
