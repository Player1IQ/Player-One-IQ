interface TeamMemberAvatarProps {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function TeamMemberAvatar({
  initials,
  color,
  size = "md",
}: TeamMemberAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-border shadow-md ${sizeClasses[size]} ${color}`}
    >
      {initials}
    </div>
  );
}
