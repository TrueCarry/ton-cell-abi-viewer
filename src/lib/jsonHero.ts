import type { SerializableValue } from './serializable'

type JsonHeroResponse = {
  location?: string
}

const isJsonHeroResponse = (value: unknown): value is JsonHeroResponse =>
  typeof value === 'object' &&
  value !== null &&
  (!('location' in value) || typeof value.location === 'string')

export async function openInJsonHero(title: string, content: SerializableValue): Promise<void> {
  const response = await fetch('https://jsonhero.io/api/create.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      content,
      readOnly: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`JSONHero rejected the payload (${response.status})`)
  }

  const data: unknown = await response.json()
  if (isJsonHeroResponse(data) && data.location) {
    window.open(data.location, '_blank')
  }
}
