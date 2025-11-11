const express=require('express')
//import from the controller
const {
       createLoans, 
       getActiveLoans, 
       returnLoan, 
       getLoanByMember, 
       getLoanByBook, 
       getOverdueLoans, 
       getMembersWithOverdues,
       renewLoan}=require('../controllers/loanController')
const route=express.Router()
// These routes are mounted onto a base URL (/loans) in server.js to form the final API endpoints.
route.post('/borrow',createLoans)
route.get('/active',getActiveLoans)
route.put('/return',returnLoan)
route.put('/renewal',renewLoan)
route.get('/overdue',getOverdueLoans)
route.get('/overdue/members',getMembersWithOverdues)
// GET /loans/history/member/:id
// Retrieve the complete loan history for a specific member, identified by ID.
route.get('/history/member/:id',getLoanByMember)
// GET /loans/history/member/:id
// Retrieve the complete loan history for a specific member, identified by ID.
route.get('/history/book/:id',getLoanByBook)
//export our route to be used in server file for mounting
module.exports=route