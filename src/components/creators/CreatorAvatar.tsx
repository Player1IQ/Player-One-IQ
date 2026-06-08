interface CreatorAvatarProps {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function CreatorAvatar({
  initials,
  color,
  size = "md",
}: CreatorAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-border ${sizeClasses[size]} ${color}`}
    >
      {initials}
    </div>
  );
}
