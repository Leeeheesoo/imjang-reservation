import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUpcomingAvailability } from "@/lib/availability";

const TYPE_LABEL: Record<string, string> = {
  SALE: "매매",
  JEONSE: "전세",
  TENANT_OCCUPIED: "세입자 거주",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ complexId?: string; type?: string }>;
}) {
  const { complexId, type } = await searchParams;

  const complexes = await prisma.complex.findMany({ orderBy: { name: "asc" } });

  const properties = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      ...(complexId ? { complexId } : {}),
      ...(type ? { type: type as never } : {}),
    },
    include: { complex: true },
    orderBy: { createdAt: "desc" },
  });

  const withAvailability = await Promise.all(
    properties.map(async (p) => ({
      property: p,
      availableCount: (await getUpcomingAvailability(p.id)).length,
    }))
  );

  withAvailability.sort((a, b) => b.availableCount - a.availableCount);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900">동탄 임장 매물</h1>
      <p className="mt-1 text-sm text-gray-500">
        전화 없이, 원하는 시간에 집을 보러 가세요.
      </p>

      <form className="mt-5 flex gap-2" method="get">
        <select
          name="complexId"
          defaultValue={complexId ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">전체 단지</option>
          {complexes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">전체 유형</option>
          <option value="SALE">매매</option>
          <option value="JEONSE">전세</option>
          <option value="TENANT_OCCUPIED">세입자 거주</option>
        </select>
        <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900">
          필터
        </button>
      </form>

      <ul className="mt-6 flex flex-col gap-3">
        {withAvailability.map(({ property, availableCount }) => (
          <li key={property.id}>
            <Link
              href={`/properties/${property.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {property.complex.name} {property.dong} · {property.pyeong}평
                </p>
                <p className="text-xs text-gray-500">
                  {TYPE_LABEL[property.type]}
                  {property.price ? ` · ${property.price}` : ""}
                </p>
              </div>
              {availableCount > 0 ? (
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  이번 주 예약 가능
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400">
                  예약 마감
                </span>
              )}
            </Link>
          </li>
        ))}
        {withAvailability.length === 0 && (
          <p className="mt-8 text-sm text-gray-500">조건에 맞는 매물이 없습니다.</p>
        )}
      </ul>
    </main>
  );
}
