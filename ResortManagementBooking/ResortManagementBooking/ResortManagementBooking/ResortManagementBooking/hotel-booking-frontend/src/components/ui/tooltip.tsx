import * as React from "react"
import { cn } from "../../lib/utils"

interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "bottom" | "left" | "right"
}

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, side = "top" }) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  const showTooltip = (e: React.MouseEvent | React.FocusEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tooltipRect = { width: 200, height: 40 } // Approximate tooltip size
    
    let top = 0
    let left = 0
    
    switch (side) {
      case "top":
        top = rect.top - tooltipRect.height - 5
        left = rect.left + rect.width / 2 - tooltipRect.width / 2
        break
      case "bottom":
        top = rect.bottom + 5
        left = rect.left + rect.width / 2 - tooltipRect.width / 2
        break
      case "left":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2
        left = rect.left - tooltipRect.width - 5
        break
      case "right":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2
        left = rect.right + 5
        break
    }
    
    setPosition({ top, left })
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md shadow-lg whitespace-nowrap max-w-xs",
            "pointer-events-none"
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" 
               style={{
                 bottom: side === "top" ? "-4px" : "auto",
                 top: side === "bottom" ? "-4px" : "auto",
                 left: side === "right" ? "-4px" : "auto",
                 right: side === "left" ? "-4px" : "auto",
               }} />
        </div>
      )}
    </div>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props} />
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
