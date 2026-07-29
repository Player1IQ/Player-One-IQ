export function getTimeBasedGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getFirstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Creator";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function buildGreeting(firstName: string, date = new Date()): string {
  return `${getTimeBasedGreeting(date)}, ${firstName}`;
}
