"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Check, AlertCircle } from "lucide-react"

interface FieldData<T = any> {
    value: T
    confidence?: number
}

interface Option {
    value: string
    label: string
}

interface BasicFieldReviewProps {
    field: FieldData
    label: string
    type?: "text" | "number" | "date"
    options?: Option[]
    onEdit: (value: any) => void
    className?: string
}

export function BasicFieldReview({
    field,
    label,
    type = "text",
    options,
    onEdit,
    className
}: BasicFieldReviewProps) {
    const isLowConfidence = (field.confidence || 0) < 0.8
    const hasValue = field.value !== null && field.value !== undefined && field.value !== ""

    return (
        <div className={cn("flex flex-col space-y-2 py-3 border-b border-gray-100 last:border-0", className)}>
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-600">{label}</Label>
                {hasValue && !isLowConfidence && (
                    <span className="text-xs text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 mr-1" />
                        확인됨 {(field.confidence || 0) * 100}%
                    </span>
                )}
                {isLowConfidence && (
                    <span className="text-xs text-amber-600 flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        확인 필요
                    </span>
                )}
            </div>

            <div className="relative">
                {options ? (
                    <select
                        value={String(field.value || "")}
                        onChange={(e) => onEdit(e.target.value)}
                        className={cn(
                            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            isLowConfidence && "border-amber-300 bg-amber-50/50 focus:ring-amber-200"
                        )}
                    >
                        <option value="" disabled>선택해주세요</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <Input
                        type={type}
                        value={field.value || ""}
                        onChange={(e) => {
                            const val = type === "number" ? parseFloat(e.target.value) : e.target.value
                            onEdit(val)
                        }}
                        className={cn(
                            isLowConfidence && "border-amber-300 bg-amber-50/50 focus-visible:ring-amber-200"
                        )}
                        placeholder={`${label} 입력`}
                    />
                )}
            </div>
        </div>
    )
}
