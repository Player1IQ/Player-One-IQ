import { Avatar } from "@/components/ui/Avatar";

interface TeamMemberAvatarProps {
  initials: string;
  color: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  name?: string;
}

export function TeamMemberAvatar({
  initials,
  color,
  imageUrl,
  size = "md",
  name,
}: TeamMemberAvatarProps) {
  return (
    <Avatar
      imageUrl={imageUrl}
      initials={initials}
      color={color}
      size={size}
      alt={name ? `${name} avatar` : "Team member avatar"}
    />
  );
}
