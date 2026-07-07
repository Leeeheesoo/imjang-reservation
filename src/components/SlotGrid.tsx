"use client";

import { useState } from "react";
import clsx from "clsx";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 09시~20시

export default function SlotGrid() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(day: number, hour: number) {
    const key = `${day}-${String(hour).padStart(2, "0")}:00`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-14 border-b border-gray-200 bg-gray-50 p-2 text-gray-500"></th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="border-b border-gray-200 bg-gray-50 p-2 font-medium text-gray-600"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="border-b border-gray-100 p-2 text-gray-500">
                  {hour}시
                </td>
                {DAYS.map((_, day) => {
                  const key = `${day}-${String(hour).padStart(2, "0")}:00`;
                  const active = selected.has(key);
                  return (
                    <td key={day} className="border-b border-gray-100 p-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(day, hour)}
                        className={clsx(
                          "h-7 w-full rounded transition-colors",
                          active
                            ? "bg-blue-600"
                            : "bg-gray-100 hover:bg-gray-200"
                        )}
                        aria-pressed={active}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        선택된 시간: {selected.size}개 (매주 반복). 최소 1개 이상 선택해야 등록할 수 있습니다.
      </p>
      {Array.from(selected).map((key) => (
        <input key={key} type="hidden" name="slots" value={key} />
      ))}
    </div>
  );
}
