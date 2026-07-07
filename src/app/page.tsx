import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-medium text-blue-600">동탄 임장예약</p>
      <h1 className="mt-2 text-2xl font-bold leading-snug text-gray-900">
        전화 없이,
        <br />
        원하는 시간에 집을 봅니다
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        집을 보여주는 분은 원하는 시간을 열어두고, 보러 가는 분은 그중에서
        골라 예약하세요.
      </p>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/browse"
          className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          집 보러 가기 (게스트)
        </Link>
        <Link
          href="/host"
          className="rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          집 보여주기 (호스트)
        </Link>
      </div>
    </main>
  );
}
