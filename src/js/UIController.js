import { formatNumber } from './utils'

export default class UIController {
  constructor() {
    this.DOM = DOM
    // This global declarations are needed for further destroy already
    // rendered canvas to avoid flicker between old and new charts
    this.monthChart = undefined
    this.expChart = undefined
  }
  /**
   * Clear inputs and shift cursor to the description input
   */
  clearFieldsAndShiftFocus() {
    this.DOM.inputDescription.value = ''
    this.DOM.inputValue.value = ''
    this.DOM.inputDescription.focus()
  }
  /**
   * Clear filter inputs
   */
  clearFilterInputs(type) {
    this.DOM[type].querySelector('.min').value = ''
    this.DOM[type].querySelector('.max').value = ''
    this.DOM[type].querySelector('.order').value = ''
  }
  /**
   * Remove item from UI
   */
  deleteItemFromUI(ID) {
    document.querySelector('#' + ID).remove()
  }
  /**
   * Fill UI following data: available budget,
   * total value of incomes and expenses and total persentage
   */
  fillBudgetAndPerc({ totalExpense = 0, totalIncome = 0 }) {
    const budget = totalIncome - totalExpense
    // Check that totalIncomes is greater than zero for count percentage
    const totalPercentage =
      totalIncome > 0
        ? Math.round((totalExpense / totalIncome) * 100) + '%'
        : '---'
    // Check if budget is greater or lesser than zero to pretty format
    const budgetType = budget < 0 ? 'expenses' : null
    // Insert to UI
    this.DOM.budgetLabel.innerText = formatNumber(budget, budgetType)
    this.DOM.incomeLabel.innerText = formatNumber(totalIncome, 'incomes')
    this.DOM.expensesLabel.innerText = formatNumber(totalExpense, 'expenses')
    this.DOM.percentageLabel.innerText = totalPercentage
  }
  /*
   * Fill div-container with incomes/expenses passed list of items
   */
  fillItemList(type, itemList) {
    // Choose right container  for item
    const container = this.chooseContainer(type)
    // And insert prepared template to UI
    container.innerHTML = itemList.map(item => getTemplate(item)).join('')
  }
  /**
   * Add single item to existing list
   */
  addItemToList(item) {
    // Choose right container  for item
    const container = this.chooseContainer(item.type)
    // And insert prepared template at the beginning of list
    container.insertAdjacentHTML('afterbegin', getTemplate(item))
  }
  chooseContainer(type) {
    return type === 'expenses' ? this.DOM.expensesList : this.DOM.incomesList
  }
  /**
   * Returns authentication user data
   */
  getLoginData() {
    const email = this.DOM.inputEmail.value.trim()
    const password = this.DOM.inputPassword.value.trim()
    return { email, password }
  }
  /**
   * Returns registration user data
   */
  getRegisterData() {
    const email = this.DOM.inputRegEmail.value.trim()
    const password1 = this.DOM.inputRegPass1.value.trim()
    const password2 = this.DOM.inputRegPass2.value.trim()
    return { email, password1, password2 }
  }
  /**
   * Returns date from UI (on top)
   */
  dateFromUI() {
    const month = this.DOM.monthLabel.value
    const year = this.DOM.yearLabel.value
    return { month, year }
  }
  /**
   * Returns date from Flatpickr (for new item)
   */
  dateFromFlatpickr() {
    const date = this.DOM.inputDate.value
    // Flatpickr date format setted to "m d Y"
    const [month, day, year] = date.split(' ')
    return { month, day, year }
  }
  /**
   * Returns new item data from inputs
   */
  getNewItemData() {
    const type = this.DOM.inputType.value
    const description = this.DOM.inputDescription.value.trim()
    const value = +this.DOM.inputValue.value.trim()
    const expenseType = this.DOM.inputExpenseType.value
    const { month, day, year } = this.dateFromFlatpickr()
    const item = { type, description, value, month, day, year }
    if (type === 'expenses') return { ...item, expenseType }
    return item
  }
  /**
   * Block/unblock inputs
   */
  toggleBlockInputs(value) {
    const elements = [
      // this.DOM.filterIncomeBtn,
      // this.DOM.filterExpenseBtn,
      this.DOM.inputBtn,
      this.DOM.monthLabel,
      this.DOM.yearLabel
    ]
    elements.forEach(elem => (elem.disabled = value))
  }
  /**
   * Show logout block, hide login and register blocks
   */
  showLogoutButton() {
    this.DOM.logoutBtnBlock.style.display = 'block'
    this.DOM.loginForm.style.display = 'none'
    this.DOM.registerForm.style.display = 'none'
  }
  /**
   * Set date to UI and flatpickr
   */
  settingDate() {
    // Get current date
    const date = new Date()
    let month = String(date.getMonth() + 1)
    if (month.length === 1) month = '0' + month
    const year = date.getFullYear()
    // Set it to UI
    this.DOM.monthLabel.value = month
    this.DOM.yearLabel.value = year
    // and to flatpickr
    flatpickr(this.DOM.inputDate, {
      altInput: true,
      dateFormat: 'm d Y',
      altFormat: 'M j, Y',
      defaultDate: date
    })
  }
  /**
   * Returns filter parameters for incomes or expenses
   * depenging on received type
   */
  getFilterParams(type) {
    const max = this.DOM[type].querySelector('.max').value
    const min = this.DOM[type].querySelector('.min').value
    const order = this.DOM[type].querySelector('.order').value
    return { max, min, order }
  }
  /**
   * Set date to chart labels
   */
  setDateToChart() {
    // Grab date from UI
    this.DOM.monthChartLabel.innerHTML = this.DOM.monthLabel.value
    this.DOM.yearChartLabel.innerHTML = this.DOM.yearLabel.value
  }
  /**
   * Render chart with Chart.js
   */
  renderChart(data, type = 'line') {
    this.setDateToChart()
    const monthCtx = this.DOM.monthStatsChart.getContext('2d')
    const expensesCtx = this.DOM.expensesStatsChart.getContext('2d')
    // If canvas was already rendered, destroy it
    // to avoid flicker between old and new charts
    if (typeof this.monthChart !== 'undefined') this.monthChart.destroy()
    if (typeof this.expChart !== 'undefined') this.expChart.destroy()
    this.monthChart = new Chart(monthCtx, {
      type: type,
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Incomes',
            data: data.data.incomesChartDataForMonth,
            borderColor: 'rgba(131, 92, 185, 0.9)',
            backgroundColor: 'rgba(131, 92, 185, 0.6)'
          },
          {
            label: 'Expenses',
            data: data.data.expensesChartDataForMonth,
            borderColor: 'rgba(229, 70, 131, 0.9)',
            backgroundColor: 'rgba(229, 70, 131, 0.6)'
          }
        ]
      },
      options: {
        legend: {
          labels: {
            fontColor: 'white'
          }
        },
        scales: {
          yAxes: [
            {
              ticks: {
                fontColor: 'white'
              }
            }
          ],
          xAxes: [
            {
              ticks: {
                fontColor: 'white'
              }
            }
          ]
        }
      }
    })
    this.expChart = new Chart(expensesCtx, {
      type: 'doughnut',
      data: {
        labels: expenseTypes,
        datasets: [
          {
            data: data.data.expensesCategoryChartData,
            borderColor: expensesChartColors,
            backgroundColor: expensesChartColors
          }
        ]
      },
      options: {
        legend: {
          display: true,
          position: 'right',
          labels: { fontColor: '#fff', fontSize: 12 }
        },
        layout: {
          padding: { left: 10, right: 10, top: 10, bottom: 10 }
        }
      }
    })
  }
}

