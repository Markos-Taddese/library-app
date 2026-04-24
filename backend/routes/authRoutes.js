const express= require('express')
const{
    registerFirstUser,
    checkSystemSetup,
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getMyProfile,
    profileUpdate,
    changePassword,
    deactivateUser,
    reactivateUser,
    searchUser,
    adminRecovery
}= require('../controllers/authController')
const{
    authToken,
    isAdmin,
    protect
}=require('../middleware/authToken')
const route=express.Router()
route.post('/login', loginUser)
route.post('/refresh-token', refreshToken)
route.post('/sign/admin',registerFirstUser)
route.get('/check-setup', checkSystemSetup);
route.post('/admin/recover',adminRecovery)
route.use(authToken); 
route.post('/logout', logoutUser)
route.put('/update/password', changePassword)
route.get('/me', getMyProfile)
route.use(protect)
route.put('/update',profileUpdate)
route.use(isAdmin)
route.post('/sign/user',registerUser)
route.patch('/deactivate/:id',deactivateUser)
route.patch('/reactive/:id',reactivateUser)
route.get('/search', searchUser)

module.exports = route