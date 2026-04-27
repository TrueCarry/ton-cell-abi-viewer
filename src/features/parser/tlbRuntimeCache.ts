import { parseTLB } from '@ton-community/tlb-runtime'

const runtimeCache = new Map<string, ReturnType<typeof parseTLB>>()

export function getCachedTlbRuntime(tlb: string): ReturnType<typeof parseTLB> {
  const key = tlb.trim()
  const cached = runtimeCache.get(key)
  if (cached) {
    return cached
  }
  const runtime = parseTLB(key)
  runtimeCache.set(key, runtime)
  return runtime
}

export function clearTlbRuntimeCache(): void {
  runtimeCache.clear()
}