/**
 * Returns prepared template for item
 */
function getTemplate(item) {
  const { id, description, expenseType, value, month, day, year, type } = item
  return `<div class='item' id='${type}-${id}'> 
        <div class='item__description'>${description}</div>
        <div class='item__addition-description'>
          &nbsp;&nbsp;${expenseType ? expenseTypes[expenseType] : ''} 
          (${day}/${month}/${year})
        </div>
        <div class='item__value'>
          ${formatNumber(value, type)}
        </div>
          <i class='far fa-trash-alt item__delete-btn' id='${type}-${id}'></i>
      </div>`
}

const expenseTypes = [
  'Other',
  'Housing',
  'Food and Grocerie',
  'Consumer Debt',
  'Health Care',
  'Personal Care',
  'Entertainment'
]

const expensesChartColors = [
  '#835cb9',
  '#aea0c1',
  '#332e4a',
  '#f64f82',
  '#b681ff',
  '#e64cac',
  '#f7a7c7'
]

const DOM = {
  // Auth
  logoutBtn: document.querySelector('.logout-btn'),
  logoutBtnBlock: document.querySelector('.auth__logout'),
  // Login form
  loginForm: document.querySelector('.auth__login-form'),
  getRegisterForm: document.querySelector('.get-register-form'),
  inputEmail: document.querySelector('.email'),
  inputPassword: document.querySelector('.password'),
  loginBtn: document.querySelector('.login-btn'),
  // Registration form
  registerForm: document.querySelector('.auth__register-form'),
  getSignInForm: document.querySelector('.get-signin-form'),
  inputRegEmail: document.querySelector('.register-email'),
  inputRegPass1: document.querySelector('.register-password'),
  inputRegPass2: document.querySelector('.register-password2'),
  registerBtn: document.querySelector('.register-btn'),
  // List for month and year
  monthLabel: document.querySelector('.date-month'),
  yearLabel: document.querySelector('.date-year'),
  // Total value of budget and persentage
  budgetLabel: document.querySelector('.budget__total'),
  incomeLabel: document.querySelector('.budget__income__value'),
  expensesLabel: document.querySelector('.budget__expenses__value'),
  percentageLabel: document.querySelector('.budget__expenses__percentage'),
  // New item input data
  inputType: document.querySelector('.add-item__type'),
  inputDescription: document.querySelector('.add-item__description'),
  inputValue: document.querySelector('.add-item__value'),
  inputDate: document.querySelector('.add-item__date'),
  inputExpenseType: document.querySelector('.add-item__expense-type'),
  inputBtn: document.querySelector('.add-item__btn'),
  // Bottom section
  bottom: document.querySelector('.bottom'),
  // Income/Expense containers
  incomes: document.querySelector('.incomes'),
  expenses: document.querySelector('.expenses'),
  incomesList: document.querySelector('.incomes__list'),
  expensesList: document.querySelector('.expenses__list'),
  // Filters
  minValueFilter: document.querySelector('.min'),
  maxValueFilter: document.querySelector('.max'),
  orderFilter: document.querySelector('.order'),
  // Charts
  monthStatsChart: document.querySelector('#stats-chart'),
  expensesStatsChart: document.querySelector('#type-expenses-chart'),
  barCharBtn: document.querySelector('#bar-chart-btn'),
  lineCharBtn: document.querySelector('#line-chart-btn'),
  monthChartLabel: document.querySelector('#month-label'),
  yearChartLabel: document.querySelector('#year-label')
}
