import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "t-btn shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary-50 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 border border-secondary-200 dark:border-secondary-600 shadow-sm hover:bg-secondary-100 dark:hover:bg-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-500",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border border-secondary-300 dark:border-secondary-600 bg-transparent hover:bg-secondary-50 dark:hover:bg-secondary-800 text-secondary-700 dark:text-secondary-200",
        ghost: "hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-300",
        link: "text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-7 py-2.5 tracking-wide",
        sm: "h-9 rounded-lg px-4 text-xs tracking-wide",
        lg: "h-14 rounded-xl px-10 text-base tracking-wide",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
