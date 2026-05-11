const db=require('../config/database')
async function logActivity( user_id,action_type,details, connection=null){
const query = 'INSERT INTO activity_logs (user_id, action_type, details) VALUES (?, ?, ?)';
  const params = [user_id, action_type, details];    
  try{
if(connection){
await connection.execute(query, params)
}else{
    await db.execute(query, params)
}
    } catch(err){
console.error("Logging Activity failed:", err);
if(connection){
throw err
}
}

}
module.exports = logActivity;