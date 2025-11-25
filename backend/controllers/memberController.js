const db= require('../config/database')
async function getMembers(req,res,next){
   try{ 
    const [result]=await db.query('SELECT * FROM members WHERE is_deleted = FALSE')
    //wrapping result array in an object for api consistency
       if (result.length === 0) {
            return res.status(200).json({
              success: true,
              message: 'No active members have been in the system.',
              members: []
            });
        }
    res.status(200).json({
      success:true,
      members:result})
}
catch(error){
  //internal server error
    next(error)
  }
}
async function createMember(req,res,next){
  let connection;
 try{   
  // Destructure necessary fields from the request body.
    const {first_name,last_name,email,phone_number}=req.body
    // Ensure that mandatory fields (name,email and phone number) are provided.
    if (!first_name || !last_name || !email ||!phone_number) {
            const err=new Error('First name, last name, email and phone_number are required.')
            err.statusCode=400;
            return next(err)
        }
connection = await db.getConnection();
await connection.beginTransaction();
const [existingMembers] = await connection.query(
            `SELECT member_id, is_deleted FROM members WHERE LOWER(email) = LOWER(?) FOR UPDATE`,
            [email]
        );
        
if (existingMembers.length > 0) {
  const member = existingMembers[0];
   if (member.is_deleted === 0) {
  //  Active Duplicate (Conflict)
   const err = new Error(`An active member already exists with the email ${email} (ID: ${member.member_id}).`);
    err.statusCode = 409;
      return next(err)
            } 
else {
 // Deactivated Re-sign-up (Re-activate)
    await connection.query(
                    `UPDATE members 
                     SET is_deleted = FALSE, first_name = ?, last_name = ?, phone_number = ? 
                     WHERE member_id = ?`,
                    [first_name, last_name, phone_number, member.member_id]
   );

await connection.commit();
 return res.status(200).json ({ 
   member_id: member.member_id, 
   message: `Member ID ${member.member_id} successfully re-activated.` 
  });
   }
  }
const[result]=await connection.query
              ('INSERT INTO members(first_name,last_name,email,phone_number) values(?,?,?,?)',
            [first_name,last_name,email,phone_number])
            await connection.commit();
return res.status(201).json({
   success:true,
   message:"Member created successfully",
    member_id: result.insertId // Retrieves the auto-generated/autoincrement primary key ID.
    });
  }
catch (error) {
  if (connection) {
   await connection.rollback();
   return next(error);
  }
const err = new Error('Database connection failed. Unable to process request.');
err.statusCode = 503;
return next(err);
  } 
  finally {
  if (connection) {
     connection.release();
        }
    }
}
 async function getDetailMember(req, res, next) {
try {
const id = req.params.id;
if (!id) {
const err = new Error('Member ID is required in the URL path.');
err.statusCode = 400;
return next(err);
}
const [result] = await db.query('SELECT * FROM members WHERE member_id = ?', [id]);
// 404 Not Found Check
if (result.length === 0) {
const err = new Error(`Member with ID ${id} not found.`);
err.statusCode = 404;
return next(err);
}
res.status(200).json({
success: true,
member: result[0]
});
} catch (error) {
next(error);
}
}
async function updateMemberInfo(req,res,next){
try{
  const id=req.params.id
const updates=req.body
if (!id || Object.keys(updates).length === 0) {
      const err=new Error('Member ID and update data are required.')
      err.statusCode=400;
      return next(err)
        }
  const [[{ count }]] = await db.query(`
                        SELECT COUNT(*) AS count FROM members 
                        WHERE member_id = ?  AND is_deleted = FALSE`, [id]);
    if (count === 0) {
     const err = new Error(`Active member with ID ${id} not found or is deactivated.`);
      err.statusCode = 404;
      return next(err);
                }
        // Build SET clause dynamically
const setclause=Object.keys(updates).map(key=>`${key}=?`).join(',')
const values=Object.values(updates)
values.push(id)
const [result]=await db.query
        (`UPDATE members SET ${setclause} WHERE member_id=?`,
        values )
    if(result.affectedRows>0){
      res.status(200).json({
        success:true,
        message:"Member info updated succesfully"})
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
       next(error)
    }
}
async function deleteMember(req,res,next){
  let connection;
try{    
  const id=req.params.id
  // Ensure the Member ID is present in the URL path parameters.
  if (!id) {
          const err=new Error('Member ID is required for deletion.')
          err.statusCode=400;
          return next(err)
        }
        
connection = await db.getConnection();
await connection.beginTransaction();
const [members] = await connection.query(`SELECT is_deleted FROM members WHERE member_id=? FOR UPDATE`, [id]);
if (members.length === 0) {
   await connection.rollback();
   // ID not found at all.
   const err = new Error(`Member ID ${id} not found.`);
   err.statusCode = 404;
   return next(err);
   }
 const member = members[0];
 if (member.is_deleted === 1) {
    await connection.rollback();
    // ID found, but already deactivated.
    const err = new Error(`Member ID ${id} is already deactivated.`);
    err.statusCode = 400; 
    return next(err);
  }
const [[{ active_loans }]] = await connection.query(
            `SELECT COUNT(*) AS active_loans
             FROM loans 
             WHERE member_id = ? AND return_date IS NULL`, 
            [id]
        );
 if (active_loans > 0) {
   await connection.rollback();
   // 409 Conflict: Cannot deactivate because the member holds resources.
    const err = new Error(`
      Cannot deactivate member ID ${id}. 
      They currently have ${active_loans} active loan(s) that must be returned first.`);
    err.statusCode = 409; 
    return next(err);
  }
  await connection.query('UPDATE members SET is_deleted=TRUE WHERE member_id = (?) ',[id])
  await connection.commit();
 res.status(200).json({
  success: true,
  message: `Member ID ${id} successfully deactivated (soft deleted).`
   });
      
      }
catch (error) {
  if (connection) {
   await connection.rollback();
   return next(error);
  }
const err = new Error('Database connection failed. Unable to process request.');
err.statusCode = 503;
return next(err);
  } 
  finally {
  if (connection) {
     connection.release();
        }
    }
}
async function searchMembers(req,res,next){
try{  
  const{search}=req.query
//we only have one subsequent query to build and dont need 1=1
//still use 1=1 for future proof, if we ever gonna have any more sunsequent query to build
  let query='SELECT * FROM members where 1=1 AND is_deleted = FALSE '
  let params=[]
  // Add condition to search both name fields using LIKE.
  if(search){
    query+='AND (first_name like ? OR  last_name like ?)'
    // Push parameters, wrapped in wildcards (%) for partial matching.
    params.push(`%${search}%`, `%${search}%`)
  }
  // Execute the dynamically built query using parameterized safety.
  const [result]=await db.query(query,params);
 if (result.length === 0) {
    return res.status(200).json({
        success: true,
        message: 'No active member matched your search criteria.',
        members: []
    });
}
  // Returns results wrapped in a 'members' object for API consistency.
  res.status(200).json({
    success:true,
    members: result });}
  catch(error){
    next(error)
  }
}

async function getMemberStats(req, res,next) {
 try {
  const [result] = await db.query('SELECT COUNT(*) as total FROM members WHERE is_deleted = FALSE');
  res.status(200).json({
            success: true,
            total_active_members: result[0].total 
        });
}
catch(error){
next(error)
}
}
module.exports={getMembers,
                getDetailMember,
                createMember,
                deleteMember,
                updateMemberInfo,
                searchMembers,
                getMemberStats
              }