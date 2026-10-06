export function logServerTiming(label: string, startedAt: number): void {
  const durationMs = Date.now() - startedAt;
  console.info(`[timing] ${label} ${durationMs}ms`);
}

export async function withServerTiming<T>(
  label: string,
  run: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  try {
    return await run();
  } finally {
    logServerTiming(label, startedAt);
  }
}

export async function withTimeout<T>(
  run: () => Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  const work = run();
  void work.catch(() => undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
