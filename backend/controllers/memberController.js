const db= require('../config/database')
async function getMembers(req,res,next){
   try{ 
    const [result]=await db.query('select * from members')
    //wrapping result array in an object for api consistency
       if (result.length === 0) {
            return res.status(200).json({
              success: true,
              message: 'No members have been in the system.',
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
 try{   
  // Destructure necessary fields from the request body.
    const {first_name,last_name,email,phone_number}=req.body
    // Ensure that mandatory fields (name,email and phone number) are provided.
    if (!first_name || !last_name || !email ||!phone_number) {
            const err=new Error('First name, last name, email and phone_number are required.')
            err.statusCode=400;
            return next(err)
        }
    const[result]=await db.query
            ('insert into members(first_name,last_name,email,phone_number) values(?,?,?,?)',
            [first_name,last_name,email,phone_number])
    res.status(201).json({
     success:true,
    message:"Member created successfully",
    member_id: result.insertId // Retrieves the auto-generated/autoincrement primary key ID.
    });
  }
  catch(error){
   next(error)
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
const [result] = await db.query('select * from members where member_id = ?', [id]);
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
  const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM members WHERE member_id = ?', [id]);
    if (count === 0) {
      const err = new Error(`Member with ID ${id} not found.`);
      err.statusCode = 404;
      return next(err);
                }
        // Build SET clause dynamically
const setclause=Object.keys(updates).map(key=>`${key}=?`).join(',')
const values=Object.values(updates)
values.push(id)
const [result]=await db.query
        (`update members set ${setclause} where member_id=?`,
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
try{    
  const id=req.params.id
  // Ensure the Member ID is present in the URL path parameters.
  if (!id) {
          const err=new Error('Member ID is required for deletion.')
          err.statusCode=400;
          return next(err)
        }
    const [result]=await db.query('delete from members where member_id = (?)',[id])
    // Check affectedRows: Determines if a member was found and deleted.
    if(result.affectedRows>0){
    res.status(200).json({
      success:true,
      message:"Member removed succesfully"})
}
else{
 const err=new Error(`Member ID ${id} not found.`)
          err.statusCode=404;
          return next(err)
}}
catch(error){
next(error)
}
}
async function searchMembers(req,res,next){
try{  
  const{search}=req.query
//we only have one subsequent query to build and dont need 1=1
//still use 1=1 for future proof, if we ever gonna have any more sunsequent query to build
  let query='select * from members where 1=1'
  let params=[]
  // Add condition to search both name fields using LIKE.
  if(search){
    query+='and (first_name like ? or  last_name like ?)'
    // Push parameters, wrapped in wildcards (%) for partial matching.
    params.push(`%${search}%`, `%${search}%`)
  }
  // Execute the dynamically built query using parameterized safety.
  const [result]=await db.query(query,params);
 if (result.length === 0) {
    return res.status(200).json({
        success: true,
        message: 'No member matched your search criteria.',
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
  const [result] = await db.query('SELECT COUNT(*) as total FROM members');
  res.status(200).json({
            success: true,
            total_members: result[0].total 
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