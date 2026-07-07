import { prisma } from "@/lib/prisma";

const LOOKAHEAD_DAYS = 14;

export type UpcomingSlot = {
  slotId: string;
  date: Date;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function toDateOnlyString(d: Date) {
  return d.toISOString().slice(0, 10);
}

// 매물의 반복 슬롯을 기준으로 향후 14일간 예약 가능한 방문 일시 목록을 생성.
// 날짜별 휴무 예외(isClosed) 및 이미 확정(APPROVED)된 예약이 있는 슬롯은 제외.
export async function getUpcomingAvailability(
  propertyId: string
): Promise<UpcomingSlot[]> {
  const slots = await prisma.availabilitySlot.findMany({
    where: { propertyId, dayOfWeek: { not: null }, isClosed: false },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const exceptions = await prisma.availabilitySlot.findMany({
    where: { propertyId, isClosed: true, exceptionDate: { not: null } },
  });
  const closedDates = new Set(
    exceptions.map((e) => toDateOnlyString(e.exceptionDate!))
  );

  const approvedReservations = await prisma.reservation.findMany({
    where: { propertyId, status: "APPROVED" },
  });
  const bookedKeys = new Set(
    approvedReservations.map(
      (r) => `${r.slotId}__${toDateOnlyString(r.visitDate)}`
    )
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: UpcomingSlot[] = [];

  for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dow = date.getDay();
    const dateKey = toDateOnlyString(date);
    if (closedDates.has(dateKey)) continue;

    for (const slot of slots) {
      if (slot.dayOfWeek !== dow) continue;
      const bookKey = `${slot.id}__${dateKey}`;
      if (bookedKeys.has(bookKey)) continue;

      // 과거 시간은 제외 (오늘 날짜의 지난 시간대)
      if (i === 0) {
        const [h] = slot.startTime.split(":").map(Number);
        if (h <= new Date().getHours()) continue;
      }

      result.push({
        slotId: slot.id,
        date,
        dayOfWeek: dow,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }
  }

  return result;
}
