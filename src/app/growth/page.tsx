import { redirect } from "next/navigation";
import { resolvePortalShortcut } from "@/lib/portal/shortcuts";

export default function GrowthRedirectPage() {
  redirect(resolvePortalShortcut("/growth") ?? "/portal/growth");
}
