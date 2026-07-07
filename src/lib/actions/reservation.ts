"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const EXPIRY_HOURS = 24;
const CANCEL_CUTOFF_HOURS = 3;

export async function requestReservation(formData: FormData) {
  const user = await getCurrentUser();
  const propertyId = String(formData.get("propertyId"));
  const slotId = String(formData.get("slotId"));
  const visitDate = String(formData.get("visitDate"));
  const partySize = Number(formData.get("partySize") || 1);

  if (!user) {
    redirect(
      `/verify?role=GUEST&redirectTo=${encodeURIComponent(
        `/properties/${propertyId}`
      )}`
    );
  }
  if (user!.role !== "GUEST") {
    redirect(`/properties/${propertyId}?error=${encodeURIComponent("게스트 계정으로만 예약할 수 있습니다")}`);
  }

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.propertyId !== propertyId) {
    throw new Error("유효하지 않은 시간대입니다");
  }

  const visitDateObj = new Date(visitDate);

  // 같은 슬롯+날짜에 이미 확정(APPROVED)된 예약이 있으면 요청 불가 (더블부킹 방지)
  const alreadyApproved = await prisma.reservation.findFirst({
    where: { slotId, visitDate: visitDateObj, status: "APPROVED" },
  });
  if (alreadyApproved) {
    redirect(
      `/properties/${propertyId}?error=${encodeURIComponent(
        "이미 확정된 예약이 있는 시간대입니다"
      )}`
    );
  }

  await prisma.reservation.create({
    data: {
      propertyId,
      slotId,
      guestId: user!.id,
      visitDate: visitDateObj,
      partySize,
      status: "REQUESTED",
      expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });

  redirect(`/my/reservations?requested=1`);
}

export async function approveReservation(formData: FormData) {
  const user = await getCurrentUser();
  const reservationId = String(formData.get("reservationId"));

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { property: true },
  });
  if (!reservation || reservation.property.hostId !== user?.id) {
    throw new Error("권한이 없습니다");
  }

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "APPROVED", respondedAt: new Date() },
    }),
    // 동일 슬롯+날짜의 다른 대기중 요청은 자동 거절
    prisma.reservation.updateMany({
      where: {
        slotId: reservation.slotId,
        visitDate: reservation.visitDate,
        status: "REQUESTED",
        NOT: { id: reservationId },
      },
      data: { status: "REJECTED", respondedAt: new Date() },
    }),
  ]);

  revalidatePath(`/host/properties/${reservation.propertyId}`);
  redirect(`/host/properties/${reservation.propertyId}`);
}

export async function rejectReservation(formData: FormData) {
  const user = await getCurrentUser();
  const reservationId = String(formData.get("reservationId"));

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { property: true },
  });
  if (!reservation || reservation.property.hostId !== user?.id) {
    throw new Error("권한이 없습니다");
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });

  redirect(`/host/properties/${reservation.propertyId}`);
}

export async function cancelReservation(formData: FormData) {
  const user = await getCurrentUser();
  const reservationId = String(formData.get("reservationId"));
  const cancelledBy = String(formData.get("cancelledBy")); // "HOST" | "GUEST"

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { property: true },
  });
  if (!reservation) throw new Error("예약을 찾을 수 없습니다");

  const isHost = reservation.property.hostId === user?.id;
  const isGuest = reservation.guestId === user?.id;
  if (!isHost && !isGuest) throw new Error("권한이 없습니다");

  const hoursUntilVisit =
    (reservation.visitDate.getTime() - Date.now()) / (1000 * 60 * 60);
  if (isGuest && hoursUntilVisit < CANCEL_CUTOFF_HOURS) {
    throw new Error(`방문 ${CANCEL_CUTOFF_HOURS}시간 전에는 취소할 수 없습니다`);
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED", cancelledBy },
  });

  redirect(isHost ? `/host/properties/${reservation.propertyId}` : `/my/reservations`);
}

export async function markVisitOutcome(formData: FormData) {
  const user = await getCurrentUser();
  const reservationId = String(formData.get("reservationId"));
  const outcome = String(formData.get("outcome")); // "COMPLETED" | "NO_SHOW"

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { property: true },
  });
  if (!reservation || reservation.property.hostId !== user?.id) {
    throw new Error("권한이 없습니다");
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: outcome === "NO_SHOW" ? "NO_SHOW" : "COMPLETED",
      noShowMarkedBy: outcome === "NO_SHOW" ? "HOST" : null,
    },
  });

  redirect(`/host/properties/${reservation.propertyId}`);
}

// 24시간 무응답 요청 자동 만료 처리 (페이지 로드 시 지연 실행 - MVP 단순화, cron 대체)
export async function expireStaleRequests(propertyId?: string) {
  await prisma.reservation.updateMany({
    where: {
      status: "REQUESTED",
      expiresAt: { lt: new Date() },
      ...(propertyId ? { propertyId } : {}),
    },
    data: { status: "EXPIRED" },
  });
}
