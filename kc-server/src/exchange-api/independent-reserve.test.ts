import anyTest, { TestInterface } from 'ava'
import { throwIfError } from '@stayradiated/error-boundary'
import nock from 'nock'
import { DateTime } from 'luxon'

import { getIndependentReserveExchangeAPI } from './independent-reserve.js'
import type { UserExchangeAPI } from './types.js'

nock.disableNetConnect()

const test = anyTest as TestInterface<{
  api: UserExchangeAPI
}>

test.beforeEach((t) => {
  t.context.api = throwIfError(
    getIndependentReserveExchangeAPI({
      apiKey: 'API_KEY',
      apiSecret: 'API_SECRET',
    }),
  )
})

test('getLowestAskPrice', async (t) => {
  const { api } = t.context

  nock('https://api.independentreserve.com')
    .get('/Public/GetOrderBook')
    .query(() => true)
    .reply(200, {
      BuyOrders: [
        {
          OrderType: 'LimitBid',
          Price: 497.02,
          Volume: 0.01,
        },
        {
          OrderType: 'LimitBid',
          Price: 490,
          Volume: 1,
        },
      ],
      SellOrders: [
        {
          OrderType: 'LimitOffer',
          Price: 500,
          Volume: 1,
        },
        {
          OrderType: 'LimitOffer',
          Price: 505,
          Volume: 1,
        },
      ],
      CreatedTimestampUtc: '2014-08-05T06:42:11.3032208Z',
      PrimaryCurrencyCode: 'Xbt',
      SecondaryCurrencyCode: 'Usd',
    })

  const lowestAskPrice = await throwIfError(
    api.getLowestAskPrice({
      primaryCurrency: 'BTC',
      secondaryCurrency: 'USD',
    }),
  )

  t.deepEqual(lowestAskPrice, 500)
})

test('getOpenOrders', async (t) => {
  const { api } = t.context

  nock('https://api.independentreserve.com')
    .post('/Private/GetOpenOrders', () => true)
    .reply(200, {
      PageSize: 25,
      TotalItems: 2,
      TotalPages: 1,
      Data: [
        {
          AvgPrice: 466.36,
          CreatedTimestampUtc: '2014-05-05T09:35:22.4032405Z',
          FeePercent: 0.005,
          OrderGuid: 'dd015a29-8f73-4469-a5fa-ea91544dfcda',
          OrderType: 'LimitOffer',
          Outstanding: 21.456_21,
          Price: 466.36,
          PrimaryCurrencyCode: 'Xbt',
          SecondaryCurrencyCode: 'Usd',
          Status: 'Open',
          Value: 10_006.318_095_6,
          Volume: 21.456_21,
        },
        {
          AvgPrice: 455.48,
          CreatedTimestampUtc: '2014-05-05T09:35:22.4032405Z',
          FeePercent: 0.005,
          OrderGuid: '58f9da9d-a12e-4362-afa8-f5c252ba1725',
          OrderType: 'LimitBid',
          Outstanding: 1.345,
          Price: 455.48,
          PrimaryCurrencyCode: 'Xbt',
          SecondaryCurrencyCode: 'Usd',
          Status: 'Open',
          Value: 612.6206,
          Volume: 1.345,
        },
      ],
    })

  const openOrders = await throwIfError(api.getOpenOrders())

  t.deepEqual(openOrders, [
    {
      orderID: 'dd015a29-8f73-4469-a5fa-ea91544dfcda',
      primaryCurrency: 'BTC',
      secondaryCurrency: 'USD',
      price: 466.36,
      volume: 21.456_21,
      type: 'BUY',
      openedAt: DateTime.fromISO('2014-05-05T09:35:22.4032405Z'),
    },
    {
      orderID: '58f9da9d-a12e-4362-afa8-f5c252ba1725',
      primaryCurrency: 'BTC',
      secondaryCurrency: 'USD',
      price: 455.48,
      volume: 1.345,
      type: 'SELL',
      openedAt: DateTime.fromISO('2014-05-05T09:35:22.4032405Z'),
    },
  ])
})

test('getTrades', async (t) => {
  const { api } = t.context

  nock('https://api.independentreserve.com')
    .post('/Private/GetTrades', () => true)
    .reply(200, {
      Data: [
        {
          TradeGuid: '593e609d-041a-4f46-a41d-2cb8e908973f',
          TradeTimestampUtc: '2014-12-16T03:44:19.2187707Z',
          OrderGuid: '8bf851a3-76d2-439c-945a-93367541d467',
          OrderType: 'LimitBid',
          OrderTimestampUtc: '2014-12-16T03:43:36.7423769Z',
          VolumeTraded: 0.5,
          Price: 410,
          PrimaryCurrencyCode: 'Xbt',
          SecondaryCurrencyCode: 'Usd',
        },
        {
          TradeGuid: '13c1e71c-bfb4-452c-b13e-e03535f98b09',
          TradeTimestampUtc: '2014-12-11T11:37:42.2089564Z',
          OrderGuid: '1ce88acf-6013-4867-b58d-77f0e41ec475',
          OrderType: 'LimitBid',
          OrderTimestampUtc: '2014-12-11T11:37:42.0724391Z',
          VolumeTraded: 0.4,
          Price: 399,
          PrimaryCurrencyCode: 'Xbt',
          SecondaryCurrencyCode: 'Usd',
        },
      ],
      PageSize: 10,
      TotalItems: 2,
      TotalPages: 1,
    })

  const trades = await throwIfError(
    api.getTrades({
      pageIndex: 1,
      pageSize: 10,
    }),
  )

  t.deepEqual(trades, {
    total: 2,
    hasNextPage: false,
    items: [
      {
        tradeID: '593e609d-041a-4f46-a41d-2cb8e908973f',
        orderID: '8bf851a3-76d2-439c-945a-93367541d467',
        timestamp: DateTime.fromISO('2014-12-16T03:44:19.2187707Z'),
        primaryCurrency: 'BTC',
        secondaryCurrency: 'USD',
        price: 410,
        volume: 0.5,
        fee: 1.025,
        type: 'BUY',
      },
      {
        tradeID: '13c1e71c-bfb4-452c-b13e-e03535f98b09',
        orderID: '1ce88acf-6013-4867-b58d-77f0e41ec475',
        timestamp: DateTime.fromISO('2014-12-11T11:37:42.2089564Z'),
        primaryCurrency: 'BTC',
        secondaryCurrency: 'USD',
        price: 399,
        volume: 0.4,
        fee: 0.798,
        type: 'BUY',
      },
    ],
  })
})
