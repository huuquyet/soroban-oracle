import { type SorobanRpc, xdr } from '@stellar/stellar-sdk'
import { useEffect } from 'react'

interface GeneratedLibrary {
  Server: SorobanRpc.Server
  CONTRACT_ID_HEX: string
}

interface GetEventsWithLatestLedger extends SorobanRpc.Api.GetEventsResponse {
  latestLedger: number
  events: SorobanRpc.Api.EventResponse[]
}

type PagingKey = string

const paging: Record<PagingKey, { lastLedgerStart?: number; pagingToken?: string }> = {}

export function useSubscription(
  library: GeneratedLibrary,
  topic: string,
  onEvent: (event: SorobanRpc.Api.EventResponse) => void,
  pollInterval = 5000
) {
  const id = `${library.CONTRACT_ID_HEX}:${topic}`
  paging[id] = paging[id] || {}

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let stop = false

    async function pollEvents(): Promise<void> {
      try {
        if (!paging[id].lastLedgerStart) {
          const latestLedgerState = await library.Server.getLatestLedger()
          paging[id].lastLedgerStart = latestLedgerState.sequence
        }

        const response = (await library.Server.getEvents({
          startLedger: !paging[id].pagingToken ? paging[id].lastLedgerStart : undefined,
          cursor: paging[id].pagingToken,
          filters: [
            {
              contractIds: [library.CONTRACT_ID_HEX],
              topics: [[xdr.ScVal.scvSymbol(topic).toXDR('base64')]],
              type: 'contract',
            },
          ],
          limit: 10,
        })) as GetEventsWithLatestLedger

        paging[id].pagingToken = undefined
        if (response.latestLedger) {
          paging[id].lastLedgerStart = response.latestLedger
        }
        response.events?.forEach((event) => {
          try {
            onEvent(event)
          } catch (error) {
            console.error('Poll Events: subscription callback had error: ', error)
          } finally {
            paging[id].pagingToken = event.pagingToken
          }
        })
      } catch (error) {
        console.error('Poll Events: error: ', error)
      } finally {
        if (!stop) {
          timeoutId = setTimeout(pollEvents, pollInterval)
        }
      }
    }

    pollEvents()

    return () => {
      // @ts-ignore
      if (timeoutId != null) clearTimeout(timeoutId)
      stop = true
    }
  }, [library, topic, onEvent, id, pollInterval])
}
