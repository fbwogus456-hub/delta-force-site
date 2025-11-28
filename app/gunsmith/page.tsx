"use client";

import { useMemo, useState } from "react";
import modsData from "../data/mods.json";
import weaponsData from "../data/weapons.json";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type ModRecord = {
  id: string;
  weaponName: string;
  code: string;
  nickname: string;
  title: string;
  description: string;
  playstyle: string;
  tags: string[];
  createdAt: string;
  recommends: number;
};

type WeaponRecord = {
  name: string;
  category: string;
  url: string;
  attributes: Record<string, { value: number | string; unit: string; raw: string }>;
  ammunition: string[];
};

const MODS = modsData as ModRecord[];
const WEAPONS = weaponsData as WeaponRecord[];

const CATEGORIES = [
  { id: "all", label: "전체", value: "" },
  { id: "assault", label: "돌격소총", value: "돌격소총" },
  { id: "smg", label: "기관단총", value: "기관단총" },
  { id: "dmr", label: "지정사수소총", value: "지정사수소총" },
  { id: "sniper", label: "저격소총", value: "저격소총" },
  { id: "shotgun", label: "샷건", value: "샷건" },
  { id: "lmg", label: "경기관총", value: "경기관총" },
];

const MAPS = [
  "Operation Blackout",
  "Desert Storm",
  "Urban Assault",
  "Night Raid",
  "Coastal Strike",
  "Mountain Pass",
];

const DISTANCES = ["근거리", "중거리", "장거리"];

