import { redirect } from "next/navigation";
import { resolvePortalShortcut } from "@/lib/portal/shortcuts";

export default function DeliverablesRedirectPage() {
  redirect(resolvePortalShortcut("/deliverables") ?? "/portal/deliverables");
}
