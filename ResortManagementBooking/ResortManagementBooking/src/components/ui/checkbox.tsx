import * as React from "react"
import { cn } from "../../lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer",
            "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
            className
          )}
          {...props}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

