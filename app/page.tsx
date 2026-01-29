"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/local-storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 이미 프로필이 있다면 대시보드로 리다이렉트
    const profile = getProfile();
    if (profile) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6">
      <main className="max-w-2xl w-full text-center">
        <div className="mb-12">
          <span className="text-6xl mb-4 block">🏥</span>
          <h1 className="text-5xl font-bold mb-4 text-gray-900 leading-[1.2]">
            수술 후 <br />
            회복 관리 매니저
          </h1>
          <p className="text-xl text-gray-600 leading-[1.5]">
            수술 종류와 시기에 딱 맞는 맞춤형 가이드를 제공합니다.
            <br />
            안전하고 빠른 일상 복귀를 도와드릴게요!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
          <Card className="bg-white/90 backdrop-blur">
            <div className="flex items-center">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-2 text-gray-900">
                  AI 맞춤 식단
                </h2>
                <p className="text-gray-700 leading-[1.5]">
                  회복 단계에 따라 오늘 먹을 수 있는 식단 추천 기능
                </p>
              </div>
              <img
                src="/fork-icon.png"
                alt="icon"
                className="w-14 h-14 ml-auto"
              />
            </div>
          </Card>

          <Card className="bg-white/90 backdrop-blur">
            <div className="flex items-center">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  재활 운동 코칭
                </h3>
                <p className="text-gray-700 leading-[1.5]">
                  수술 부위에 무리가 가지 않는 시기별 재활 운동법 제공
                </p>
              </div>
              <img
                src="/exercise-icon.png"
                alt="icon"
                className="w-14 h-14 ml-auto"
              />
            </div>
          </Card>
        </div>

        <Button
          size="lg"
          onClick={() => router.push("/onboarding")}
          className="w-full md:w-auto text-2xl py-6 px-12"
        >
          회복 관리 시작하기
        </Button>
      </main>

      <footer className="mt-16 text-gray-400 text-sm">
        Post-Surgery Recovery Manager &copy; 2026
      </footer>
    </div>
  );
}
