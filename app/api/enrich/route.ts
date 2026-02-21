import { NextRequest, NextResponse } from 'next/server'

type EnrichResponse = {
  summary: string
  whatTheyDo: string[]
  keywords: string[]
  signals: string[]
  sources: { url: string; timestamp: string }[]
  enrichedAt: string
  cached?: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var __vc_enrich_cache: Map<string, { data: EnrichResponse; cachedAt: number }> | undefined
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Utility: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

// Utility: Validate and parse JSON with error handling
function parseJSON(content: string): any {
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('[v0] JSON parse error:', error)
    // Try to extract JSON from the content if parsing fails
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        throw new Error('Failed to parse LLM response as JSON')
      }
    }
    throw error
  }
}

// Utility: Validate extracted data structure
function validateEnrichmentData(data: any): {
  summary: string
  whatTheyDo: string[]
  keywords: string[]
  signals: string[]
} {
  if (!data) {
    throw new Error('No data to validate')
  }

  return {
    summary: String(data.summary || 'Company information extracted from website.').substring(0, 500),
    whatTheyDo: Array.isArray(data.whatTheyDo)
      ? data.whatTheyDo.map((item: any) => String(item)).filter(Boolean).slice(0, 10)
      : [],
    keywords: Array.isArray(data.keywords)
      ? data.keywords.map((item: any) => String(item)).filter(Boolean).slice(0, 15)
      : [],
    signals: Array.isArray(data.signals)
      ? data.signals.map((item: any) => String(item)).filter(Boolean).slice(0, 10)
      : [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, companyId, force } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Ensure it's a public HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP/HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    const cacheKey = `${companyId || ''}::${targetUrl.toString()}`
    const cache = (globalThis.__vc_enrich_cache ??= new Map())
    const cached = cache.get(cacheKey)

    // Return cached data if available and not forced
    if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({ ...cached.data, cached: true })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    // Fallback to mock data if API key is not set
    if (!OPENAI_API_KEY) {
      const mockData: EnrichResponse = {
        summary:
          'A forward-thinking technology company focused on innovation, growth, and delivering value to customers worldwide.',
        whatTheyDo: [
          'Develop cutting-edge software solutions and digital platforms',
          'Provide enterprise-grade services and infrastructure',
          'Focus on customer success, innovation, and scalability',
          'Maintain active product development and continuous improvement',
        ],
        keywords: [
          'technology',
          'innovation',
          'enterprise',
          'software',
          'solutions',
          'growth',
          'scalability',
          'digital',
          'platform',
          'services',
        ],
        signals: [
          'Active careers page with open positions',
          'Recent blog posts and technical content',
          'Product changelog showing active development',
          'Strong engineering focus and transparency',
        ],
        sources: [
          {
            url: targetUrl.toString(),
            timestamp: new Date().toISOString(),
          },
        ],
        enrichedAt: new Date().toISOString(),
        cached: false,
      }
      cache.set(cacheKey, { data: mockData, cachedAt: Date.now() })
      return NextResponse.json(mockData)
    }

    // Fetch and enrich with actual data
    const enrichedData = await retryWithBackoff(async () => {
      // Fetch the webpage with retry
      const html = await retryWithBackoff(
        () =>
          fetch(targetUrl.toString(), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; VentureFlow VC Intelligence)',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }).then(async response => {
            if (!response.ok) {
              throw new Error(
                `Failed to fetch URL: ${response.status} ${response.statusText}`
              )
            }
            return response.text()
          }),
        2 // 2 retries for fetch
      )

      // Extract text content with improved HTML parsing
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000) // Limit content length

      if (!textContent || textContent.length < 50) {
        throw new Error('Insufficient content extracted from webpage')
      }

      // Use OpenAI to extract structured data
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional business intelligence analyst. Extract company information from web content and return structured JSON data. Be precise, factual, and concise.`,
            },
            {
              role: 'user',
              content: `Extract company information from this webpage content and return valid JSON:\n\n${textContent}\n\nReturn ONLY a JSON object (no markdown, no extra text) with these fields:
{
  "summary": "1-2 sentence summary of what this company is",
  "whatTheyDo": ["action 1", "action 2", "action 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "signals": ["signal1", "signal2", "signal3"]
}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1000,
        }),
      })

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.text()
        console.error('[v0] OpenAI API error response:', errorData)
        throw new Error(`OpenAI API error: ${openaiResponse.status}`)
      }

      const openaiData = await openaiResponse.json()

      if (!openaiData.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure')
      }

      const extracted = parseJSON(openaiData.choices[0].message.content)
      const validated = validateEnrichmentData(extracted)

      // Check for additional pages (about, careers, blog, changelog)
      const baseUrl = new URL(targetUrl.toString())
      const additionalPages = [
        `${baseUrl.origin}/about`,
        `${baseUrl.origin}/careers`,
        `${baseUrl.origin}/blog`,
        `${baseUrl.origin}/changelog`,
      ]

      const sources = [
        {
          url: targetUrl.toString(),
          timestamp: new Date().toISOString(),
        },
      ]

      // Try to fetch additional pages (non-blocking, with timeout)
      await Promise.allSettled(
        additionalPages.map(pageUrl =>
          fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; VentureFlow VC Intelligence)',
            },
            signal: AbortSignal.timeout(3000),
          })
            .then(response => {
              if (response.ok) {
                sources.push({
                  url: pageUrl,
                  timestamp: new Date().toISOString(),
                })
              }
            })
            .catch(() => {
              // Silently ignore failures
            })
        )
      )

      return {
        ...validated,
        sources,
        enrichedAt: new Date().toISOString(),
        cached: false,
      } as EnrichResponse
    }, MAX_RETRIES)

    cache.set(cacheKey, { data: enrichedData, cachedAt: Date.now() })
    return NextResponse.json(enrichedData)
  } catch (error: any) {
    console.error('[v0] Enrichment error:', error)

    // Determine appropriate status code
    const statusCode = error.message?.includes('Invalid URL')
      ? 400
      : error.message?.includes('Failed to fetch')
      ? 503
      : 500

    return NextResponse.json(
      {
        error: error.message || 'Failed to enrich company data',
        suggestion:
          error.message?.includes('fetch') || error.message?.includes('timeout')
            ? 'Check if the website is accessible and try again'
            : 'Please check your input and try again',
      },
      { status: statusCode }
    )
  }
}
