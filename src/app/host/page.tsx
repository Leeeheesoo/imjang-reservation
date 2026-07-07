import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "작성중",
  PENDING_REVIEW: "검수중",
  PUBLISHED: "게시중",
  HIDDEN: "숨김",
  REJECTED: "반려",
  ARCHIVED: "거래완료",
};

export default async function HostDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/verify?role=HOST&redirectTo=/host");
  if (user!.role !== "HOST") redirect("/verify?role=HOST&redirectTo=/host");

  const properties = await prisma.property.findMany({
    where: { hostId: user!.id },
    include: {
      complex: true,
      reservations: { where: { status: "REQUESTED" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">내 매물</h1>
        <Link
          href="/host/properties/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 매물 등록
        </Link>
      </div>

      {properties.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">
          등록된 매물이 없습니다. 첫 매물을 등록해보세요.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {properties.map((p) => (
          <li key={p.id}>
            <Link
              href={`/host/properties/${p.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {p.complex.name} {p.dong} · {p.pyeong}평
                </p>
                <p className="text-xs text-gray-500">
                  {STATUS_LABEL[p.status]}
                </p>
              </div>
              {p.reservations.length > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
                  대기 요청 {p.reservations.length}건
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
