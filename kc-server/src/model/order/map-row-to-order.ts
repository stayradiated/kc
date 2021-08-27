import { DateTime } from 'luxon'
import type * as s from 'zapatos/schema'

import type { BuySell } from '../../types.js'
import type { Order } from './types.js'

const mapToDateTime = (input: string | Date | DateTime): DateTime => {
  if (typeof input === 'string') {
    return DateTime.fromISO(input)
  }

  if (input instanceof Date) {
    return DateTime.fromJSDate(input)
  }

  return input
}

const mapRowToOrder = (
  row: s.order.Selectable | s.order.JSONSelectable,
): Order => ({
  UID: row.uid,
  userUID: row.user_uid,
  exchangeUID: row.exchange_uid,
  orderID: row.order_id,
  assetSymbol: row.asset_symbol,
  priceNZD: row.price_nzd,
  amount: row.amount,
  type: row.type as BuySell,
  openedAt: mapToDateTime(row.opened_at),
  closedAt: row.closed_at ? mapToDateTime(row.closed_at) : undefined,
})

export { mapRowToOrder }
