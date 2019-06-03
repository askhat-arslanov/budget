import APIController from './APIController'
import UIController from './UIController'
import NotifyController from './NotifyController'

import { filterByMax, filterByMin, ordering } from './utils'

export default class MainController {
  constructor() {
    this.APICtrl = new APIController()
    this.NotifyCtrl = new NotifyController()
    this.UICtrl = new UIController()
    this.authUser = null
    this.incomes = []
    this.expenses = []
    this.chartData = {}
  }
  /**
   * Fill containers with incomes, expenses,
   * total amount of budget and persentage,
   * and render chart for month which is shown in UI
   */
  fetchAndFillItemList() {
    const date = this.UICtrl.dateFromUI()
    const { uid } = this.authUser.user
    // Get item lists filtered by auth user and date
    Promise.all([
      this.APICtrl.fetchFinances(uid, 'expenses', date),
      this.APICtrl.fetchFinances(uid, 'incomes', date)
    ])
      .then(response => {
        // Prepare arrays with expenses and incomes
        this.expenses = response[0].docs.map(i => ({ ...i.data(), id: i.id }))
        this.incomes = response[1].docs.map(i => ({ ...i.data(), id: i.id }))
        // and pass them to UI
        this.UICtrl.fillItemList('expenses', this.expenses)
        this.UICtrl.fillItemList('incomes', this.incomes)
        // Calculate and show data for budget and charts
        this.refreshBudgetAndCharts()
      })
      .catch(() => {
        this.NotifyCtrl.error(notifies.getItemsError)
      })
  }
  /**
   * Add new item to DB and UI
   */
  addItem() {
    // Get item from user input and user id
    const item = this.UICtrl.getNewItemData()
    const { uid } = this.authUser.user
    if (item.description !== '' && item.value > 0) {
      this.APICtrl.addItemToDB(item, uid)
        .then(doc => {
          const { month, year } = this.UICtrl.dateFromUI()
          // If date of added item is equal to date in UI
          if (month === item.month && year === item.year) {
            item.id = doc.id
            // Add item to corresponding items (expenses or incomes)
            this[item.type].push(item)
            // Then add to UI
            this.UICtrl.addItemToList(item)
            // And update budget and charts
            this.refreshBudgetAndCharts()
          }
          // Clear inputs and shift cursor to the description input
          this.UICtrl.clearFieldsAndShiftFocus()
        })
        .catch(() => {
          this.NotifyCtrl.error(notifies.addNewItemError)
        })
    } else {
      this.NotifyCtrl.info(notifies.emptyNewItemInputs)
    }
  }
  /**
   * Remove item from DB and UI
   */
  deleteItem(fullID) {
    // Parse received fullID to type and id
    const [type, id] = fullID.split('-')
    this.APICtrl.deleteItemFromDB(type, id)
      .then(() => {
        // Delete item from this instance of MainController
        this[type] = this[type].filter(item => item.id !== id)
        // And remove from UI
        this.UICtrl.deleteItemFromUI(fullID)
        // Update budget and charts
        this.refreshBudgetAndCharts()
      })
      .catch(() => {
        this.NotifyCtrl.error(notifies.removeFromDBError)
      })
  }
  /**
   * Count total amount of budget
   */
  calculateTotalBudget() {
    const totalExpense = countTotal(this.expenses)
    const totalIncome = countTotal(this.incomes)
    return { totalExpense, totalIncome }
  }
  /**
   * Calculate actual data for chart
   */
  calculateChartData() {
    const { month, year } = this.UICtrl.dateFromUI()
    // Get amount of days in month, which displayed in UI
    const days = new Date(year, month, 0).getDate()
    // Prepare chart data based on this amount of days
    const incomesChartDataForMonth = prepareChartDataForMonth(
      this.incomes,
      days
    )
    const expensesChartDataForMonth = prepareChartDataForMonth(
      this.expenses,
      days
    )
    const expensesCategoryChartData = prepareExpensesCategoryChartData(
      this.expenses
    )
    this.chartData.data = {
      incomesChartDataForMonth,
      expensesChartDataForMonth,
      expensesCategoryChartData
    }
    // Create array with range of days in certain month
    this.chartData.labels = Array.from({ length: days }, (_, idx) => idx + 1)
  }
  /**
   * Update total amount of budget and charts
   */
  refreshBudgetAndCharts() {
    // Recalculate total amount of budget and pass to UI
    const total = this.calculateTotalBudget()
    this.UICtrl.fillBudgetAndPerc(total)
    // Recalculate data for chart and update it
    this.calculateChartData()
    this.UICtrl.renderChart(this.chartData)
  }
  /**
   * Filter lists of incomes/expenses
   */
  filterItemList(type) {
    const { max, min, order } = this.UICtrl.getFilterParams(type)
    // Check if at least one filter is performed
    if (max || min || order) {
      // Take a copy of actual items
      let filtered = [...this[type]]
      // And filter that
      if (max) filtered = filterByMax(filtered, max)
      if (min) filtered = filterByMin(filtered, min)
      if (order) filtered = ordering(filtered, order)
      // Than pass that to UI
      this.UICtrl.fillItemList(type, filtered)
      // Additionally show button for reset filters
      const resetFilter = document.querySelector(`.${type} .filter-reset-btn`)
      resetFilter.style.display = 'inline-block'
    } else {
      this.NotifyCtrl.info(notifies.emptyFilterInputs)
    }
  }
  /**
   * Reset filters. Set items from this instance
   */
  resetFilters(type) {
    this.UICtrl.fillItemList(type, this[type])
    // Clear inputs
    this.UICtrl.clearFilterInputs(type)
  }
  /**
   * Authorization
   */
  authorization(authUser = null) {
    // Save authUser to localStorage if registration or authentication
    if (authUser) localStorage.setItem('authUser', JSON.stringify(authUser))
    this.authUser = JSON.parse(localStorage.getItem('authUser'))
    // Show logout button
    this.UICtrl.showLogoutButton()
    // Filling containers items data
    this.fetchAndFillItemList()
    // Set event listeners for authenticated user
    this.addListeners(true)
    // Unblock inputs
    this.UICtrl.toggleBlockInputs(false)
  }
  /**
   * Authentication
   */
  authentication() {
    // Get email and password
    const { email, password } = this.UICtrl.getLoginData()
    if (email && password) {
      this.APICtrl.signIn(email, password)
        .then(authUser => {
          this.authorization(authUser)
        })
        .catch(error => {
          this.NotifyCtrl.error(error.message)
        })
    }
  }
  /**
   * Registration
   */
  registration() {
    // Get user input
    const registerData = this.UICtrl.getRegisterData()
    // Check data for validity
    if (checkRegister(registerData)) {
      // Try to register user
      const { email, password1 } = registerData
      this.APICtrl.signUp(email, password1)
        .then(authUser => {
          this.authorization(authUser)
        })
        .catch(error => {
          this.NotifyCtrl.error(error.message)
        })
    }
  }
  /**
   * Main endpoint to start app
   */
  initialize() {
    // Set date to UI and flatpickr
    this.UICtrl.settingDate()
    // If user is authenticated (authUser exists)
    if (localStorage.authUser) {
      // Authorize user
      this.authorization()
    } else {
      // Set certain event listeners
      this.addListeners(false)
      // Block inputs
      this.UICtrl.toggleBlockInputs(true)
    }
  }
  /**
   * Add event listeners depending on userIsAuthenticated
   */
  addListeners(userIsAuthenticated) {
    if (userIsAuthenticated) {
      /**
       * Change month listener
       * Call method 'filling' for rerendiring item lists
       * depending on changed month
       */
      this.UICtrl.DOM.monthLabel.addEventListener('change', () => {
        this.fetchAndFillItemList()
      })
      /**
       * Change year listener
       * Call method 'filling' for rerendiring item lists
       * depending on changed year
       */
      this.UICtrl.DOM.yearLabel.addEventListener('change', () => {
        this.fetchAndFillItemList()
      })
      /**
       * Logout listener
       */
      this.UICtrl.DOM.logoutBtn.addEventListener('click', () => {
        this.APICtrl.signOut()
        localStorage.removeItem('authUser')
        location.reload()
      })
      /**
       * Listener for adding new item
       */
      this.UICtrl.DOM.inputBtn.addEventListener('click', () => {
        this.addItem()
      })
      /**
       * Listeners for removing item
       */
      this.UICtrl.DOM.bottom.addEventListener('click', e => {
        if (e.target.classList.contains('item__delete-btn')) {
          this.deleteItem(e.target.id)
        }
      })
      /**
       * Listener for show/hide drop-down list type of expense
       * Show it if choosed 'expenses'
       */
      this.UICtrl.DOM.inputType.addEventListener('change', e => {
        const { value } = e.target
        this.UICtrl.DOM.inputExpenseType.style.display =
          value === 'income' ? 'none' : 'inline-block'
      })
      /**
       * Filter listeners
       */
      this.UICtrl.DOM.bottom.addEventListener('click', e => {
        if (e.target.classList.contains('filter-btn')) {
          const type = e.target.parentElement.classList[0]
          this.filterItemList(type)
        }
      })
      /**
       * Filter reset listeners
       */
      document.addEventListener('click', e => {
        if (e.target.classList.contains('filter-reset-btn')) {
          this.resetFilters(e.target.parentElement.classList[0])
          e.target.style.display = 'none'
        }
      })
      /**
       * Listener for change month chart to bar type
       */
      this.UICtrl.DOM.barCharBtn.addEventListener('click', () => {
        this.UICtrl.renderChart(this.chartData, 'bar')
      })
      /**
       * Listener for change month chart to line type
       */
      this.UICtrl.DOM.lineCharBtn.addEventListener('click', () => {
        this.UICtrl.renderChart(this.chartData, 'line')
      })
    } else {
      /**
       * Listener for authentication
       */
      this.UICtrl.DOM.loginBtn.addEventListener('click', () => {
        this.authentication()
      })
      /**
       * Listener for registration
       */
      this.UICtrl.DOM.registerBtn.addEventListener('click', () => {
        this.registration()
      })
      /**
       * Listener for show login form
       * and hide registration form
       */
      this.UICtrl.DOM.getSignInForm.addEventListener('click', () => {
        this.UICtrl.DOM.registerForm.style.display = 'none'
        this.UICtrl.DOM.loginForm.style.display = 'block'
      })
      /**
       * Listener for show registration form
       * and hide login form
       */
      this.UICtrl.DOM.getRegisterForm.addEventListener('click', () => {
        this.UICtrl.DOM.loginForm.style.display = 'none'
        this.UICtrl.DOM.registerForm.style.display = 'block'
      })
    }
  }
}

