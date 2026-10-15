const QA_TEST_EMAIL_SUFFIX = "@example.com";
export const QA_TEST_STORAGE_KEY = "p1iq_qa_test";
export const QA_TEST_COOKIE = "p1iq_qa_test";

export function isQaTestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.trim().toLowerCase().endsWith(QA_TEST_EMAIL_SUFFIX));
}