export default function GunsmithPage() {
  const [activeTab, setActiveTab] = useState<"mods" | "create">("mods");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeWeapon, setActiveWeapon] = useState<string>("all");
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    MODS.forEach((mod) => {
      base[mod.id] = mod.recommends ?? 0;
    });
    return base;
  });
  const [votedIds, setVotedIds] = useState<string[]>([]);

  // 모딩 올리기 폼 상태
  const [weaponName, setWeaponName] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // 선택한 카테고리의 총기 목록
  const weaponsInCategory = useMemo(() => {
    if (activeCategory === "all") {
      return WEAPONS.map((w) => w.name).sort();
    }
    const category = CATEGORIES.find((c) => c.id === activeCategory)?.value;
    return WEAPONS.filter((w) => w.category === category)
      .map((w) => w.name)
      .sort();
  }, [activeCategory]);

  // 카테고리 및 총기별 모딩 필터링
  const filteredMods = useMemo(() => {
    let base = MODS;

    // 카테고리 필터링
    if (activeCategory !== "all") {
      const category = CATEGORIES.find((c) => c.id === activeCategory)?.value;
      const weaponsInCat = WEAPONS.filter((w) => w.category === category).map((w) => w.name);
      base = MODS.filter((mod) => weaponsInCat.includes(mod.weaponName));
    }

    // 총기 필터링
    if (activeWeapon !== "all") {
      base = base.filter((mod) => mod.weaponName === activeWeapon);
    }

    return [...base].sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0));
  }, [activeCategory, activeWeapon, votes]);

  // 카테고리 변경 시 총기 필터 초기화
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setActiveWeapon("all");
  };

  const bestMods = filteredMods.slice(0, 3);

  const handleRecommend = (id: string) => {
    if (votedIds.includes(id)) return;
    setVotes((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
    setVotedIds((prev) => [...prev, id]);
  };

  const toggleMap = (map: string) => {
    setSelectedMaps((prev) =>
      prev.includes(map) ? prev.filter((m) => m !== map) : [...prev, map]
    );
  };

  const toggleDistance = (distance: string) => {
    setSelectedDistances((prev) =>
      prev.includes(distance)
        ? prev.filter((d) => d !== distance)
        : [...prev, distance]
    );
  };

  const handleSubmit = async () => {
    if (!weaponName || !code.trim() || !title.trim() || !description.trim()) {
      setSubmitError("모든 필수 항목을 입력해주세요.");
      return;
    }

    if (selectedMaps.length === 0 || selectedDistances.length === 0) {
      setSubmitError("맵과 거리를 최소 1개 이상 선택해주세요.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError("로그인이 필요합니다.");
        setSubmitting(false);
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();

      const nickname = profile?.nickname || user.user_metadata?.preferred_username || user.email?.split("@")[0] || "Anonymous";

      alert("모딩이 등록되었습니다! (현재는 UI만 구현되어 있습니다.)");

      setWeaponName("");
      setCode("");
      setTitle("");
      setDescription("");
      setSelectedMaps([]);
      setSelectedDistances([]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab("mods");
      }, 2000);
    } catch (err) {
      console.error("모딩 등록 오류:", err);
      setSubmitError("모딩 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header className="border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Loadout Lab
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              총기모딩 공유 허브
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              유저들이 직접 검증한 모딩 코드를 복사해 실전에 적용하고, 나만의 전술 로드아웃을 실험해 보세요.
            </p>
          </div>

          {/* Main Tabs */}
          <div className="mt-6 flex items-center gap-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("mods")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "mods"
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              추천 모딩
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`ml-auto px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "create"
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              모딩 올리기
            </button>
          </div>

          {/* Category Filters - 추천 모딩 탭에서만 표시 */}
          {activeTab === "mods" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryChange(category.id)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                        : "border border-white/15 bg-zinc-900/60 text-zinc-300 hover:border-cyan-400 hover:text-cyan-400"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Weapon Filters - 카테고리 선택 시 하위 총기 탭 표시 */}
          {activeTab === "mods" && activeCategory !== "all" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveWeapon("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  activeWeapon === "all"
                    ? "bg-emerald-500 text-black"
                    : "border border-white/15 bg-zinc-900/60 text-zinc-300 hover:border-emerald-400 hover:text-white"
                }`}
              >
                전체
              </button>
              {weaponsInCategory.map((weapon) => {
                const isActive = activeWeapon === weapon;
                return (
                  <button
                    key={weapon}
                    type="button"
                    onClick={() => setActiveWeapon(weapon)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                        : "border border-white/15 bg-zinc-900/60 text-zinc-300 hover:border-cyan-400 hover:text-cyan-400"
                    }`}
                  >
                    {weapon}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* 모딩 올리기 탭 */}
        {activeTab === "create" && (
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-lg shadow-black/40">
            <h2 className="mb-6 text-xl font-semibold text-white">새 모딩 등록</h2>

            <div className="space-y-6">
              {/* 카테고리 선택 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  카테고리 선택 <span className="text-red-400">*</span>
                </label>
                <select
                  value={activeCategory}
                  onChange={(e) => {
                    setActiveCategory(e.target.value);
                    setWeaponName("");
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="all">카테고리를 선택하세요</option>
                  {CATEGORIES.filter((c) => c.id !== "all").map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 총기 선택 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  총기 선택 <span className="text-red-400">*</span>
                </label>
                <select
                  value={weaponName}
                  onChange={(e) => setWeaponName(e.target.value)}
                  disabled={activeCategory === "all"}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
                >
                  <option value="">
                    {activeCategory === "all" ? "먼저 카테고리를 선택하세요" : "총기를 선택하세요"}
                  </option>
                  {activeCategory !== "all" &&
                    weaponsInCategory.map((weapon) => (
                      <option key={weapon} value={weapon}>
                        {weapon}
                      </option>
                    ))}
                </select>
              </div>

              {/* 모딩 코드 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  모딩 코드 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="예: M4A1-STABLE-01"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              {/* 제목 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  제목 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 입문용 안정화 M4A1"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  설명 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이 모딩의 특징과 사용법을 설명해주세요."
                  rows={5}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 resize-none"
                />
              </div>

              {/* 맵 선택 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  추천 맵 <span className="text-red-400">*</span> (중복 선택 가능)
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {MAPS.map((map) => (
                    <label
                      key={map}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3 transition-colors hover:border-cyan-400/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaps.includes(map)}
                        onChange={() => toggleMap(map)}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                      />
                      <span className="text-sm text-zinc-200">{map}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 거리 선택 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  추천 거리 <span className="text-red-400">*</span> (중복 선택 가능)
                </label>
                <div className="flex gap-3">
                  {DISTANCES.map((distance) => (
                    <label
                      key={distance}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3 transition-colors hover:border-cyan-400/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDistances.includes(distance)}
                        onChange={() => toggleDistance(distance)}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                      />
                      <span className="text-sm text-zinc-200">{distance}</span>
                    </label>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-red-400">{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-400">
                    모딩이 성공적으로 등록되었습니다!
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "모딩 등록하기"}
              </button>
            </div>
          </section>
        )}

        {/* 추천 모딩 탭 */}
        {activeTab === "mods" && (
          <>
            {/* Best mods highlight */}
            <section className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-teal-500/10 p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300">
                    Best Mod Loadouts
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-zinc-50">
                    추천 수 기준 베스트 총기 모딩 TOP 3
                  </h2>
                </div>
                <p className="text-[10px] text-emerald-200/80">
                  각 모딩당 추천은 1회만 가능합니다.
                </p>
              </div>
              {bestMods.length === 0 ? (
                <p className="text-xs text-zinc-200">
                  아직 추천된 모딩이 없습니다. 원하는 세팅에 추천을 남겨 첫 번째 베스트 모딩을 만들어 보세요.
                </p>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row">
                  {bestMods.map((mod) => {
                    const recommendCount = votes[mod.id] ?? 0;
                    const alreadyVoted = votedIds.includes(mod.id);
                    return (
                      <article
                        key={mod.id}
                        className="flex flex-1 flex-col rounded-xl border border-cyan-400/40 bg-black/40 p-6 text-sm shadow-inner"
                      >
                        <header className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-base font-bold uppercase tracking-wide bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                              {mod.weaponName}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-zinc-50 line-clamp-2">
                              {mod.title}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-300">
                              by <span className="text-zinc-50">{mod.nickname}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRecommend(mod.id)}
                            disabled={alreadyVoted}
                            className={`flex flex-col items-end rounded-md px-3 py-1.5 text-xs font-semibold ${
                              alreadyVoted
                                ? "cursor-default bg-cyan-500/10 text-cyan-200"
                                : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400"
                            }`}
                          >
                            <span>{alreadyVoted ? "추천 완료" : "추천"}</span>
                            <span className="text-[10px] opacity-80">
                              {recommendCount.toLocaleString()} votes
                            </span>
                          </button>
                        </header>
                        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-emerald-300 mb-3">
                          <p className="break-all">{mod.code}</p>
                        </div>
                        <p className="line-clamp-3 text-xs text-zinc-200">
                          {mod.description}
                        </p>
                        <p className="mt-2 text-xs text-zinc-400">
                          {mod.playstyle}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* All mods grid */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filteredMods.map((mod) => {
                const recommendCount = votes[mod.id] ?? 0;
                const alreadyVoted = votedIds.includes(mod.id);
                return (
                  <article
                    key={mod.id}
                    className="group flex flex-col rounded-xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 shadow-lg shadow-black/40 transition-transform hover:-translate-y-1 hover:border-cyan-400/70 hover:shadow-cyan-500/20"
                  >
                    <header className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold uppercase tracking-wide text-cyan-400">
                          {mod.weaponName}
                        </p>
                        <h2 className="mt-1 text-sm font-semibold text-white line-clamp-2">
                          {mod.title}
                        </h2>
                        <p className="mt-1 text-[10px] text-zinc-400">
                          by <span className="text-zinc-200">{mod.nickname}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRecommend(mod.id)}
                        disabled={alreadyVoted}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] ${
                          alreadyVoted
                            ? "cursor-default bg-cyan-500/10 text-cyan-200"
                            : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400"
                        }`}
                      >
                        <span>{alreadyVoted ? "✓" : "↑"}</span>
                        <span className="text-[8px] opacity-80">
                          {recommendCount}
                        </span>
                      </button>
                    </header>

                    <div className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono text-emerald-300 mb-2">
                      <p className="break-all text-[9px]">{mod.code}</p>
                    </div>

                    <p className="line-clamp-2 text-[10px] text-zinc-300 mb-2">
                      {mod.description}
                    </p>

                    <footer className="mt-auto flex flex-wrap items-center gap-1 text-[9px] text-zinc-500">
                      {mod.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-900/80 px-1.5 py-0.5 text-[8px] text-zinc-300 ring-1 ring-white/10"
                        >
                          #{tag}
                        </span>
                      ))}
                    </footer>
                  </article>
                );
              })}

              {filteredMods.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-zinc-700 bg-black/40 p-8 text-center text-sm text-zinc-400">
                  현재 선택한 필터에 해당하는 모딩 코드가 없습니다.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
