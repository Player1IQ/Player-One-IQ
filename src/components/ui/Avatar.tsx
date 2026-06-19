import { cn } from "@/lib/utils";

interface AvatarProps {
  imageUrl?: string | null;
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "rounded";
  alt?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function Avatar({
  imageUrl,
  initials,
  color,
  size = "md",
  shape = "circle",
  alt = "",
}: AvatarProps) {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const ringClass =
    shape === "circle" ? "ring-2 ring-border" : "ring-1 ring-white/10";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          "shrink-0 object-cover",
          shapeClass,
          ringClass,
          sizeClasses[size]
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold text-white",
        shapeClass,
        ringClass,
        sizeClasses[size],
        color
      )}
    >
      {initials}
    </div>
  );
}
