const express=require('express')
const routes=express.Router()
//import the handler functions from the memberController
const {getMembers,
       createMember,
       deleteMember,
       updateMemberInfo,
       searchMembers,
       getDetailMember
       }=require('../controllers/memberController')
// These routes are mounted onto a base URL (/loans) in server.js to form the final API endpoints.
routes.get('/',getMembers)
routes.get('/:id',getDetailMember)
routes.post('/',createMember)
routes.delete('/:id',deleteMember)
routes.put('/:id',updateMemberInfo)
// GET /members/search
routes.get('/search',searchMembers)

module.exports=routes