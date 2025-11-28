export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black text-white">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        델타포스 정보 공유방
      </h1>
      <button className="rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 px-8 py-3 text-lg font-semibold text-white transition-all hover:scale-105 hover:from-cyan-400 hover:via-emerald-400 hover:to-teal-400 focus:outline-none focus-visible:ring focus-visible:ring-cyan-400 shadow-lg shadow-cyan-500/30">
        업데이트 확인하기
      </button>
    </div>
  );
}
