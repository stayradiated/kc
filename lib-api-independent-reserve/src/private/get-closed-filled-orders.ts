import type { Config } from '../util/types.js'
import { post } from '../util/client.js'

type GetClosedFilledOrdersOptions = {
  config: Config
  primaryCurrencyCode?: string // The primary currency of orders. This is an optional parameter.
  secondaryCurrencyCode?: string // The secondary currency of orders. This is an optional parameter.
  pageIndex: number // The page index. Must be greater or equal to 1
  pageSize: number // Must be greater or equal to 1 and less than or equal to 50. If a number greater than 50 is specified, then 50 will be used.
}

type GetClosedFilledOrdersResult = {
  PageSize: number
  TotalItems: number
  TotalPages: number
  Data: Array<{
    AvgPrice: number
    CreatedTimestampUtc: string
    FeePercent: number
    OrderGuid: string
    OrderType: string
    Outstanding: number
    Price: null
    PrimaryCurrencyCode: string
    SecondaryCurrencyCode: string
    Status:
      | 'Filled'
      | 'PartiallyFilledAndCancelled'
      | 'PartiallyFilledAndExpired'
    Value: number
    Volume: number
  }>
}

const getClosedFilledOrders = async (
  options: GetClosedFilledOrdersOptions,
): Promise<GetClosedFilledOrdersResult | Error> => {
  const {
    config,
    primaryCurrencyCode,
    secondaryCurrencyCode,
    pageIndex,
    pageSize,
  } = options
  return post(config, 'Private/GetClosedFilledOrders', {
    primaryCurrencyCode,
    secondaryCurrencyCode,
    pageIndex,
    pageSize,
  })
}

export { getClosedFilledOrders }