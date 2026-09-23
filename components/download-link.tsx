import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DownloadLink({
  href,
  children,
  className,
  variant = "outline",
  size,
  testId,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  testId?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <a
      href={href}
      download
      data-testid={testId}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </a>
  );
}
