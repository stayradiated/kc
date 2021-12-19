import { errorListBoundary } from '@stayradiated/error-boundary'
import { DateTime } from 'luxon'

import type { Pool } from '../../types.js'
import type { UserExchangeAPI } from '../../exchange-api/index.js'

import { updateOrder, selectOpenOrdersForDCA } from '../../model/order/index.js'
// Import { waitForBalanceToChange } from './wait-for-balance-to-change.js'

import { mapSeries } from '../../util/map.js'

type CancelPreviousOrdersOptions = {
  dcaOrderUID: string
  userExchangeAPI: UserExchangeAPI
}

const cancelPreviousOrders = async (
  pool: Pool,
  options: CancelPreviousOrdersOptions,
): Promise<void | Error> => {
  const { dcaOrderUID, userExchangeAPI } = options

  // Const initialBalance = await userExchangeAPI.getBalance({ currency: 'NZD' })
  // if (initialBalance instanceof Error) {
  //   return initialBalance
  // }

  const previousOrders = await selectOpenOrdersForDCA(pool, {
    dcaOrderUID,
  })
  if (previousOrders instanceof Error) {
    return previousOrders
  }

  const cancelOrderError = await errorListBoundary(async () =>
    mapSeries(previousOrders, async (order): Promise<void | Error> => {
      const cancelOrderError = await userExchangeAPI.cancelOrder({
        orderID: order.orderID,
      })
      if (cancelOrderError instanceof Error) {
        return cancelOrderError
      }

      const updateOrderError = await updateOrder(pool, {
        UID: order.UID,
        closedAt: DateTime.local(),
      })
      if (updateOrderError instanceof Error) {
        return updateOrderError
      }

      return undefined
    }),
  )

  if (cancelOrderError instanceof Error) {
    return cancelOrderError
  }

  return undefined
}

export { cancelPreviousOrders }