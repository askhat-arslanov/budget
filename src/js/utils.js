/**
 * Bunch of filters for filtering incomes and expenses
 */

const filterByMin = (items, val) => {
  if (val) return items.filter(item => item.value >= val)
  return items
}
const filterByMax = (items, val) => {
  if (val) return items.filter(item => item.value <= val)
  return items
}
const ordering = (items, val) => {
  if (val) {
    const orderFunctions = {
      desc: (a, b) => a.description.localeCompare(b.description),
      '-desc': (a, b) => b.description.localeCompare(a.description),
      value: (a, b) => a.value - b.value,
      '-value': (a, b) => b.value - a.value
    }
    items.sort(orderFunctions[val])
  }
  return items
}

/**
 * Prettify entered value
 */
function formatNumber(num, type) {
  // Get absolute value of "num" and round it to two decimal
  const number = Math.abs(num).toFixed(2)
  // Split to integer and decimal parts
  let [int, dec] = number.split('.')
  // Add prettify it
  const sign = type === 'expenses' ? '-' : '+'
  const intLen = int.length
  // Do this: 2700 -> 2 700 or 3400 -> 3 400
  if (intLen > 3) int = `${int.slice(0, intLen - 3)} ${int.slice(-3)}`
  // Add "+" or "-" depending on received "type" and put them together
  return `${sign} ${int}.${dec}`
}

export { filterByMax, filterByMin, ordering, formatNumber }
