"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const slotKeySchema = z.string().regex(/^\d-\d{2}:00$/); // "3-14:00" => 수요일 14시

const createPropertySchema = z.object({
  complexId: z.string().min(1),
  dong: z.string().min(1, "동을 입력해주세요"),
  ho: z.string().optional(),
  pyeong: z.coerce.number().int().positive(),
  type: z.enum(["SALE", "JEONSE", "TENANT_OCCUPIED"]),
  price: z.string().optional(),
  description: z.string().optional(),
  slots: z.array(slotKeySchema).min(1, "방문 가능 시간을 1개 이상 선택해주세요"),
});

// MVP 단순화: 사진 업로드 대신 플레이스홀더 이미지 배열 저장 (실제 업로드는 이후 단계)
const PLACEHOLDER_PHOTOS = JSON.stringify([
  "/window.svg",
  "/file.svg",
]);

export async function createProperty(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "HOST") {
    redirect("/verify?role=HOST&redirectTo=/host/properties/new");
  }

  const raw = {
    complexId: formData.get("complexId"),
    dong: formData.get("dong"),
    ho: formData.get("ho") || undefined,
    pyeong: formData.get("pyeong"),
    type: formData.get("type"),
    price: formData.get("price") || undefined,
    description: formData.get("description") || undefined,
    slots: formData.getAll("slots"),
  };

  const parsed = createPropertySchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요";
    redirect(`/host/properties/new?error=${encodeURIComponent(message)}`);
  }

  const { complexId, dong, ho, pyeong, type, price, description, slots } =
    parsed.data;

  // MVP 단순화: 검수(PENDING_REVIEW) 단계 없이 즉시 게시. 어드민 검수는 이후 단계에서 추가.
  const property = await prisma.property.create({
    data: {
      hostId: user!.id,
      complexId,
      dong,
      ho,
      pyeong,
      type,
      price,
      description,
      photos: PLACEHOLDER_PHOTOS,
      status: "PUBLISHED",
      slots: {
        create: slots.map((key) => {
          const [day, time] = key.split("-");
          const [hour] = time.split(":");
          const endHour = String(Number(hour) + 1).padStart(2, "0");
          return {
            dayOfWeek: Number(day),
            startTime: time,
            endTime: `${endHour}:00`,
          };
        }),
      },
    },
  });

  redirect(`/host/properties/${property.id}?created=1`);
}

export async function closeDateForProperty(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/verify?role=HOST");

  const propertyId = String(formData.get("propertyId"));
  const dateStr = String(formData.get("date"));

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property || property.hostId !== user!.id) {
    throw new Error("권한이 없습니다");
  }

  await prisma.availabilitySlot.create({
    data: {
      propertyId,
      exceptionDate: new Date(dateStr),
      startTime: "00:00",
      endTime: "23:59",
      isClosed: true,
    },
  });

  redirect(`/host/properties/${propertyId}`);
}
