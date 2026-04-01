const express= require('express')
const{
    registerFirstUser,
    registerUser,
    loginuser,
    refreshToken,
    logoutUser,
    getMyProfile,
    profileUpdate,
    changePassword,
    deactiveUser,
    reactiveUser,
    searchUser
}= require('../controllers/authController')
const{
    authToken,
    isAdmin,
    protect
}=require('../middleware/authToken')
const route=express.Router()
route.post('/login', loginuser)
route.post('/refresh-token', refreshToken)
route.post('/sign/admin',registerFirstUser)
route.use(authToken); 
route.delete('/logout', logoutUser)
route.put('/update/password', changePassword)
route.use(protect)
route.get('/me', getMyProfile)
route.put('/update',profileUpdate)
route.use(isAdmin)
route.post('/sign/user',registerUser)
route.patch('/deactivate/:id',deactiveUser)
route.patch('/reactive/:id',reactiveUser)
route.get('/search', searchUser)
module.exports = route