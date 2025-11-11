const express=require('express')
//import the handler functions from the bookController
const {
       getBooks,
       saveBooks,
       deleteBooks,
       searchBooks,
       updateBooks,
       getBookStats,
       getDetailBook
       }=require('../controllers/bookController')
const route=express.Router()
// These routes are mounted onto a base URL (/books) in server.js to form the final API endpoints.
route.post('/',saveBooks)
route.get('/all',getBooks)
route.get('/search',searchBooks)
route.get('/stats',getBookStats)
route.get('/:id',getDetailBook)
route.delete('/:id',deleteBooks)
// PUT /books/:id
route.put('/:id',updateBooks)
//export our route to be used in server file for mounting
module.exports = route