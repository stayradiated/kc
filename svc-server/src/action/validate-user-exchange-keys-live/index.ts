import { MissingRequiredArgumentError } from '../../util/error.js'

import { ActionHandlerFn } from '../../util/action-handler.js'
import { getUserExchangeAPI } from '../../exchange-api/index.js'
import { getExchange } from '../../model/exchange/index.js'

type Input = {
  exchange_uid: string
  keys: Record<string, string>
}
type Output = {
  is_valid: boolean
  validation_message: string | null
}
const validateUserExchangeKeysLiveHandler: ActionHandlerFn<
  Input,
  Output
> = async (context) => {
  const { pool, input, session } = context
  const { exchange_uid: exchangeUID, keys } = input
  const { userUID } = session
  if (!userUID) {
    return new MissingRequiredArgumentError({
      message: 'userUID is required',
      context: { userUID },
    })
  }

  const exchange = await getExchange(pool, exchangeUID)
  if (exchange instanceof Error) {
    return exchange
  }

  const userExchangeAPI = await getUserExchangeAPI(exchange, keys)
  if (userExchangeAPI instanceof Error) {
    return userExchangeAPI
  }

  const balance = await userExchangeAPI.getBalance({ currency: 'NZD' })
  if (balance instanceof Error) {
    return {
      is_valid: false,
      validation_message: balance.message,
    }
  }

  return {
    is_valid: true,
    validation_message: null,
  }
}

export { validateUserExchangeKeysLiveHandler }