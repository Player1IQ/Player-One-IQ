import { redirect } from "next/navigation";
import { requirePortalUser } from "@/lib/portal/guard";

export default async function PortalProfilePage() {
  const { linkedCreatorId } = await requirePortalUser();
  redirect(`/creators/${linkedCreatorId}`);
}
