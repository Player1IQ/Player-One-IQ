interface SponsorLogoProps {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function SponsorLogo({
  initials,
  color,
  size = "md",
}: SponsorLogoProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-lg ring-1 ring-white/10 ${sizeClasses[size]} ${color}`}
    >
      {initials}
    </div>
  );
}
