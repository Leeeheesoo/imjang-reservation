import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { cancelReservation } from "@/lib/actions/reservation";
import { format } from "date-fns";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "승인 대기중",
  APPROVED: "확정됨",
  REJECTED: "거절됨",
  EXPIRED: "만료됨",
  CANCELLED: "취소됨",
  COMPLETED: "방문완료",
  NO_SHOW: "노쇼 처리됨",
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

export default async function MyReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const { requested } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/verify?role=GUEST&redirectTo=/my/reservations");

  const reservations = await prisma.reservation.findMany({
    where: { guestId: user!.id },
    include: { property: { include: { complex: true } } },
    orderBy: { visitDate: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900">내 예약</h1>

      {requested && (
        <div className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          예약 요청을 보냈습니다. 호스트 승인을 기다려주세요.
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {reservations.map((r) => {
          const cancellable = ["REQUESTED", "APPROVED"].includes(r.status);
          return (
            <li key={r.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {r.property.complex.name} {r.property.dong} · {r.property.pyeong}평
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {format(r.visitDate, "M월 d일 (EEE)")} · {r.partySize}명
              </p>
              {r.status === "APPROVED" && (
                <p className="mt-1 text-xs text-gray-500">
                  {r.property.dong} {r.property.ho ?? ""} — 방문 확정
                </p>
              )}
              {cancellable && (
                <form action={cancelReservation} className="mt-2">
                  <input type="hidden" name="reservationId" value={r.id} />
                  <input type="hidden" name="cancelledBy" value="GUEST" />
                  <button className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200">
                    예약 취소
                  </button>
                </form>
              )}
            </li>
          );
        })}
        {reservations.length === 0 && (
          <p className="mt-8 text-sm text-gray-500">아직 예약 내역이 없습니다.</p>
        )}
      </ul>
    </main>
  );
}
