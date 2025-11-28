"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import postsData from "../../data/posts.json";
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

type Comment = {
  id: string;
  postId: number;
  author: string;
  content: string;
  date: string;
  parentId?: string;
  userId: string;
};

const DEFAULT_POSTS = postsData as Post[];

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const postId = params?.id ? parseInt(String(params.id)) : null;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [recommended, setRecommended] = useState<Set<number>>(new Set());

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();
        setCurrentUser(
          profile?.nickname ||
            user.user_metadata?.preferred_username ||
            user.email?.split("@")[0] ||
            "Anonymous"
        );
      }
    };
    getUser();

    // 추천한 게시글 로드
    const savedRecommended = localStorage.getItem(`recommended_${postId}`);
    if (savedRecommended) {
      setRecommended(new Set(JSON.parse(savedRecommended)));
    }
  }, [supabase, postId]);

  // 게시글 로드
  useEffect(() => {
    if (!postId) return;

    // 로컬스토리지에서 게시글 로드
    const savedPosts = localStorage.getItem("boardPosts");
    let allPosts = [...DEFAULT_POSTS];
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        allPosts = [...parsed, ...DEFAULT_POSTS];
      } catch (e) {
        console.error("게시글 로드 오류:", e);
      }
    }

    const foundPost = allPosts.find((p) => p.id === postId);
    if (foundPost) {
      setPost(foundPost);
      // 조회수 증가
      const updatedPost = { ...foundPost, views: foundPost.views + 1 };
      setPost(updatedPost);

      // 로컬스토리지 업데이트
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updated = parsed.map((p: Post) =>
          p.id === postId ? updatedPost : p
        );
        localStorage.setItem("boardPosts", JSON.stringify(updated));
      }
    } else {
      router.push("/board");
    }

    // 댓글 로드
    const savedComments = localStorage.getItem(`comments_${postId}`);
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (e) {
        console.error("댓글 로드 오류:", e);
      }
    }
  }, [postId, router]);

  // 댓글 작성
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || !postId) return;

    // 최신 닉네임 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();

    const authorName =
      profile?.nickname ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0] ||
      "Anonymous";

    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random()}`,
      postId: postId,
      author: authorName,
      content: newComment.trim(),
      date: new Date().toISOString(),
      userId: currentUserId,
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedComments));

    // 게시글 댓글 수 업데이트
    if (post) {
      const updatedPost = { ...post, comments: post.comments + 1 };
      setPost(updatedPost);
      const savedPosts = localStorage.getItem("boardPosts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updated = parsed.map((p: Post) =>
          p.id === postId ? updatedPost : p
        );
        localStorage.setItem("boardPosts", JSON.stringify(updated));
      }
    }

    setNewComment("");
  };

  // 대댓글 작성
  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || !currentUserId || !postId) return;

    // 최신 닉네임 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();

    const authorName =
      profile?.nickname ||
      user.user_metadata?.preferred_username ||
      user.email?.split("@")[0] ||
      "Anonymous";

    const reply: Comment = {
      id: `reply_${Date.now()}_${Math.random()}`,
      postId: postId,
      author: authorName,
      content: replyContent.trim(),
      date: new Date().toISOString(),
      parentId: parentId,
      userId: currentUserId,
    };

    const updatedComments = [...comments, reply];
    setComments(updatedComments);
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedComments));

    // 게시글 댓글 수 업데이트
    if (post) {
      const updatedPost = { ...post, comments: post.comments + 1 };
      setPost(updatedPost);
      const savedPosts = localStorage.getItem("boardPosts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updated = parsed.map((p: Post) =>
          p.id === postId ? updatedPost : p
        );
        localStorage.setItem("boardPosts", JSON.stringify(updated));
      }
    }

    setReplyContent("");
    setReplyingTo(null);
  };

  // 추천 기능
  const handleRecommend = () => {
    if (!postId || !currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (recommended.has(postId)) {
      alert("이미 추천한 게시글입니다.");
      return;
    }

    const newRecommended = new Set(recommended);
    newRecommended.add(postId);
    setRecommended(newRecommended);
    localStorage.setItem(
      `recommended_${postId}`,
      JSON.stringify(Array.from(newRecommended))
    );

    if (post) {
      const updatedPost = { ...post, recommends: post.recommends + 1 };
      setPost(updatedPost);

      const savedPosts = localStorage.getItem("boardPosts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updated = parsed.map((p: Post) =>
          p.id === postId ? updatedPost : p
        );
        localStorage.setItem("boardPosts", JSON.stringify(updated));
      } else {
        // 기본 게시글은 업데이트 불가 (읽기 전용)
      }
    }
  };

  // 게시글 삭제
  const handleDeletePost = () => {
    if (!post || !currentUserId || post.userId !== currentUserId) {
      alert("본인의 글만 삭제할 수 있습니다.");
      return;
    }

    if (!confirm("정말 이 글을 삭제하시겠습니까?")) {
      return;
    }

    const savedPosts = localStorage.getItem("boardPosts");
    if (savedPosts) {
      const parsed = JSON.parse(savedPosts);
      const updated = parsed.filter((p: Post) => p.id !== postId);
      localStorage.setItem("boardPosts", JSON.stringify(updated));
    }

    router.push("/board");
  };

  // 댓글 삭제
  const handleDeleteComment = (commentId: string, commentUserId: string) => {
    if (commentUserId !== currentUserId) {
      alert("본인의 댓글만 삭제할 수 있습니다.");
      return;
    }

    if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    const updatedComments = comments.filter((c) => c.id !== commentId);
    setComments(updatedComments);
    localStorage.setItem(`comments_${postId}`, JSON.stringify(updatedComments));

    // 게시글 댓글 수 업데이트
    if (post) {
      const updatedPost = { ...post, comments: post.comments - 1 };
      setPost(updatedPost);
      const savedPosts = localStorage.getItem("boardPosts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const updated = parsed.map((p: Post) =>
          p.id === postId ? updatedPost : p
        );
        localStorage.setItem("boardPosts", JSON.stringify(updated));
      }
    }
  };

  // 댓글 구조화 (부모-자식 관계)
  const structuredComments = useMemo(() => {
    const parents = comments.filter((c) => !c.parentId);
    const children = comments.filter((c) => c.parentId);

    return parents.map((parent) => ({
      ...parent,
      replies: children.filter((c) => c.parentId === parent.id),
    }));
  }, [comments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        {/* 헤더 */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/board"
            className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            ← 목록으로
          </Link>
        </header>

        {/* 게시글 본문 */}
        <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                {post.category}
              </span>
              <h1 className="text-2xl font-bold text-white">{post.title}</h1>
            </div>
            {currentUserId && post.userId === currentUserId && (
              <button
                onClick={handleDeletePost}
                className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                삭제
              </button>
            )}
          </div>

          <div className="mb-6 flex items-center gap-4 text-sm text-zinc-400">
            <span>{post.author}</span>
            <span>•</span>
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>조회 {post.views.toLocaleString()}</span>
            <span>•</span>
            <span>추천 {post.recommends}</span>
          </div>

          <div className="mb-6">
            <button
              onClick={handleRecommend}
              disabled={!currentUserId || recommended.has(post.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                recommended.has(post.id)
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400"
              }`}
            >
              {recommended.has(post.id) ? "✓ 추천됨" : "추천"}
            </button>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-zinc-200 leading-relaxed">
              {post.content || "본문 내용이 없습니다."}
            </div>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-bold text-white">
            댓글 {comments.length}
          </h2>

          {/* 댓글 작성 폼 */}
          {currentUserId ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="w-full rounded-lg border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 resize-none"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-emerald-400 transition-colors"
                >
                  댓글 작성
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 rounded-lg border border-white/10 bg-black/40 p-4 text-center text-sm text-zinc-400">
              댓글을 작성하려면 로그인이 필요합니다.
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {structuredComments.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                아직 댓글이 없습니다.
              </div>
            ) : (
              structuredComments.map((comment) => (
                <div key={comment.id} className="border-b border-white/5 pb-4 last:border-0">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-white">
                        {comment.author}
                      </span>
                      <span className="ml-2 text-xs text-zinc-500">
                        {formatDate(comment.date)}
                      </span>
                    </div>
                    {currentUserId && comment.userId === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment.userId)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="mb-3 text-sm text-zinc-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  {currentUserId && (
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === comment.id ? null : comment.id
                        )
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {replyingTo === comment.id ? "취소" : "답글"}
                    </button>
                  )}

                  {/* 대댓글 작성 폼 */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 ml-4 border-l-2 border-cyan-500/30 pl-4">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 resize-none"
                        rows={2}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          className="rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:from-cyan-400 hover:to-emerald-400 transition-colors"
                        >
                          답글 작성
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-black/80"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 대댓글 목록 */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 ml-4 space-y-3 border-l-2 border-cyan-500/30 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id}>
                          <div className="mb-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-cyan-300">
                                {reply.author}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {formatDate(reply.date)}
                              </span>
                            </div>
                            {currentUserId && reply.userId === currentUserId && (
                              <button
                                onClick={() => handleDeleteComment(reply.id, reply.userId)}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

