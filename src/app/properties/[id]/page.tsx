import { prisma } from "@/lib/prisma";
import { getUpcomingAvailability } from "@/lib/availability";
import { requestReservation } from "@/lib/actions/reservation";
import { notFound } from "next/navigation";
import { format } from "date-fns";

const TYPE_LABEL: Record<string, string> = {
  SALE: "매매",
  JEONSE: "전세",
  TENANT_OCCUPIED: "세입자 거주",
};

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { complex: true },
  });
  if (!property || property.status !== "PUBLISHED") notFound();

  const upcoming = await getUpcomingAvailability(id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900">
        {property.complex.name} {property.dong} · {property.pyeong}평
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {TYPE_LABEL[property.type]}
        {property.price ? ` · ${property.price}` : ""}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        상세 호수와 연락처는 예약 확정 후 공개됩니다.
      </p>
      {property.description && (
        <p className="mt-3 text-sm text-gray-700">{property.description}</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">
          방문 가능 시간 (2주 이내)
        </h2>
        {upcoming.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">
            현재 예약 가능한 시간이 없습니다.
          </p>
        )}
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {upcoming.map((slot) => (
            <li key={`${slot.slotId}-${slot.date.toISOString()}`}>
              <form action={requestReservation}>
                <input type="hidden" name="propertyId" value={property.id} />
                <input type="hidden" name="slotId" value={slot.slotId} />
                <input
                  type="hidden"
                  name="visitDate"
                  value={slot.date.toISOString()}
                />
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {format(slot.date, "M월 d일 (EEE)")} {slot.startTime}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      name="partySize"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="1">1명</option>
                      <option value="2">2명</option>
                      <option value="3">3명</option>
                      <option value="4">4명</option>
                    </select>
                    <button className="flex-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                      예약 요청
                    </button>
                  </div>
                </div>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
