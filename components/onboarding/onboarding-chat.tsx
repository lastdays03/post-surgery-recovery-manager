"use client";

import { useState, useEffect, useRef } from "react";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, User, Bot, Loader2, CheckCircle2 } from "lucide-react";
import type { Value } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function OnboardingChat() {
  const {
    updateFormData,
    setStep,
    confirmationStatus,
    setConfirmationStatus,
    setIsDatePickerOpen,
  } = useOnboardingStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "안녕하세요! 수술 후 회복 관리를 도와드릴 AI 가이드입니다. 먼저 어떤 수술을 받으셨는지 말씀해 주시겠어요? (예: 위절제술, 대장절제술, 무릎 인공관절 등)",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [tempSurgeryType, setTempSurgeryType] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, confirmationStatus]);

  useEffect(() => {
    if (!isLoading && !isComplete && confirmationStatus === "idle") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isLoading, isComplete, confirmationStatus]);

  const handleSendMessage = async (manualMessage?: string) => {
    const messageToSend = manualMessage || inputValue.trim();
    if (!messageToSend || isLoading) return;

    if (!manualMessage) setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: messageToSend }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
          },
        ]);
      } else {
        // 데이터 추출 및 확인 로직
        let shouldAddAiMessage = true;

        if (data.extractedData) {
          // 수술명이 추출되었고, 아직 확인되지 않은 상태라면 확인 모드로 진입
          if (
            data.extractedData.surgery_type &&
            confirmationStatus === "idle"
          ) {
            setTempSurgeryType(data.extractedData.surgery_type);
            setConfirmationStatus("pending_confirmation");
          }

          // 이미 확인된 상태에서 날짜가 추출되었다면 업데이트 및 완료 처리
          // 이때 AI의 마지막 응답("다음 단계를 안내합니다" 등)은 표시하지 않음
          if (
            confirmationStatus === "confirmed" &&
            data.extractedData.surgery_date
          ) {
            updateFormData({ surgery_date: data.extractedData.surgery_date });
            setIsComplete(true);
            shouldAddAiMessage = false; // 마지막 응답 차단
          }
        }

        if (shouldAddAiMessage) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.message },
          ]);
        }

        // AI가 직접 완료 상태를 보내온 경우 (백엔드 로직에 따라)
        if (data.isComplete && confirmationStatus === "confirmed") {
          setIsComplete(true);
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "서버 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSurgery = (confirmed: boolean) => {
    setConfirmationStatus(confirmed ? "confirmed" : "idle");
    if (confirmed) {
      // "네, 맞아요" 자동 전송 -> AI에게 "네"라고 답변하여 날짜 질문 유도
      updateFormData({ surgery_type: tempSurgeryType! });
      handleSendMessage("네, 맞아요");
    } else {
      handleSendMessage("아니요, 틀렸습니다. 다시 입력할게요.");
      setTempSurgeryType(null);
    }
  };

  const handleDateSelect = (date: string) => {
    updateFormData({ surgery_date: date });
    // 사용자 메시지만 기록에 추가하고 AI API는 호출하지 않음
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `${date}에 수술 받았습니다.` },
    ]);
    setIsComplete(true);
  };

  const handleFinalize = () => {
    setStep(2);
  };

  const [selectedDate, setSelectedDate] = useState<Value>(null);

  return (
    <Card className="max-w-3xl mx-auto flex flex-col h-screen md:h-[700px] overflow-hidden px-0 pb-0">
      {/* Header */}
      <div className="bg-white border-b pb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 pb-1">
          회복 관리 매니저 AI 상담
        </h3>
        <p className="text-md text-gray-500">
          대화를 통해 맞춤형 회복 계획을 세워보세요
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[80%] items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  message.role === "user" ? "bg-blue-100" : "bg-white border"
                }`}
              >
                {message.role === "user" ? (
                  <User size={20} className="text-blue-600" />
                ) : (
                  <Bot size={20} className="text-gray-600" />
                )}
              </div>
              <div
                className={`p-4 rounded-2xl text-md leading-relaxed ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white text-gray-800 rounded-tl-none border"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {/* Confirmation UI */}
        {confirmationStatus === "pending_confirmation" && !isLoading && (
          <div className="flex justify-center gap-4 py-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-4 rounded-xl border border-gray-900 text-center space-y-3">
              <p className="font-bold text-gray-900 text-xl">
                "{tempSurgeryType}"이(가) 맞나요?
              </p>
              <p className="text-gray-500 text-md pb-4">
                아래 해당되는 버튼을 눌러주세요
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => handleConfirmSurgery(false)}
                  className="border-gray-900 hover:border-gray-800 hover:bg-gray-100 text-gray-900 text-lg border-1"
                >
                  아니요
                </Button>
                <Button
                  size="md"
                  onClick={() => handleConfirmSurgery(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-lg"
                >
                  네, 맞아요
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Date Picker UI */}
        {confirmationStatus === "confirmed" &&
          !isComplete &&
          !isLoading &&
          messages[messages.length - 1].role === "assistant" && (
            <div className="flex justify-center p-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white p-6 rounded-2xl border w-full max-w-md flex flex-col items-center gap-4 border-gray-900">
                <p className="font-bold text-gray-900 text-xl">
                  수술한 날짜를 선택해주세요
                </p>
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  maxDate={new Date()} // 오늘 이후 날짜 선택/hover 차단
                  locale="ko-KR"
                  /** drill down 완전 차단 */
                  minDetail="month"
                  maxDetail="month"
                  /** 월/년도 텍스트만 표시 (클릭 불가) */
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
                  /** 날짜 텍스트를 숫자만 표시 */
                  formatDay={(locale, date) => String(date.getDate())}
                  /* 요일을 일요일부터 시작 */
                  calendarType="gregory"
                  formatWeekday={(locale, date) =>
                    ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
                  }
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
                    color: #000 !important;
                    font-weight: 700;
                    font-size: 18px;
                    pointer-events: none; /* drill down 완전 차단 */
                    cursor: default;
                    opacity: 1 !important;
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

                  /* 비활성 날짜 (오늘 이후) */
                  .react-calendar__tile--disabled {
                    color: #d1d5db;
                    pointer-events: none; /* 🔥 hover 자체 차단 */
                    background: transparent;
                  }
                `}</style>
                {selectedDate instanceof Date && (
                  <div className="w-full flex flex-col gap-3">
                    <p className="text-center text-lg font-bold">
                      선택된 날짜: {format(selectedDate, "yyyy.MM.dd")}
                    </p>

                    <Button
                      onClick={() =>
                        handleDateSelect(format(selectedDate, "yyyy-MM-dd"))
                      }
                      className="w-full bg-gray-900 hover:bg-gray-800 py-6 text-lg rounded-xl font-bold"
                    >
                      선택 완료
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl rounded-tl-none border">
              <Loader2 className="animate-spin text-gray-500" size={16} />
              <span className="text-xs text-gray-600 font-medium">
                AI 분석 중...
              </span>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border border-green-200 mt-4 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={48} className="text-green-500 mb-3" />
            <h4 className="text-lg font-bold text-green-800 mb-1">
              정보 수집 완료!
            </h4>
            <div className="mb-4" />
            <Button
              onClick={handleFinalize}
              className="bg-green-600 hover:bg-green-700"
            >
              다음 단계로 이동
            </Button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      {confirmationStatus === "idle" && !isComplete && (
        <div className="p-4 bg-white border-t">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="메시지 입력"
              disabled={isLoading}
              className="flex-1 min-w-0 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 placeholder:text-gray-500 text-gray-700 text-base"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              aria-label="보내기"
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white w-[60px] h-[60px] rounded-xl transition-colors flex items-center justify-center"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
