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

async function logoutUser(req,res,next){
const tokenToDelete=req.body.tokenToDelete
if(!tokenToDelete){
    const err=new Error("token not provided for logout")
    err.statusCode=400
    return next(err)
} 
try{
const [result]=await db.execute('DELETE FROM refresh_tokens WHERE token = ?',[tokenToDelete]);
if (result.affectedRows === 0) {
       const err = new Error("Token not found or already logged out")
       err.statusCode=404
            return next(err)
        }
res.status(200).json({ success:true,
    message: "Logged out successfully" });
} catch(error){
    next(error)
}
}

async function getMyProfile(req,res,next){
    try{
//added must chnage password to get the boolean value in auth context.frontend after refresh
  const[row]=await db.execute('SELECT user_id, email, role, is_active, must_change_password FROM users WHERE user_id=?', [req.user.id])//user id comes from the middlware
 //check if the user exist and if they are active
 //if we dont check users is_active status, a user might still have a valid token after deactivation
  if(row.length===0 || row[0].is_active===0){ 
    const err = new Error ("User is Unavailable or deactiveted " )
    err.statusCode=404
    return next(err)
}
  res.status(200).json(row[0]);
    } catch(error){
        next(error)
    }
}
async function profileUpdate(req,res,next){
try{
  const id=req.user.id // get the id from middlware, because the user is updating themselves
const updates=req.body
//prevent mass assignment by specifying fields to update
const fieldsToUpdate=['username','email']
//filter incoming body to let only allowed fileds for an update 
const filteredKeys= Object.keys(updates).filter(key => fieldsToUpdate.includes(key));
// exit early if no ID or no valid fields are provided to update
if (!id || filteredKeys.length === 0) {
      const err=new Error('User ID and update data are required.')
      err.statusCode=400;
      return next(err)
        }
        // verify the user exists and is active before trying to update
  const [[{ count }]] = await db.query(`
                        SELECT COUNT(*) AS count FROM users 
                        WHERE user_id = ?  AND is_active = TRUE`, [id]); 
    if (count === 0) {
     const err = new Error(`Active User with ID ${id} not found or is deactivated.`);
      err.statusCode = 404;
      return next(err);
                }
        // Build SET clause dynamically
const setclause=filteredKeys.map(key=>`${key}=?`).join(',')
const values=filteredKeys.map(key => updates[key]);
values.push(id)// push the ID last to match the WHERE clause placeholder
const [result]=await db.query
        (`UPDATE users SET ${setclause} WHERE user_id=?`,
        values )
    if(result.affectedRows>0){
      res.status(200).json({
        success:true,
        message:"user info updated succesfully"})
    } 
    else{
   // Record existed (checked above), but affectedRows is 0 because nothing changed
      return res.status(200).json({
                success: true,
                message: "Update successful (no new changes were needed)."
                });
    }
  }
    catch(error){
// Automatically passes DB errors like 'ER_DUP_ENTRY' to the global handler       
 next(error)
    }
}

async function changePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;
    const id = req.user.id;
 if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "both current and new passwords are required" });
    }
 try {
  const [rows] = await db.execute('SELECT password_hash FROM users WHERE user_id = ?', [id]);
   if (rows.length === 0) {
            return res.status(404).json({ message: 'User with this id not found' });
        }
  const user = rows[0];
  //verify current password
const match = await bcrypt.compare(currentPassword, user.password_hash);
 if (!match) {
   return res.status(401).json({ message: "Incorrect current password" });
        }
 //hash new passowrd
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
 //flip must_change_password to false so registered users can bypass forced change password(frontend)
 //for admin the false simply overwrites the false
  await db.execute(
    'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE user_id = ?', 
  [newPasswordHash, id]
  );
// Kill existing sessions for security
  await db.execute("DELETE FROM refresh_tokens WHERE user_id = ?", [id]);
 res.status(200).json({ message: "Password updated successfully. Please log in again." });
 } 
 catch (error) {
        next(error);
    }
}

async function deactiveUser(req,res,next){
    const {id}=req.params;
    if (!id) {
          const err=new Error('user ID is required for deletion.')
          err.statusCode=400;
          return next(err)
        }
    const adminId=req.user.id //from the middlware authtoken
    //prevent self deactivattion for the admin
try{    
    if (String(id) === String(adminId)) {
            const err = new Error("Self-deactivation is prohibited to prevent system lockout.");
            err.statusCode = 403; // Forbidden
            return next(err);
        }
    const[user]=await db.execute("SELECT is_active FROM users  WHERE user_id=?",[id])
    if(user.length===0){
        const err = new Error(`User with this ID ${id} not found.`);
   err.statusCode = 404;
   return next(err);
    }   
    const activeUser = user[0];
 if (activeUser.is_active === 0) {
    // ID found, but already deactivated. this prevents redundant deactiavtion process
    const err = new Error(`user with this ID ${id} is already deactivated.`);
    err.statusCode = 400; 
    return next(err);
  }
  //deactivate and remove sessions
    await db.execute('UPDATE users SET is_active=0 WHERE user_id=? AND user_id !=?',[id,adminId])
    await db.execute('DELETE FROM refresh_tokens  WHERE user_id=?',[id]);
    res.status(200).json({message:"user deactivated and session revoked!"})
}catch(error){
    next(error)
}
}

async function reactiveUser(req,res,next){
const {id}=req.params
if (!id) {
          const err=new Error('user ID is required for activation.')
          err.statusCode=400;
          return next(err)
        }
try{
     const[user]=await db.execute("SELECT is_active FROM users WHERE user_id=? ",[id])
    if(user.length===0){
        const err = new Error(`User with this ID ${id} not found.`);
   err.statusCode = 404;
   return next(err);
    }   
    const activeUser = user[0];
    //prevent redudant reactivation process
 if (activeUser.is_active === 1) {
    const err = new Error(`user with this ID ${id} is active.`);
    err.statusCode = 400; 
    return next(err);
  }
await db.execute('UPDATE users SET is_active=1 WHERE user_id=?',[id])
res.status(200).json({message:"User activated succesfully!!"})
}catch(error){
    next(error)
}
}
async function searchUser(req, res, next) {
  try {  
    const { search, status } = req.query;
    // Start with a base query that is always true
    let query = 'SELECT user_id, username, email, role, is_active, created_at FROM users WHERE 1=1';
    let params = []; 
    //dynamic search, username or role
    if (search) {
      query += ' AND (username LIKE ? OR role LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    //status filter
  if (status === 'active') {
            query += ' AND is_active = 1';
        } else if (status === 'inactive') {
            query += ' AND is_active = 0';
        }
    query += ` ORDER BY created_at ASC`;
    const [results] = await db.execute(query, params);
    
    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No user matched your search criteria.',
        users: []
      });
    }
    
    res.json({
      success: true,
      count: results.length,
      users: results
    });
  }
  catch(error) {
    next(error)
    }
}
module.exports={
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
}