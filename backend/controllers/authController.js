const db =require('../config/database');
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const crypto = require('crypto');
async function registerFirstUser(req,res,next){
try{
    const[existedUser]= await db.execute('Select COUNT(*) AS count FROM users')
if(existedUser[0].count>0){
    const err= new Error("Initial setup already completed. Registration closed.")
    err.statusCode=403
return next(err) //there's already an admin Registered
}

    const {username,email,password}=req.body
    if(!username||!password ||!email){
        const err= new Error("password, username and email are required !")
        err.statusCode=400
        return next(err)
    } 
    const hashedPassword= await bcrypt.hash(password,10);
    const role="admin"
   await db.execute(`INSERT INTO users (username,email,role,password_hash) 
                                       VALUES(?,?,?,?)`,[username,email,role,hashedPassword])
return res.status(201).json({ success:true,
                              message: "System initialized. Admin registered successfully." });//the admin has to login after regsitration
} catch(error){
 return next(error)
}

}

async function loginuser(req,res,next){
const {username,password}=req.body
    try { 
        const[row]= await db.execute("SELECT * FROM users WHERE username =? AND is_active=1",[username])
const users=row[0]
//if theres no user found with the credntials
if(!users){
    const err=new Error("invalid username or password")
    err.statusCode=401
 return next(err)
}
const comparedPassword=await bcrypt.compare(password, users.password_hash)
if(!comparedPassword){
        const err=new Error("invalid username or password")
        err.statusCode=401
       return next(err)
    }
const userPayload ={
    name: users.username,
    id:users.user_id,
    role:users.role,
    must_change_password:Boolean(users.must_change_password) //better reading for frontend
}
const accessToken=jwt.sign(userPayload, process.env.TOKEN_SECRET,{expiresIn:'1m'})
const refreshByte=crypto.randomBytes(40).toString('hex');
console.log(userPayload)
await db.execute("INSERT INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 14 DAY))",[userPayload.id, refreshByte])

res.json({ success:true,
    message: userPayload.must_change_password ? "Password change required" : "Successfully Logged in!",
      user: userPayload,
      accessToken: accessToken,
      refreshToken: refreshByte }) // sending response object so the frontend can access user payload without having jwt decoded
}catch(error){
    next(error)
}
}
async function refreshToken(req,res,next){
const refresher= req.body.token
if(!refresher){
    const err=new Error("refresh token not found")
    err.statusCode=401
    return next(err)
} // no refrsh token , unauthroized to acess this endpoint
try {
  const [rows] = await db.execute(`
                SELECT u.user_id, u.username, u.role 
                FROM refresh_tokens rt
                JOIN users u ON rt.user_id = u.user_id
                WHERE rt.token = ? AND rt.is_revoked = FALSE AND rt.expires_at > NOW() AND is_active
            `, [refresher]);
if (rows.length === 0){
    const err=new Error("token unavailable, revoked or expired")// Token revoked or expired
    err.statusCode=403
     return next(err)
}
const userpayload = rows[0];
const newAccessToken = jwt.sign({ id: userpayload.user_id, 
                                name: userpayload.username, 
                                role: userpayload.role }, 
                                process.env.TOKEN_SECRET, { expiresIn: '1m' }); //expired time only 1m for developement testing
 const newRefresher=crypto.randomBytes(40).toString('hex');

 //update only the specifc token thats getting replaced
 await db.execute("UPDATE  refresh_tokens SET token=?, expires_at=DATE_ADD(NOW(),INTERVAL 14 DAY) WHERE token=?",
                 [newRefresher,refresher]);
 await db.execute('DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()',[userpayload.user_id]);// delete all expired tokens for that user_id
   res.json({ accessToken: newAccessToken,
             newRefreshToken:newRefresher
  });
}
 catch(err){
next(err)
 }   
}
async function registerUser(req,res,next){
try{   
    //check if theres and admin first  
    const[existedUser]= await db.execute('SELECT COUNT(*) AS count from users')
if(existedUser[0].count>=1){
const {username,email,password,role}=req.body
if (!username || !password || !role) {
    const err=new Error("Missing required fields")
    err.statusCode=400
        return next(err)
    }
    const allowedRoles = ['staff', 'member'];
//ENUM might throw erro if we dnt specify the roles here
if (!allowedRoles.includes(role)) {
    const err=new Error("Invalid role specified")
    err.statusCode=400
    return next(err)
}
const [existedRecord]=await db.execute("SELECT  email, username,is_active FROM users WHERE email=? OR username=?",[email,username])
//check if theres existed record of user with the credtials accepted from request body
if(existedRecord.length>0){
    const user=existedRecord[0]
   const statusMsg = user.is_active === 0 ? "account is deactivated" : "is already active";
 const err = new Error(`An active user already exists with  this email or username ${statusMsg}.`);
    err.statusCode = 409;
      return next(err)
    
   } 
const hashedPassword= await bcrypt.hash(password,10)
const must_change_password = true;

await db.execute(`INSERT INTO users (username,email,password_hash,role,must_change_password) 
                                       VALUES(?,?,?,?,?)`,[username,email,hashedPassword,role,must_change_password])
return res.status(201).json({ success:true,
    message:"Succesfully Reegistered staff"})

}

} catch(error){
    next(error)
}
}


module.exports={
    registerFirstUser,
    registerUser,
    loginuser,
    refreshToken,
}