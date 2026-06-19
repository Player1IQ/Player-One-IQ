import { Avatar } from "@/components/ui/Avatar";

interface CreatorAvatarProps {
  imageUrl?: string | null;
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  name?: string;
}

export function CreatorAvatar({
  imageUrl,
  initials,
  color,
  size = "md",
  name,
}: CreatorAvatarProps) {
  return (
    <Avatar
      imageUrl={imageUrl}
      initials={initials}
      color={color}
      size={size}
      shape="circle"
      alt={name ? `${name} avatar` : "Creator avatar"}
    />
  );
}
