const firebaseConfig = {
  apiKey: '***',
  authDomain: 'budget-e58e9.firebaseapp.com',
  databaseURL: 'https://budget-e58e9.firebaseio.com',
  projectId: '***',
  storageBucket: '***',
  messagingSenderId: '***',
  appId: '***'
}

export default class APIController {
  constructor() {
    firebase.initializeApp(firebaseConfig)
    this.auth = firebase.auth()
    this.db = firebase.firestore()
  }

  // Expenses and Incomes API
  addItemToDB = (item, userId) =>
    this.db
      .collection(item.type)
      .add({ ...item, userId, timestamp: Date.now() })

  fetchFinances = (userId, type, { month, year }) =>
    this.db
      .collection(type)
      .where('userId', '==', userId)
      .where('month', '==', month)
      .where('year', '==', year)
      .orderBy('timestamp', 'desc')
      .get()

  deleteItemFromDB = (type, id) =>
    this.db
      .collection(type)
      .doc(id)
      .delete()

  // Authentication API
  signUp = (email, password) =>
    this.auth.createUserWithEmailAndPassword(email, password)

  signIn = (email, password) =>
    this.auth.signInWithEmailAndPassword(email, password)

  signOut = () => this.auth.signOut()

  // Users Firestore API
  user = id => this.db.doc(`users/${id}`)

  users = () => this.db.collection('users')
}