/**
 * Validate registration data
 */
function checkRegister(registerData) {
  let withoutError = true
  const { email, password1, password2 } = registerData
  const checkEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  if (!email.match(checkEmail)) {
    this.NotifyCtrl.error(notifies.invalidEmail)
    withoutError = false
  }
  if (password1 !== password2) {
    this.NotifyCtrl.error(notifies.mismatchPasswords)
    withoutError = false
  }
  if (password1.length < 6) {
    this.NotifyCtrl.error(notifies.shortPassword)
    withoutError = false
  }
  return withoutError
}
/**
 * Calculate total value of passed items
 */
function countTotal(items) {
  return items.reduce((accum, item) => ({ value: accum.value + item.value }), {
    value: 0
  }).value
}
/**
 * Calculate chart data of items for month
 */
function prepareChartDataForMonth(items, daysAmount) {
  // Create an array with length of days in month
  const chartDataForMonth = new Array(daysAmount).fill(0)
  // Iterate through array of items and
  // fill corresponding day in array with days
  items.forEach(item => {
    chartDataForMonth[item.day - 1] += item.value
  })
  return chartDataForMonth
}
/**
 * Calculate expenses category data for chart
 */
function prepareExpensesCategoryChartData(items) {
  // Create another array for 7 types of expenses (for top tor chart)
  const expensesCategoryChartData = [0, 0, 0, 0, 0, 0, 0]
  items.forEach(item => {
    expensesCategoryChartData[item.expenseType] += item.value
  })
  return expensesCategoryChartData
}

// Pop-up messages for notify user about errors or show info
const notifies = {
  emptyNewItemInputs: `Enter some data.`,
  emptyFilterInputs: `Set some filters.`,
  getItemsError: `We can't receive your finances right now.
  Try again later.`,
  addNewItemError: `This guy doesn't want to join to our data base. 
  Try again later.`,
  removeFromDBError: `This guy doesn't want to leave our data base. 
  Try again later.`,
  failedAuth: 'Failed authentication. Check your login and password.',
  invalidEmail: `Enter a valid email.`,
  mismatchPasswords: 'Passwords do not match',
  shortPassword: 'Password must be at least 6 characters.',
  oops: 'Oops, something went wrong. Try again later.'
}
