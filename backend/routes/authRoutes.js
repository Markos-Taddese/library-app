const express= require('express')
const{
    registerFirstUser,
    checkSystemSetup,
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
route.get('/check-setup', checkSystemSetup);
route.use(authToken); 
route.delete('/logout', logoutUser)
route.put('/update/password', changePassword)
route.get('/me', getMyProfile)
route.use(protect)
route.put('/update',profileUpdate)
route.use(isAdmin)
route.post('/sign/user',registerUser)
route.get('/deactivate/:id',deactiveUser)
route.get('/reactive/:id',reactiveUser)
route.get('/search', searchUser)
module.exports = route