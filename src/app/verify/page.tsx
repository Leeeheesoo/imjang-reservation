import { verifyAndLogin } from "@/lib/actions/auth";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string; redirectTo?: string }>;
}) {
  const { role = "GUEST", error, redirectTo } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-xl font-bold text-gray-900">본인인증</h1>
      <p className="mt-2 text-sm text-gray-500">
        {role === "HOST"
          ? "집을 보여주실 분(호스트) 인증입니다."
          : "방문 예약을 위해 본인인증이 필요합니다."}
      </p>
      <p className="mt-1 text-xs text-amber-600">
        ※ MVP 데모: 실제 PASS 인증 대신 이름/전화번호 입력으로 대체합니다.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <form action={verifyAndLogin} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <div>
          <label className="text-sm font-medium text-gray-700">이름</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="홍길동"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">휴대폰 번호</label>
          <input
            name="phone"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="01012345678 (- 없이)"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          인증하고 계속하기
        </button>
      </form>
    </main>
  );
}
