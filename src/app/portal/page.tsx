import { redirect } from "next/navigation";
import { getLinkedCreatorId } from "@/lib/permissions";

export default async function PortalHomePage() {
  const linkedCreatorId = await getLinkedCreatorId();

  if (linkedCreatorId) {
    redirect(`/creators/${linkedCreatorId}`);
  }

  redirect("/");
}
