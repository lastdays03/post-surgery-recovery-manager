import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

export function Badge({
    className = "",
    variant = "default",
    ...props
}: BadgeProps) {
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

    const variants = {
        default: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-gray-900 border-gray-200"
    }

    // 단순 문자열 병합 (프로젝트에 유틸 라이브러리가 없을 경우를 대비)
    const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`

    return (
        <div className={combinedClassName} {...props} />
    )
}
