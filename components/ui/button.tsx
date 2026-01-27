import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    children: React.ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
        ghost: 'hover:bg-gray-100 text-gray-900 bg-transparent'
    }

    const sizeStyles = {
        sm: 'px-4 py-2 text-base h-9',
        md: 'px-8 py-4 text-xl h-14', // 기존 스타일 유지하되 높이 명시
        lg: 'px-12 py-6 text-2xl h-16',
        icon: 'h-10 w-10 p-2'
    }

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
