"use client";

import { ArrowLeft } from "lucide-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { saveSymptomLog } from "@/lib/services/log-service";
import { getProfile } from "@/lib/local-storage";

import type {
  MealIntakeStatus,
  PostMealSymptom,
  BodyTemperatureStatus,
  BowelStatus,
  MostDifficultAspect,
  AbnormalSymptom
} from '@/lib/types/symptom.types';

type FormData = {
  painLevel: number;
  energyLevel: number;
  mealIntake: MealIntakeStatus;
  postMealSymptom: PostMealSymptom;
  bodyTemperature: BodyTemperatureStatus;
  bowelStatus: BowelStatus;
  mostDifficult: MostDifficultAspect;
  abnormalSymptoms: AbnormalSymptom[];
};

export default function SymptomCheckPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, register } = useForm<FormData>({
    defaultValues: {
      painLevel: 0,
      energyLevel: 5,
      mealIntake: "good",
      postMealSymptom: "none",
      bodyTemperature: "normal",
      bowelStatus: "normal",
      mostDifficult: "none",
      abnormalSymptoms: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const profile = getProfile();
      if (!profile) {
        alert("프로필을 찾을 수 없습니다.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      await saveSymptomLog(profile.id, today, data);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-md mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">컨디션 기록</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-md mx-auto px-2 py-6">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-gray-900 text-xl font-bold">
                    통증 정도 (0-10)
                  </Label>
                  <span className="text-sm font-bold text-blue-600">
                    {/* We can use watch here if needed, but slider shows value relative position */}
                  </span>
                </div>
                <Controller
                  name="painLevel"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                      />
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>없음</span>
                        <span>극심함</span>
                      </div>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  기력 (0-10)
                </Label>
                <Controller
                  name="energyLevel"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                      />
                      <div className="flex justify-between text-sm text-gray-500 font-medium">
                        <span>지침</span>
                        <span>활기참</span>
                      </div>
                    </div>
                  )}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  식사 섭취율
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  {["good", "moderate", "bad", "none"].map((status) => (
                    <label
                      key={status}
                      className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                    >
                      <input
                        type="radio"
                        value={status}
                        {...register("mealIntake")}
                        className="accent-blue-600"
                      />
                      <span className="text-base text-gray-700 font-semibold whitespace-pre-line">
                        {status === "none" && "거의 못 먹음\n(0~25%)"}
                        {status === "bad" && "절반 정도\n(25~50%)"}
                        {status === "moderate" && "대부분 섭취\n(50~75%)"}
                        {status === "good" && "거의 다 섭취\n(75% 이상)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  식사 후 증상
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  {["bloating", "distension", "heartburn", "nausea", "none"].map(
                    (status) => (
                      <label
                        key={status}
                        className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                      >
                        <input
                          type="radio"
                          value={status}
                          {...register("postMealSymptom")}
                          className="accent-blue-600"
                        />
                        <span className="text-base text-gray-700 font-semibold whitespace-pre-line">
                          {status === "bloating" && "더부룩함"}
                          {status === "distension" && "복부 팽만"}
                          {status === "heartburn" && "속쓰림"}
                          {status === "nausea" && "메스꺼움"}
                          {status === "none" && "없음"}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  체온 이상 여부
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  {["normal", "mild_fever", "high_fever"].map((status) => (
                    <label
                      key={status}
                      className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                    >
                      <input
                        type="radio"
                        value={status}
                        {...register("bodyTemperature")}
                        className="accent-blue-600"
                      />
                      <span className="text-base text-gray-700 font-semibold">
                        {status === "normal" && "정상"}
                        {status === "mild_fever" && "미열"}
                        {status === "high_fever" && "38도 이상"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  배변 상태
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  {["normal", "constipation", "diarrhea", "none"].map((status) => (
                    <label
                      key={status}
                      className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                    >
                      <input
                        type="radio"
                        value={status}
                        {...register("bowelStatus")}
                        className="accent-blue-600"
                      />
                      <span className="text-base text-gray-700 font-semibold">
                        {status === "normal" && "정상"}
                        {status === "constipation" && "변비"}
                        {status === "diarrhea" && "설사"}
                        {status === "none" && "아직 없음"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  오늘 가장 힘들었던 점
                </Label>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  {["meal", "pain", "sleep", "activity", "none"].map(
                    (status) => (
                      <label
                        key={status}
                        className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                      >
                        <input
                          type="radio"
                          value={status}
                          {...register("mostDifficult")}
                          className="accent-blue-600"
                        />
                        <span className="text-base text-gray-700 font-semibold">
                          {status === "meal" && "식사"}
                          {status === "pain" && "통증"}
                          {status === "sleep" && "수면"}
                          {status === "activity" && "활동"}
                          {status === "none" && "없음"}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-gray-900 text-xl font-bold">
                  특이 증상 체크 (복수 선택)
                </Label>
                <Controller
                  name="abnormalSymptoms"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <div className="grid grid-cols-2 gap-2 pt-4">
                      {[
                        "wound_pain_increase",
                        "wound_redness",
                        "severe_abdominal_pain",
                        "vomiting",
                        "none",
                      ].map((symptom) => {
                        const checked =
                          value?.includes(symptom as AbnormalSymptom) || false;
                        return (
                          <label
                            key={symptom}
                            className="flex items-center space-x-4 border p-4 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                const currentSymptoms = value || [];

                                if (symptom === "none") {
                                  // "없음" 선택 시 다른 모든 증상 해제
                                  onChange(isChecked ? ["none"] : []);
                                } else {
                                  // 다른 증상 선택 시 "없음" 제거
                                  const filtered = currentSymptoms.filter(
                                    (s) => s !== "none",
                                  );
                                  if (isChecked) {
                                    onChange([
                                      ...filtered,
                                      symptom as AbnormalSymptom,
                                    ]);
                                  } else {
                                    onChange(
                                      filtered.filter((s) => s !== symptom),
                                    );
                                  }
                                }
                              }}
                              className="accent-blue-600"
                            />
                            <span className="text-base text-gray-700 font-semibold whitespace-pre-line text-left">
                              {symptom === "wound_pain_increase" &&
                                "상처 통증\n증가"}
                              {symptom === "wound_redness" &&
                                "상처 부위\n발적 / 열감"}
                              {symptom === "severe_abdominal_pain" &&
                                "심한 복부\n통증"}
                              {symptom === "vomiting" && "구토"}
                              {symptom === "none" && "없음"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>



              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "저장 중..." : "저장하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
