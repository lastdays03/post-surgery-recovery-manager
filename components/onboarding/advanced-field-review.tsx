"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface FieldData<T = any> {
    value: T
    confidence?: number
}

interface AdvancedFieldReviewProps {
    field: FieldData
    label: string
    unit?: string
    warningLevel?: "normal" | "medium" | "high"
    onEdit: (value: any) => void
    className?: string
}

export function AdvancedFieldReview({
    field,
    label,
    unit,
    warningLevel = "normal",
    onEdit,
    className
}: AdvancedFieldReviewProps) {
    const isWarning = warningLevel !== "normal"

    return (
        <div className={cn("flex flex-col space-y-2 p-4 bg-white rounded-lg border border-gray-100 shadow-sm", className)}>
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">{label}</Label>
                {warningLevel === "high" && (
                    <Badge variant="destructive" className="text-xs">
                        고위험
                    </Badge>
                )}
                {warningLevel === "medium" && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs">
                        주의
                    </Badge>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    value={field.value ?? ""}
                    onChange={(e) => {
                        const val = e.target.value === "" ? null : parseFloat(e.target.value)
                        onEdit(val)
                    }}
                    className={cn(
                        "text-right font-medium",
                        warningLevel === "high" && "text-red-600 border-red-200 focus-visible:ring-red-200",
                        warningLevel === "medium" && "text-amber-600 border-amber-200 focus-visible:ring-amber-200"
                    )}
                    placeholder="-"
                />
                {unit && (
                    <span className="text-sm text-gray-500 font-medium w-8">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}
