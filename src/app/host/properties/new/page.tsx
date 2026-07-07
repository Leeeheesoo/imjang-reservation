import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createProperty } from "@/lib/actions/property";
import SlotGrid from "@/components/SlotGrid";
import { redirect } from "next/navigation";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/verify?role=HOST&redirectTo=/host/properties/new");
  if (user!.role !== "HOST") redirect("/verify?role=HOST&redirectTo=/host/properties/new");

  const { error } = await searchParams;
  const complexes = await prisma.complex.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900">매물 등록</h1>
      <p className="mt-1 text-sm text-gray-500">
        5분이면 충분합니다. 방문 가능 시간을 반드시 1개 이상 선택해야 등록이 완료됩니다.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <form action={createProperty} className="mt-6 flex flex-col gap-5">
        <div>
          <label className="text-sm font-medium text-gray-700">단지</label>
          <select
            name="complexId"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.district})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">동</label>
            <input
              name="dong"
              required
              placeholder="101동"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">호수 (비공개)</label>
            <input
              name="ho"
              placeholder="1502호"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">평형</label>
            <input
              name="pyeong"
              type="number"
              required
              placeholder="34"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">유형</label>
            <select
              name="type"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="SALE">매매</option>
              <option value="JEONSE">전세</option>
              <option value="TENANT_OCCUPIED">세입자 거주 중 (가격 비공개)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            가격 (선택 입력)
          </label>
          <input
            name="price"
            placeholder="예: 8억 5천 / 미입력 가능"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">설명 (선택)</label>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            방문 가능 시간 (매주 반복)
          </label>
          <div className="mt-2">
            <SlotGrid />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          매물 등록하기
        </button>
      </form>
    </main>
  );
}
