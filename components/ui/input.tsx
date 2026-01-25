import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="mb-6">
                <label className="block text-xl font-bold mb-2 text-gray-900">
                    {label}
                </label>
                <input
                    ref={ref}
                    className={`w-full px-6 py-4 text-lg font-medium text-gray-900 border-2 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-gray-400 ${error ? 'border-red-500' : 'border-gray-300'
                        } ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-2 text-red-500 text-base">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
