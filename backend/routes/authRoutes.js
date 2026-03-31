const express= require('express')
const{
    registerFirstUser,
    registerUser,
    loginuser,
    refreshToken
}= require('../controllers/authController')
const{
    authToken,
    isAdmin
}=require('../middleware/authToken')
const route=express.Router()
route.post('/sign',registerFirstUser)
route.post('/create',authToken,isAdmin,registerUser)//wrap the route withtoken athenticationand admin role checking
route.post('/login', loginuser)
route.post('/refresh-token', refreshToken)
module.exports = route