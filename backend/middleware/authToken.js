const jwt=require('jsonwebtoken');
function authToken(req,res,next){
const authHeader=req.headers['authorization'];
const token=authHeader && authHeader.split(' ')[1];
if(!token) return res.status(401).json({message:"authorization token not found!!"})
try{
const user=jwt.verify(token,process.env.TOKEN_SECRET)
req.user=user
next();
}catch(error){
        const err = new Error('Token expired or invalid');
          err.statusCode=401;
   return next(err);
}
}
const isAdmin=(req,res,next)=>{
   if (!req.user || req.user.role?.toLowerCase() !== "admin"){
      const err=new Error("Admin access required");
      err.statusCode=403;
     return   next(err)
    }
    next()
}
const protect = (req, res, next) => {
   //if user needs to change their password block them from accessing everything else
    if (req.user.must_change_password) {
        const err=new Error("Change Password first!");
      err.statusCode=403;
     return   next(err)
    }
    //if not let them through
    next();
};
module.exports={
   authToken,
   isAdmin,
   protect
}