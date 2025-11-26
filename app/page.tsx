export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black text-white">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        델타포스 정보 공유방
      </h1>
      <button className="rounded-full bg-yellow-400 px-8 py-3 text-lg font-semibold text-black transition-transform hover:scale-105 focus:outline-none focus-visible:ring focus-visible:ring-yellow-200">
        업데이트 확인하기
      </button>
    </div>
  );
}
