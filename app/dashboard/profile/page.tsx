'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, clearProfile } from '@/lib/local-storage'
import { UserProfile } from '@/lib/types/user.types'
import { ProfileEditForm } from '@/components/dashboard/profile-edit-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'

export default function ProfileEditPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const handleReset = () => {
        if (confirm('모든 데이터를 초기화하고 처음으로 돌아가시겠습니까? \n이 작업은 되돌릴 수 없습니다.')) {
            clearProfile()
            router.push('/')
        }
    }

    useEffect(() => {
        const loadProfile = () => {
            const savedProfile = getProfile()
            if (!savedProfile) {
                router.push('/onboarding')
                return
            }

            // Date formatting fix for JSON parsed object
            const userProfile: UserProfile = {
                ...savedProfile,
                surgery_date: new Date(savedProfile.surgery_date),
                created_at: new Date(savedProfile.created_at),
                updated_at: new Date(savedProfile.updated_at)
            }

            setProfile(userProfile)
            setIsLoading(false)
        }

        loadProfile()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg font-medium">프로필 불러오는 중...</span>
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-800">내 건강 프로필 수정</h1>
                    </div>
                </div>
            </header>

            <main className="container max-w-2xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">프로필 관리</h2>
                    <p className="text-sm text-gray-500">
                        수술 후 변화하는 내 몸 상태를 최신으로 유지하세요.
                        입력된 정보에 따라 맞춤형 가이 갱신됩니다.
                    </p>
                </div>

                <ProfileEditForm profile={profile} />

                <div className="mt-12 pt-6 border-t">
                    <Card className="border-red-100 bg-red-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md font-bold text-red-800 flex items-center gap-2">
                                <Trash2 className="h-4 w-4" /> 위험 구역
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-600 mb-4">
                                모든 프로필 정보와 기록된 데이터를 삭제하고 초기 상태로 돌아갑니다.
                            </p>
                            <Button
                                variant="secondary"
                                onClick={handleReset}
                                className="w-full sm:w-auto bg-red-500 text-white hover:bg-red-600 border-none"
                            >
                                데이터 전체 초기화
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
