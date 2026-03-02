export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError || (error instanceof Error && error.name === 'TimeoutError')
}

export function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message?.toLowerCase?.() || ''
  return error.name === 'AbortError' || message.includes('signal is aborted') || message.includes('aborted')
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
