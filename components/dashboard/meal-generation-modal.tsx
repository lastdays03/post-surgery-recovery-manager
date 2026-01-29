"use client";

import { useState } from "react";
// import { Calendar } from '@/components/ui/calendar'
import { Button } from "@/components/ui/button";
import { X, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { ko } from "date-fns/locale";
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MealGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onGenerate: (range: DateRange) => Promise<void>;
}

export function MealGenerationModal({
  isOpen,
  onClose,
  userId,
  onGenerate,
}: MealGenerationModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Reset date range when modal opens
  if (!isOpen && dateRange) {
    setDateRange(undefined);
  }

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (_: DateRange | undefined, selectedDay: Date) => {
    // Prevent selecting past dates (should be handled by disabled prop too)
    if (selectedDay < today) return;

    setDateRange({
      from: today,
      to: selectedDay,
    });
  };

  const handleConfirm = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setIsLoading(true);
    try {
      await onGenerate(dateRange);
      // The parent component should handle navigation or state update
    } catch (error) {
      console.error(error);
      alert("식단 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate nights/days just for display info
  const getDurationText = () => {
    if (!dateRange?.from || !dateRange?.to) return "";

    const diffTime = Math.abs(
      dateRange.to.getTime() - dateRange.from.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${format(dateRange.from, "M월 d일", { locale: ko })} - ${format(dateRange.to, "M월 d일", { locale: ko })} (${diffDays}일)`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              식단 생성 기간 선택
            </h3>
            <p className="text-md text-gray-500">
              오늘부터 선택한 날짜까지 식단이 생성돼요
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="border-1 border-gray-900 rounded-xl">
            <Calendar
              /** range 선택 */
              selectRange
              value={
                dateRange?.from
                  ? dateRange.to
                    ? [dateRange.from, dateRange.to]
                    : [dateRange.from, dateRange.from]
                  : null
              }
              onChange={(value) => {
                if (!Array.isArray(value)) return;

                const [from, to] = value;
                if (!from) return;

                setDateRange({ from, to: to ?? undefined });
              }}
              /** 오늘 이전 날짜 완전 차단 */
              minDate={today}
              /** drill down 완전 차단 (월/년 클릭 불가) */
              minDetail="month"
              maxDetail="month"
              /** 월 / 년 텍스트 (클릭 안 됨) */
              navigationLabel={({ date }) => (
                <span className="text-lg font-bold cursor-default text-black opacity-100">
                  {date.getFullYear()}년 {date.getMonth() + 1}월
                </span>
              )}
              /** 월 이동은 꺽쇠만 */
              prevLabel={<ChevronLeft className="h-5 w-5" />}
              nextLabel={<ChevronRight className="h-5 w-5" />}
              prev2Label={null}
              next2Label={null}
              /** 날짜 숫자만 표시 */
              formatDay={(locale, date) => String(date.getDate())}
              /** 요일: 일 ~ 토 */
              calendarType="gregory"
              formatWeekday={(locale, date) =>
                ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
              }
              className="bg-white rounded-xl shadow-sm p-2"
            />
            <style jsx global>{`
              /* =========================
                  react-calendar 커스텀 스타일
                  ========================= */

              /* 전체 캘린더 */
              .react-calendar {
                width: 100%;
                border: none;
                font-family: inherit;
              }

              /* 상단 네비게이션 */
              .react-calendar__navigation {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
              }

              /* 월 / 년 텍스트 (클릭 완전 차단) */
              .react-calendar__navigation__label,
              .react-calendar__navigation__label span {
                color: #000000 !important;
                font-weight: 700 !important;
                font-size: 18px !important;
                pointer-events: none; /* drill down 완전 차단 */
                cursor: default;
                opacity: 1 !important;
                background: transparent !important;
              }

              /* 버튼 자체의 disabled 스타일 덮어쓰기 */
              .react-calendar__navigation button:disabled {
                background-color: transparent !important;
                opacity: 1 !important;
                color: #000000 !important;
              }

              /* 네비게이션 버튼 */
              .react-calendar__navigation button {
                border-radius: 8px;
                padding: 6px;
              }

              /* 비활성화된 꺽쇠 */
              .react-calendar__navigation button:disabled {
                opacity: 0.3;
                cursor: not-allowed;
                background: transparent;
              }

              /* 날짜 셀 */
              .react-calendar__tile {
                height: 40px;
                border-radius: 8px;
              }

              /* hover */
              .react-calendar__tile:enabled:hover {
                background: #f3f4f6; /* gray-100 */
              }

              /* 오늘 */
              .react-calendar__tile--now {
                border: 1px solid #9ca3af;
              }

              /* 선택된 날짜 (단일) */
              .react-calendar__tile--active {
                background: #111827;
                color: white;
              }

              /* range 시작 */
              .react-calendar__tile--rangeStart {
                background: #111827;
                color: white;
                border-radius: 9999px 0 0 9999px;
              }

              /* range 중간 */
              .react-calendar__tile--range {
                background: #e5e7eb;
                color: #111827;
              }

              /* range 끝 */
              .react-calendar__tile--rangeEnd {
                background: #111827;
                color: white;
                border-radius: 0 9999px 9999px 0;
              }

              /* 비활성 날짜 (오늘 이전) */
              .react-calendar__tile--disabled {
                color: #d1d5db !important;
                background-color: transparent !important;
                pointer-events: none;
              }
            `}</style>
          </div>

          <div className="w-full bg-blue-50 p-6 rounded-xl flex justify-between items-center">
            <span className="text-md font-medium text-blue-700">
              선택된 기간
            </span>
            <span className="text-md font-bold text-blue-900">
              {dateRange?.to ? getDurationText() : "종료 날짜를 선택해주세요"}
            </span>
          </div>

          <Button
            disabled={!dateRange?.from || !dateRange?.to || isLoading}
            onClick={handleConfirm}
            className="w-full py-6 text-lg font-bold rounded-xl bg-gray-900 hover:bg-gray-800"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                AI가 맞춤 식단을 구성중입니다...
              </div>
            ) : (
              "선택한 기간으로 식단 생성하기"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
