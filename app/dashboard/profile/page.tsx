'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/local-storage'
import { UserProfile } from '@/lib/types/user.types'
import { ProfileEditForm } from '@/components/dashboard/profile-edit-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function ProfileEditPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

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
            </main>
        </div>
    )
}
