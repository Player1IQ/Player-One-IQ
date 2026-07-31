import { redirect } from "next/navigation";
import { resolvePortalShortcut } from "@/lib/portal/shortcuts";

export default function CoachRedirectPage() {
  redirect(resolvePortalShortcut("/coach") ?? "/portal/coach");
}
