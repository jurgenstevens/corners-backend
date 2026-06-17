import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function parseCatalogPDF(pdfBuffer) {
  const base64String = pdfBuffer.toString('base64')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: 'You are a data extraction assistant. Extract product catalog information from distributor price sheets and return structured JSON.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64String },
          },
          {
            type: 'text',
            text: `Extract all products from this distributor catalog PDF. Return a JSON array of objects with these fields:
- name (string, required): product name
- brand (string): brand name if distinct from product name
- category (string): one of Beverages, Snacks, Dairy, Bakery, Meat, Produce, Frozen, Dry Goods, Tobacco, Alcohol, Other
- description (string): any description or notes
- unitSize (string): package size, case count, weight, etc.
- pricePerCase (number): price as a number, no currency symbols
- minOrderQty (number): minimum order quantity if specified, default 1

Return ONLY valid JSON array, no markdown, no explanation.
Omit fields not found. Skip items without at least a name and pricePerCase.`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].text
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Could not parse catalog from PDF')
  }
}
