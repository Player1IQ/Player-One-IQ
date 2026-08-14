import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_LOGO_ALT, BRAND_LOGO_PATH } from "@/lib/branding";

const sizeClasses = {
  xs: "h-5",
  sm: "h-7",
  md: "h-8",
  lg: "h-10",
  xl: "h-14",
} as const;

type BrandLogoSize = keyof typeof sizeClasses;

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  size = "md",
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={BRAND_LOGO_PATH}
      alt={BRAND_LOGO_ALT}
      width={1024}
      height={1024}
      priority={priority}
      className={cn(
        "w-auto shrink-0 object-contain",
        // Transparent wordmark: white "P1" needs a soft halo on lighter surfaces.
        "drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface BrandLogoLinkProps extends BrandLogoProps {
  href?: string;
}

export function BrandLogoLink({
  href = "/",
  size = "md",
  className,
  priority = false,
}: BrandLogoLinkProps) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)}>
      <BrandLogo size={size} priority={priority} />
    </Link>
  );
}
