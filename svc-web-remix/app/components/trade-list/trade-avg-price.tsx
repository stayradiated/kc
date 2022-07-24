import { useMemo } from 'react'

import type { GetTradeAvgPriceQuery, } from '~/graphql/generated'

import { Chart, ChartConfig, formatDataForChart } from '../chart'

type Props = {
  primaryCurrency?: string
  query: GetTradeAvgPriceQuery
}

const TradeAvgPrice = (props: Props) => {
  const { primaryCurrency, query } = props

  const charts = useMemo((): ChartConfig[] => {
    const rows = query?.kc_trade_avg_price_by_window ?? []
    return [
      {
        type: 'area',
        options: {
          lineColor: 'rgba(125, 95, 255,1.0)',
          topColor: 'rgba(125, 95, 255,0.2)',
          bottomColor: 'rgba(125, 95, 255,0.2)',
        },
        data: formatDataForChart({
          interval: 'hour',
          data: rows,
          getValue: (row) => row.price!,
          getTime: (row) => row.timestamp!,
        }),
      },
      {
        type: 'area',
        options: {
          lineColor: 'rgba(255, 77, 77, 1.0)',
          topColor: 'rgba(255, 77, 77, 0.8)',
          bottomColor: 'rgba(255, 77, 77, 0.2)',
        },
        data: formatDataForChart({
          interval: 'hour',
          data: rows,
          getValue: (row) => row.avg_price!,
          getTime: (row) => row.timestamp!,
        }),
      },
    ]
  }, [query])

  return (
    <>
      <h2>{primaryCurrency}-NZD</h2>
      <Chart width={1160} charts={charts} />
    </>
  )
}

export { TradeAvgPrice }
