"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setSessionUser, clearSession } from "@/lib/session";
import { z } from "zod";

const verifySchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z
    .string()
    .regex(/^01[0-9]{8,9}$/, "휴대폰 번호 형식이 올바르지 않습니다 (- 없이 입력)"),
  role: z.enum(["HOST", "GUEST"]),
  redirectTo: z.string().optional(),
});

// MVP mock: 실제 PASS/카카오 인증 대신 이름+전화번호 입력만으로 인증 완료 처리.
// 전화번호가 이미 있으면 해당 계정으로 로그인, 없으면 신규 생성.
export async function verifyAndLogin(formData: FormData) {
  const parsed = verifySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    redirectTo: formData.get("redirectTo") || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요";
    redirect(`/verify?error=${encodeURIComponent(message)}&role=${formData.get("role")}`);
  }

  const { name, phone, role, redirectTo } = parsed.data;

  const user = await prisma.user.upsert({
    where: { phone },
    update: { verified: true, name, role },
    create: { name, phone, role, verified: true },
  });

  await setSessionUser(user.id);
  redirect(redirectTo || (role === "HOST" ? "/host" : "/browse"));
}

export async function logout() {
  await clearSession();
  redirect("/");
}
