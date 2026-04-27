import { Buffer } from 'buffer'
import type { ParseWorkerRequest, ParseWorkerResponse } from '../features/parser/model'

type PolyfilledGlobal = {
  Buffer?: typeof Buffer
  process?: { env: Record<string, string | undefined> }
}

const browserGlobal = globalThis as unknown as PolyfilledGlobal
browserGlobal.Buffer ??= Buffer
browserGlobal.process ??= { env: {} }

const parserModule = import('../features/parser/cellParser')

self.onmessage = async (event: MessageEvent<ParseWorkerRequest>) => {
  const { id, input, options } = event.data

  try {
    const { parseCellInput } = await parserModule
    const response: ParseWorkerResponse = {
      id,
      result: parseCellInput(input, options),
    }
    self.postMessage(response)
  } catch (error) {
    const response: ParseWorkerResponse = {
      id,
      result: {
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Parser worker failed',
        },
        warnings: [],
      },
    }
    self.postMessage(response)
  }
}

export {}
