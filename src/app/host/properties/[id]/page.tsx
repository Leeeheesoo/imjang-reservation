import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import {
  approveReservation,
  rejectReservation,
  cancelReservation,
  markVisitOutcome,
  expireStaleRequests,
} from "@/lib/actions/reservation";
import { closeDateForProperty } from "@/lib/actions/property";
import { format } from "date-fns";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "요청됨",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
  EXPIRED: "만료됨",
  CANCELLED: "취소됨",
  COMPLETED: "방문완료",
  NO_SHOW: "노쇼",
};

export default async function HostPropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/verify?role=HOST");

  await expireStaleRequests(id);

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      complex: true,
      slots: { where: { dayOfWeek: { not: null } } },
      reservations: {
        include: { guest: true },
        orderBy: { visitDate: "asc" },
      },
    },
  });

  if (!property) notFound();
  if (property.hostId !== user!.id) redirect("/host");

  const requested = property.reservations.filter((r) => r.status === "REQUESTED");
  const approved = property.reservations.filter((r) => r.status === "APPROVED");
  const history = property.reservations.filter((r) =>
    ["REJECTED", "EXPIRED", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(r.status)
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {created && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          매물이 등록되었습니다.
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900">
        {property.complex.name} {property.dong} · {property.pyeong}평
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {property.type === "SALE" ? "매매" : property.type === "JEONSE" ? "전세" : "세입자 거주 중"}
        {property.price ? ` · ${property.price}` : ""}
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">
          대기 중인 예약 요청 ({requested.length})
        </h2>
        {requested.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">대기 중인 요청이 없습니다.</p>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {requested.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <p className="text-sm font-medium text-gray-900">
                {format(r.visitDate, "M월 d일 (EEE)")} {r.guest.name}님 · {r.partySize}명
              </p>
              <p className="text-xs text-gray-500">
                본인인증: {r.guest.verified ? "완료" : "미완료"} · 전화 {r.guest.phone}
              </p>
              <div className="mt-2 flex gap-2">
                <form action={approveReservation}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                    승인
                  </button>
                </form>
                <form action={rejectReservation}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <button className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300">
                    거절
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">
          확정된 방문 ({approved.length})
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {approved.map((r) => (
            <li key={r.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-gray-900">
                {format(r.visitDate, "M월 d일 (EEE)")} {r.guest.name}님 · {r.partySize}명
              </p>
              <div className="mt-2 flex gap-2">
                <form action={markVisitOutcome}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <input type="hidden" name="outcome" value="COMPLETED" />
                  <button className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                    방문완료
                  </button>
                </form>
                <form action={markVisitOutcome}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <input type="hidden" name="outcome" value="NO_SHOW" />
                  <button className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200">
                    노쇼
                  </button>
                </form>
                <form action={cancelReservation}>
                  <input type="hidden" name="reservationId" value={r.id} />
                  <input type="hidden" name="cancelledBy" value="HOST" />
                  <button className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300">
                    취소
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">방문 가능 시간</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {property.slots.map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
            >
              {DAYS[s.dayOfWeek!]} {s.startTime}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">특정 날짜 휴무 설정</h2>
        <form action={closeDateForProperty} className="mt-2 flex gap-2">
          <input type="hidden" name="propertyId" value={property.id} />
          <input
            type="date"
            name="date"
            required
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900">
            해당 날짜 닫기
          </button>
        </form>
      </section>

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900">지난 이력</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {history.map((r) => (
              <li key={r.id} className="text-xs text-gray-500">
                {format(r.visitDate, "M월 d일")} {r.guest.name}님 · {STATUS_LABEL[r.status]}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
