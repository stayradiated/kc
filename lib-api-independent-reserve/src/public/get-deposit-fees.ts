import type { Kanye } from '@volatile/kanye'

import { get, getResponseBody } from '../util/client.js'

// Deposit fee for the currency. Denominated in the deposit currency.
type GetDepositFeesResult = Array<{
  // The method of deposit
  DepositType: string
  // An amount below this threshold will incur a deposit fee. When null, the fee is always applied.
  FreeThreshold: number
  // Deposit fee which will be deducted from deposit amount when under threshold. Denominated in the deposit currency.
  Fee: {
    // Fixed fee amount
    Fixed: number
    // Percentage fee
    Percentage: number
  }
}>

const getDepositFees = async (): Promise<
  [GetDepositFeesResult | Error, Kanye?]
> => {
  const raw = await get('Public/GetDepositFees')
  if (raw instanceof Error) {
    return [raw, undefined]
  }

  const result = getResponseBody<GetDepositFeesResult>(raw)
  return [result, raw]
}

export { getDepositFees }
export type { GetDepositFeesResult }
