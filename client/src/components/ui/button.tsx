import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5CEA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F7FE] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#2F5CEA] text-white hover:bg-[#244BC5] shadow-sm shadow-[#2F5CEA]/20',
        secondary:
          'bg-[#EEF3FD] text-[#2F5CEA] border border-[#2F5CEA]/20 hover:bg-[#E0EAFC]',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:border-[#2F5CEA] hover:text-[#2F5CEA] hover:bg-[#F4F7FE]/60',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/15',
        ghost:
          'text-slate-600 hover:bg-[#EEF3FD] hover:text-[#2F5CEA]',
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
