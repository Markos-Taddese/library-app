//authentication middlware 
const jwt=require('jsonwebtoken');
function authToken(req,res,next){
try{
const token=req.headers['authorization']?.split(' ')[1];
if(!token) return res.status(401).json({message:"authorization token not found!!"})
const user=jwt.verify(token,process.env.TOKEN_SECRET)
req.user=user
next();
}catch(error){
    //token is expired or invalid 
    if(!err.statusCode) return res.status(403).json({message:"invalid token"})
  return next(error);//pass the error to errorhandler.js
}
}
function isAdmin(req,res,next){
    //grant access if the role is admin only, for registering users...
    if(req.user.role!=="admin"){
       return res.status(403).json({error:"only an admin can do register"})
    }
    next()
}
module.exports={
   authToken,
   isAdmin
}