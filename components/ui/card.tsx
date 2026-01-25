import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
            {children}
        </div>
    )
}

export function CardHeader({ children, className = '' }: CardProps) {
    return <div className={`flex flex-col space-y-1.5 pb-6 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: CardProps) {
    return <h3 className={`font-semibold leading-none tracking-tight text-xl ${className}`}>{children}</h3>
}

export function CardContent({ children, className = '' }: CardProps) {
    return <div className={`p-0 ${className}`}>{children}</div>
}
