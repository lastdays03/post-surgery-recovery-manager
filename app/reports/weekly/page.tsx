"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import { getProfile } from "@/lib/local-storage";
import { getWeeklyLogs } from "@/lib/services/log-service";
import { calculateWeeklyProgress } from "@/lib/utils/analytics";
import { WeeklyReport } from "@/lib/types/report.types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { usePdfReport } from "@/hooks/use-pdf-report";

const TEMP_CHART_DATA = [
  { date: "2026-05-20", pain: 4, energy: 6 },
  { date: "2026-05-21", pain: 3, energy: 7 },
  { date: "2026-05-22", pain: 5, energy: 5 },
  { date: "2026-05-23", pain: 2, energy: 8 },
  { date: "2026-05-24", pain: 3, energy: 7 },
  { date: "2026-05-25", pain: 2, energy: 9 },
  { date: "2026-05-26", pain: 1, energy: 9 },
];

export default function WeeklyReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const { downloadWeeklyReport, isGenerating } = usePdfReport();

  useEffect(() => {
    async function loadData() {
      try {
        const profile = getProfile();
        if (!profile) {
          router.push("/");
          return;
        }

        // Calculate date range (Last 7 days)
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);

        const endDateStr = end.toISOString().split("T")[0];
        const startDateStr = start.toISOString().split("T")[0];

        const logs = await getWeeklyLogs(profile.id, startDateStr, endDateStr);
        const weeklyReport = calculateWeeklyProgress(
          logs,
          startDateStr,
          endDateStr,
        );

        setReport(weeklyReport);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) return <div className="p-8 text-center">분석 중입니다...</div>;

  if (!report)
    return <div className="p-8 text-center">데이터를 불러올 수 없습니다.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">주간 리포트</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => report && downloadWeeklyReport(report)}
              disabled={isGenerating || !report}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isGenerating ? "생성 중..." : "PDF 저장"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-900 font-extrabold">
              이번 주 회복 상태 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg text-gray-800 font-medium">
              <img
                src="/check-icon.png"
                alt="icon"
                className="inline-block w-6 align-middle mr-2"
              />
              전반적 회복 지수 : 안정 / 주의 / 위험
            </div>
            <div className="text-lg text-gray-800 font-medium">
              <img
                src="/check-icon.png"
                alt="icon"
                className="inline-block w-6 align-middle mr-2"
              />
              식사 섭취 :{" "}
              <span className="font-bold">
                평균 62% (전주 대비{" "}
                <span className="text-blue-600 font-semibold">+12%</span>)
              </span>
            </div>
            <div className="text-lg text-gray-800 font-medium">
              <img
                src="/check-icon.png"
                alt="icon"
                className="inline-block w-6 align-middle mr-2"
              />
              주요 이슈 : 복부 팽만 지속, 수면 질 저하
            </div>
            <div className="text-lg text-gray-800 font-medium">
              <img
                src="/check-icon.png"
                alt="icon"
                className="inline-block w-6 align-middle mr-2"
              />
              권장 조치 : 식단 단계 유지 + 수분 / 식이섬유 조정
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 font-bold">
              식사 섭취 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={TEMP_CHART_DATA}
                  margin={{ top: 5, right: 5, bottom: 5, left: -25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) => str.slice(5)}
                    fontSize={12}
                  />
                  <YAxis domain={[0, 10]} fontSize={12} width={30} />
                  <Tooltip
                    labelStyle={{
                      color: "#111827",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pain"
                    name="소화위장상태"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="음식첩취율"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              통증 회복 부담 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-800">
            <p className="font-bold text-lg">
              회복 방해 요인 <span className="text-red-500">Top 1</span>
            </p>
            <p className="text-lg">· 복부 팽만 지속</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              배변 / 체온 기반 이상 신호 점검
              <p className="text-sm text-gray-400 font-medium pt-2">
                (해당 항목은 의료 개입 필요 여부 판단에 활용됩니다)
              </p>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-gray-800">
            <div className="space-y-1">
              <p className="font-semibold text-lg">변비 지속 + 섭취량 감소</p>
              <p className="text-md">→ 수분 · 식이섬유 조정 필요</p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-lg">설사 반복</p>
              <p className="text-md">→ 지방 / 유당 / 삼투성 식품 재검토</p>
            </div>

            <p className="font-semibold text-red-600 text-lg">
              체온 38℃ 이상 발생한 날: 5일
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">
              식단 적합성 평가 · 다음 주 관리 및 식단 제안
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-6 text-gray-800">
            {/* 왼쪽 */}
            <div className="space-y-2">
              <p className="font-semibold text-lg">
                현재 식단 적합도:{" "}
                <span className="text-lg font-bold">78점</span>
              </p>
              <ul className="list-disc list-inside text-md space-y-1">
                <li>소화 적합성: 85점</li>
                <li>섭취 지속성: 70점</li>
                <li>증상 유발 위험: 중간</li>
              </ul>
            </div>

            {/* 오른쪽 */}
            <div className="space-y-2">
              <p className="font-semibold text-lg">다음 주 식단 전략 제안</p>
              <ul className="list-disc list-inside text-md space-y-1">
                <li>식단 유지</li>
                <li>일부 메뉴 교체</li>
                <li>식단 단계 하향</li>
                <li className="font-bold text-blue-600">고단백 강화</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
