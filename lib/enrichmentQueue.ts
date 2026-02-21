/**
 * Enrichment Request Queue
 * Manages queuing of enrichment requests to prevent duplicate simultaneous processing
 */

export interface EnrichmentRequest {
  url: string
  companyId?: string
  timestamp: number
  attempt: number
}

type QueueCallback = (request: EnrichmentRequest) => Promise<any>

declare global {
  // eslint-disable-next-line no-var
  var __vc_enrichment_queue: Map<string, EnrichmentRequest> | undefined
  // eslint-disable-next-line no-var
  var __vc_enrichment_processing: Set<string> | undefined
}

const QUEUE_TIMEOUT_MS = 30000 // 30 seconds
const MAX_ATTEMPTS = 3

/**
 * Add a request to the enrichment queue
 * Returns a unique request ID for tracking
 */
export function enqueueEnrichment(url: string, companyId?: string): string {
  const queue = (globalThis.__vc_enrichment_queue ??= new Map())
  const requestId = `${companyId || 'unknown'}::${url}::${Date.now()}`

  const request: EnrichmentRequest = {
    url,
    companyId,
    timestamp: Date.now(),
    attempt: 0,
  }

  queue.set(requestId, request)
  console.log(`[v0] Enrichment queued: ${requestId}`)

  return requestId
}

/**
 * Check if a URL is already being processed
 * Prevents duplicate simultaneous requests
 */
export function isEnrichmentProcessing(url: string, companyId?: string): boolean {
  const processing = globalThis.__vc_enrichment_processing ?? new Set()
  const key = `${companyId || 'unknown'}::${url}`
  return processing.has(key)
}

/**
 * Mark an enrichment request as processing
 */
export function markEnrichmentProcessing(url: string, companyId?: string): boolean {
  const processing = (globalThis.__vc_enrichment_processing ??= new Set())
  const key = `${companyId || 'unknown'}::${url}`

  if (processing.has(key)) {
    console.log(`[v0] Already processing: ${key}`)
    return false
  }

  processing.add(key)
  console.log(`[v0] Started processing: ${key}`)
  return true
}

/**
 * Mark an enrichment request as done processing
 */
export function unmarkEnrichmentProcessing(url: string, companyId?: string): void {
  const processing = globalThis.__vc_enrichment_processing ?? new Set()
  const key = `${companyId || 'unknown'}::${url}`
  processing.delete(key)
  console.log(`[v0] Finished processing: ${key}`)
}

/**
 * Process the queue
 * Executes callbacks for queued requests
 */
export async function processEnrichmentQueue(callback: QueueCallback): Promise<void> {
  const queue = globalThis.__vc_enrichment_queue ?? new Map()

  if (queue.size === 0) {
    return
  }

  console.log(`[v0] Processing enrichment queue with ${queue.size} items`)

  for (const [requestId, request] of queue.entries()) {
    // Check timeout
    if (Date.now() - request.timestamp > QUEUE_TIMEOUT_MS) {
      console.warn(`[v0] Enrichment request timeout: ${requestId}`)
      queue.delete(requestId)
      continue
    }

    // Check attempts
    if (request.attempt >= MAX_ATTEMPTS) {
      console.warn(`[v0] Enrichment request max attempts reached: ${requestId}`)
      queue.delete(requestId)
      continue
    }

    // Check if already processing
    if (isEnrichmentProcessing(request.url, request.companyId)) {
      console.log(`[v0] Skipping already processing request: ${requestId}`)
      continue
    }

    try {
      request.attempt += 1
      const processing = markEnrichmentProcessing(
        request.url,
        request.companyId
      )

      if (!processing) {
        continue
      }

      await callback(request)
      queue.delete(requestId)
      unmarkEnrichmentProcessing(request.url, request.companyId)
    } catch (error) {
      console.error(`[v0] Error processing enrichment request: ${requestId}`, error)
      unmarkEnrichmentProcessing(request.url, request.companyId)

      if (request.attempt < MAX_ATTEMPTS) {
        console.log(`[v0] Retrying enrichment request: ${requestId} (attempt ${request.attempt})`)
      } else {
        queue.delete(requestId)
      }
    }
  }
}

/**
 * Get queue status for monitoring
 */
export function getQueueStatus() {
  const queue = globalThis.__vc_enrichment_queue ?? new Map()
  const processing = globalThis.__vc_enrichment_processing ?? new Set()

  return {
    queuedRequests: queue.size,
    processingRequests: processing.size,
    items: Array.from(queue.entries()).map(([id, req]) => ({
      id,
      url: req.url,
      companyId: req.companyId,
      age: Date.now() - req.timestamp,
      attempt: req.attempt,
    })),
  }
}

/**
 * Clear the entire queue (admin use)
 */
export function clearEnrichmentQueue(): void {
  globalThis.__vc_enrichment_queue = new Map()
  globalThis.__vc_enrichment_processing = new Set()
  console.log('[v0] Enrichment queue cleared')
}
