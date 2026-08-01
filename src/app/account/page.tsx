import { redirect } from "next/navigation";
import { resolvePortalShortcut } from "@/lib/portal/shortcuts";

export default function AccountRedirectPage() {
  redirect(resolvePortalShortcut("/account") ?? "/portal/account");
}
