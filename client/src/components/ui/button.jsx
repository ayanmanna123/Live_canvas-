import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-md-primary text-md-on-primary md-shadow-1 hover:md-shadow-2 hover:bg-md-primary/95",
        tonal: "bg-md-secondary-container text-md-on-secondary-container hover:bg-md-secondary-container/80",
        outline: "border border-md-outline bg-transparent text-md-on-surface hover:bg-md-primary/5",
        ghost: "text-md-on-surface-variant hover:bg-md-surface-variant/50 hover:text-md-on-surface",
        fab: "bg-md-primary-container text-md-on-primary-container md-shadow-2 hover:md-shadow-3 rounded-2xl",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
