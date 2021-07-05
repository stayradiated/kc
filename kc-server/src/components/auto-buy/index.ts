import { setTimeout } from 'timers/promises'
import { inspect } from 'util'
import * as kiwiCoin from '@stayradiated/kiwi-coin-api'
import { DateTime } from 'luxon'
import * as db from 'zapatos/db'
import type * as s from 'zapatos/schema'

import { round } from '../../utils/round.js'
import { Market, BINANCE_US, getMarketUID } from '../markets/index.js'

import type { Component, Config, Pool } from '../../types.js'

const MINIMUM_BTC_BID = 0.000_01

const readMarketPrice = async (pool: Pool, market: Market): Promise<number> => {
  const marketUID = await getMarketUID(pool, market)

  const rows = await db.sql<s.market_price.SQL, s.market_price.Selectable[]>`
    SELECT ${'price_nzd'}
    FROM ${'market_price'} 
    WHERE ${{ market_uid: marketUID }}
    ORDER BY ${'timestamp'} DESC
    FETCH FIRST ROW ONLY
  `.run(pool)

  const row = rows[0] as { price_nzd: number }
  if (!row) {
    throw new Error(`Could not read market price for ${inspect(market)}`)
  }

  return row.price_nzd
}

type CalculateOrderAmountNZDOptions = {
  config: Config
  dailyGoal: number
}

const calculateOrderAmountNZD = async (
  options: CalculateOrderAmountNZDOptions,
): Promise<number> => {
  const { config, dailyGoal } = options

  const startDate = DateTime.fromISO('2021-06-15T00:00:00.000+12:00')

  const allTrades = await kiwiCoin.trades(config.kiwiCoin, 'all')
  const trades = allTrades.filter((trade) => {
    const tradeDate = DateTime.fromSeconds(trade.datetime)
    return tradeDate >= startDate
  })

  // eslint-disable-next-line unicorn/no-array-reduce
  const sum = trades.reduce((sum, trade) => {
    const nzd = trade.trade_size * trade.price
    return sum + nzd
  }, 0)

  const now = DateTime.local()
  const minutesSinceStartDate = now.diff(startDate).as('minutes')
  const goalPerMinute = dailyGoal / 24 / 60

  const orderAmountNZD =
    (goalPerMinute - sum / minutesSinceStartDate) * minutesSinceStartDate
  return orderAmountNZD
}

const fetchAvailableNZD = async (
  kiwiCoinConfig: kiwiCoin.Config,
): Promise<number> => {
  const balance = await kiwiCoin.balance(kiwiCoinConfig)
  const availableNZD = Number.parseFloat(balance.nzd_balance)
  return availableNZD
}

const initAutoBuy: Component = async (props) => {
  const { config, pool } = props

  const loop = async (): Promise<void> => {
    try {
      // Should really be done concurrently, but kiwi-coin.com often returns a 401?
      const availableNZD = await fetchAvailableNZD(config.kiwiCoin)
      const goalAmountNZD = await calculateOrderAmountNZD({
        config,
        dailyGoal: 100,
      })

      const amountNZD = Math.min(goalAmountNZD, availableNZD)

      if (amountNZD <= 0) {
        console.log('Have reached daily goal, passing...')
      } else {
        const [orderBook, existingOrders] = await Promise.all([
          kiwiCoin.orderBook(),
          kiwiCoin.openOrders(config.kiwiCoin),
        ])

        const marketPrice = await readMarketPrice(pool, BINANCE_US)

        const offsetPercent = (-1.5 + 100) / 100
        let orderPrice = round(2, marketPrice * offsetPercent)

        const lowestAsk = orderBook.asks[0]
        if (lowestAsk) {
          const lowestAskPrice = Number.parseFloat(lowestAsk[0])
          if (orderPrice > lowestAskPrice) {
            console.log('Lowering bid price to just below lowest ask price')
            orderPrice = lowestAskPrice - 0.01
          }
        }

        const amountBTC = round(8, amountNZD / orderPrice)
        if (amountBTC < MINIMUM_BTC_BID) {
          console.log(
            `Bid amount is below MINIMUM_BTC_BID: ${amountBTC}/${MINIMUM_BTC_BID}`,
          )
        } else {
          await Promise.all(
            existingOrders.map(async (order) => {
              return kiwiCoin.cancelOrder(config.kiwiCoin, order.id)
            }),
          )

          await kiwiCoin.buy(config.kiwiCoin, {
            price: orderPrice,
            amount: amountBTC,
          })

          console.dir({
            marketPrice,
            offsetPercent,
            orderPrice,
            amountNZD,
            amountBTC,
          })
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message)
        console.error(error.stack)
      } else {
        console.error('Unknown error...')
      }
    }

    await setTimeout(5 * 60 * 1000)
    return loop()
  }

  await loop()
}

export { initAutoBuy }