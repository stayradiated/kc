import test from 'ava'
import { throwIfErrorSync } from '@stayradiated/error-boundary'

import { getValidOrderTypes } from './get-valid-order-types.js'

test('should get valid order types', async (t) => {
  const [resultOrError] = await getValidOrderTypes()
  const result = throwIfErrorSync(resultOrError)

  t.deepEqual(result, ['LimitBid', 'LimitOffer', 'MarketBid', 'MarketOffer'])
})
