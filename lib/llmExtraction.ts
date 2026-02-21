/**
 * Enhanced LLM Extraction Utilities
 * Provides multiple strategies for extracting structured data from web content
 */

export interface ExtractionResult {
  summary: string
  whatTheyDo: string[]
  keywords: string[]
  signals: string[]
  extractionMethod: 'primary' | 'fallback' | 'mock'
}

interface LLMResponse {
  summary?: string
  whatTheyDo?: string[] | string
  what_they_do?: string[] | string
  keywords?: string[]
  signals?: string[]
  [key: string]: any
}

/**
 * Primary extraction prompt - detailed and structured
 */
export function getPrimaryExtractionPrompt(content: string): string {
  return `You are a professional business analyst. Extract company information from this web content.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no code blocks
2. Be factual and specific - extract what you actually see in the content
3. If information is not clearly present, provide reasonable inference based on context

Web Content:
${content}

Return a JSON object with exactly these fields:
{
  "summary": "1-2 sentence professional summary of what this company is and does",
  "whatTheyDo": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "signals": ["observable signal 1", "observable signal 2", "observable signal 3"]
}

FIELD GUIDELINES:
- summary: Clear, professional, factual description
- whatTheyDo: Specific services/products they provide (verb + noun format)
- keywords: Core business terms, technologies, and industry focus
- signals: Indicators of activity (hiring, funding rounds, product updates, etc.)`
}

/**
 * Fallback extraction prompt - simpler, more forgiving
 */
export function getFallbackExtractionPrompt(content: string): string {
  return `Extract company information from this content and return valid JSON only:

Content:
${content}

Return valid JSON with these fields (any empty arrays are OK):
{
  "summary": "What is this company?",
  "whatTheyDo": ["thing1", "thing2"],
  "keywords": ["tech1", "tech2"],
  "signals": ["sign1"]
}`
}

/**
 * Call OpenAI API with structured extraction
 */
export async function callLLMExtraction(
  content: string,
  apiKey: string,
  model: string = 'gpt-4o-mini'
): Promise<LLMResponse> {
  const prompt = getPrimaryExtractionPrompt(content)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API error (${response.status}): ${error}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid LLM response structure')
  }

  const parsed = JSON.parse(data.choices[0].message.content)
  return parsed
}

/**
 * Normalize and validate LLM response
 */
export function normalizeExtractionResult(
  llmResponse: LLMResponse
): Omit<ExtractionResult, 'extractionMethod'> {
  // Normalize whatTheyDo (could be string or array)
  let whatTheyDo: string[] = []
  if (Array.isArray(llmResponse.whatTheyDo)) {
    whatTheyDo = llmResponse.whatTheyDo
  } else if (typeof llmResponse.whatTheyDo === 'string') {
    whatTheyDo = [llmResponse.whatTheyDo]
  } else if (Array.isArray(llmResponse.what_they_do)) {
    whatTheyDo = llmResponse.what_they_do
  }

  return {
    summary: normalizeSummary(llmResponse.summary),
    whatTheyDo: normalizeStringArray(whatTheyDo, 'Comprehensive business solutions'),
    keywords: normalizeStringArray(llmResponse.keywords, 'technology,innovation'),
    signals: normalizeStringArray(llmResponse.signals, 'Active operations'),
  }
}

/**
 * Normalize summary string
 */
function normalizeSummary(summary: any): string {
  if (typeof summary === 'string' && summary.trim().length > 0) {
    return summary.trim().substring(0, 500)
  }
  return 'Company information extracted from website.'
}

/**
 * Normalize string array
 */
function normalizeStringArray(arr: any, fallback: string): string[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    return fallback.split(',').map(s => s.trim())
  }

  return arr
    .map(item => {
      if (typeof item === 'string') {
        return item.trim()
      } else if (typeof item === 'object' && item !== null) {
        // Handle case where array contains objects
        return Object.values(item)
          .filter(v => typeof v === 'string')
          .join(' ')
          .trim()
      }
      return ''
    })
    .filter(item => item.length > 0)
    .slice(0, 15) // Limit to 15 items
}

/**
 * Generate mock extraction result
 */
export function generateMockExtractionResult(companyUrl: string): Omit<ExtractionResult, 'extractionMethod'> {
  const domain = new URL(companyUrl).hostname.replace('www.', '')

  return {
    summary: `A forward-thinking company focused on innovation, growth, and delivering value through technology and customer-centric solutions.`,
    whatTheyDo: [
      'Develop cutting-edge software and digital solutions',
      'Provide enterprise services and infrastructure',
      'Drive innovation and continuous improvement',
      'Focus on scalability and customer success',
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
    ],
    signals: [
      'Active careers and hiring initiatives',
      'Recent product updates and releases',
      'Strong technical and engineering focus',
      'Transparent and engaged community',
    ],
  }
}

/**
 * Main extraction function with retry and fallback logic
 */
export async function extractCompanyInfo(
  content: string,
  apiKey: string,
  companyUrl: string
): Promise<ExtractionResult> {
  try {
    // Try primary extraction
    const primaryResult = await callLLMExtraction(content, apiKey)
    const normalized = normalizeExtractionResult(primaryResult)

    return {
      ...normalized,
      extractionMethod: 'primary',
    }
  } catch (primaryError) {
    console.warn('[v0] Primary extraction failed, trying fallback:', primaryError)

    try {
      // Try fallback extraction with simpler prompt
      const fallbackPrompt = getFallbackExtractionPrompt(content)
      const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: fallbackPrompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        const fallbackResult = JSON.parse(fallbackData.choices[0].message.content)
        const normalized = normalizeExtractionResult(fallbackResult)

        return {
          ...normalized,
          extractionMethod: 'fallback',
        }
      }
    } catch (fallbackError) {
      console.warn('[v0] Fallback extraction also failed:', fallbackError)
    }

    // Fall back to mock data
    console.warn('[v0] Using mock data for extraction')
    return {
      ...generateMockExtractionResult(companyUrl),
      extractionMethod: 'mock',
    }
  }
}
