import { DateTime } from 'luxon'
import * as db from 'zapatos/db'
import { throwIfError } from '@stayradiated/error-boundary'

import { test } from '../../test-util/ava.js'

import { upsertOrder, UpsertOrderOptions } from './upsert-order.js'

test('upsertOrder', async (t) => {
  const { pool, make } = t.context
  const userUID = await make.user()
  const exchangeUID = await make.exchange()

  const original: UpsertOrderOptions = {
    userUID,
    exchangeUID,
    orderID: 'upsert-order',
    assetSymbol: 'BTC',
    priceNZD: 50_000,
    amount: 2,
    type: 'SELL',
    openedAt: DateTime.local(),
    closedAt: undefined,
  }

  const rowUID = await throwIfError<string>(upsertOrder(pool, original))
  t.is('string', typeof rowUID)

  {
    const row = await db.selectExactlyOne('order', { uid: rowUID }).run(pool)
    t.like(row, {
      order_id: original.orderID,
      uid: rowUID,
      type: original.type,
      price_nzd: original.priceNZD,
      amount: original.amount,
      asset_symbol: original.assetSymbol,
      user_uid: original.userUID,
      closed_at: null,
      exchange_uid: original.exchangeUID,
    })
    t.is(
      original.openedAt.valueOf(),
      DateTime.fromISO(row.opened_at).valueOf(),
      'original.opened_at',
    )
    t.is('string', typeof row.created_at)
    t.is('string', typeof row.updated_at)
  }

  const mutate: UpsertOrderOptions = {
    userUID,
    exchangeUID,
    orderID: 'upsert-order',

    assetSymbol: 'ETH',
    priceNZD: 20_000,
    amount: 55,
    type: 'BUY',
    openedAt: DateTime.local(),
    closedAt: DateTime.local(),
  }

  const mutateUID = await throwIfError<string>(upsertOrder(pool, mutate))
  t.is(rowUID, mutateUID)

  {
    const row = await db.selectExactlyOne('order', { uid: rowUID }).run(pool)
    t.like(row, {
      uid: rowUID,
      user_uid: original.userUID,
      exchange_uid: original.exchangeUID,

      order_id: original.orderID,
      type: mutate.type,
      price_nzd: mutate.priceNZD,
      amount: mutate.amount,
      asset_symbol: mutate.assetSymbol,
    })
    t.is(
      mutate.openedAt.valueOf(),
      DateTime.fromISO(row.opened_at).valueOf(),
      'mutate.opened_at',
    )
    t.is(
      mutate.closedAt!.valueOf(),
      DateTime.fromISO(row.closed_at!).valueOf(),
      'mutate.closed_at',
    )
  }
})
