export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export async function withTimeout<T>(
  promiseLike: PromiseLike<T>,
  ms: number,
  label?: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(label ? `${label} timed out after ${ms}ms` : `Timed out after ${ms}ms`))
    }, ms)
  })

  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
