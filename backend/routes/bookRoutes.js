const express=require('express')
//import the handler functions from the bookController
const {
       getBooks,
       saveBooks,
       deleteBooks,
       searchBooks,
       updateBooks,
       getBookStats
       }=require('../controllers/bookController')
const route=express.Router()
// These routes are mounted onto a base URL (/books) in server.js to form the final API endpoints.
route.get('/',getBooks)
route.post('/',saveBooks)
route.delete('/:id',deleteBooks)
// PUT /books/:id
route.put('/:id',updateBooks)
route.get('/search',searchBooks)
route.get('/status',getBookStats)
//export our route to be used in server file for mounting
module.exports = route