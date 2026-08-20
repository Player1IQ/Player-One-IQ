import { getTranslations } from "next-intl/server";

/** Server action error messages — use `const te = await getActionErrors()` then `te('key')`. */
export async function getActionErrors() {
  return getTranslations("errors");
}
