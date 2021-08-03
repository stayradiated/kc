import { sort } from 'rambda'
import { DateTime } from 'luxon'

import { table, Row8 } from '../../utils/table.js'
import { RowData } from './types.js'

const sortByDateAsc = sort<RowData>(
  (a, b): number => a.date.valueOf() - b.date.valueOf(),
)

const calcTotals = (rows: readonly RowData[]): RowData => {
  const sum: RowData = {
    date: DateTime.fromSeconds(0),
    exchange: '-',
    symbol: '-',
    price: 0,
    nzd: 0,
    btc: 0,
    fee: 0,
    type: '-',
  }

  for (const row of rows) {
    if (row.type === 'BUY') {
      sum.nzd += row.nzd
      sum.btc += row.btc
      sum.fee += row.fee
    } else {
      sum.nzd -= row.nzd
      sum.btc -= row.btc
      sum.fee -= row.fee
    }
  }

  return {
    ...sum,
    price: sum.nzd / sum.btc,
    fee: sum.fee / rows.length,
  }
}

const formatRow = (row: RowData): Row8 => {
  const date =
    row.date.valueOf() === 0 ? '-' : row.date.toFormat('yyyy-LL-dd HH:mm:ss')
  const exchange = row.exchange
  const symbol = row.symbol
  const price = row.price.toFixed(2)
  const nzd = row.nzd.toFixed(2)
  const btc = row.btc.toFixed(8)
  const fee = row.fee.toFixed(2) + '%'
  const type = row.type

  return [date, exchange, symbol, price, nzd, btc, fee, type]
}

const drawTable = (unsortedRows: RowData[]): string => {
  const rowData = sortByDateAsc(unsortedRows)

  const header: Row8 = [
    'date',
    'exchange',
    'symbol',
    'price',
    'nzd',
    'btc',
    'fee',
    'type',
  ]
  const rows = rowData.map((row) => formatRow(row))
  const footer = formatRow(calcTotals(rowData))

  return table({ header, rows, footer })
}

export { drawTable }
