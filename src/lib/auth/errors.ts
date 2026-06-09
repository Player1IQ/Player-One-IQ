export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return (
      "Supabase email rate limit reached. Wait about an hour and try again, " +
      "or sign in if you already created an account. For local development, " +
      "disable “Confirm email” in Supabase → Authentication → Providers → Email."
    );
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Use Sign in instead.";
  }

  return message;
}
