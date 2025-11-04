const db= require('../config/database')
async function getMembers(req,res){
   try{ 
    const [result]=await db.query('select * from members')
    //wrapping result array in an object for api consistency
    res.status(200).json({members:result})
}
catch(error){
  //internal server error
    res.status(500).json({message:'server error',error: error.message})
  }
}
async function createMember(req,res){
 try{   
  // Destructure necessary fields from the request body.
    const {first_name,last_name,email,phone_number}=req.body
    // Ensure that mandatory fields (name,email and phone number) are provided.
    if (!first_name || !last_name || !email ||!phone_number) {
            return res.status(400).json({ message: 'First name, last name, email and phone_number are required.' });
        }
    const[result]=await db.query
            ('insert into members(first_name,last_name,email,phone_number) values(?,?,?,?)',
            [first_name,last_name,email,phone_number])
    res.status(201).json({
    message:"member created successfully",
    member_id: result.insertId // Retrieves the auto-generated/autoincrement primary key ID.
    });
  }
  catch(error){
    if (error.code && error.code.startsWith('ER_DUP_ENTRY')) {
             return res.status(400).json({ message: 'This email or phone number is already registered.', error: error.message });
        }
        // Handle all other unhandled server/database errors.
    res.status(500).json({message:'server:error',error:error.message})
  }
}
async function updateMemberInfo(req,res){
try{
  const id=req.params.id
const updates=req.body
if (!id || Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Member ID and update data are required.' });
        }
        // Build SET clause dynamically
const setclause=Object.keys(updates).map(key=>`${key}=?`).join(',')
const values=Object.values(updates)
values.push(id)
const [result]=await db.query
        (`update members set ${setclause} where member_id=?`,
        values )
    if(result.affectedRows>0){
      res.status(200).json({message:"member info updated succesfully"})
    } 
    else{
      res.status(404).json({message:"failed to updated membernfo "})
    }
  }
    catch(error){
// Handle MySQL Duplicate Entry error (ER_DUP_ENTRY).
// This occurs if the user tries to update the email a value already used by another member.
      if (error.code && error.code.startsWith('ER_DUP_ENTRY')) {
          return res.status(400).json({ message:'This email is already registered and conflicts with an existing member record.', error: error.message });
        }
// Handle all other unhandled server/database errors.
      res.status(500).json({message:'server error', error:error.message})
    }
}
async function deleteMember(req,res){
try{    
  const id=req.params.id
  // Ensure the Member ID is present in the URL path parameters.
  if (!id) {
            return res.status(400).json({ message: 'Member ID is required for deletion.' });
        }
    const [result]=await db.query('delete from members where member_id = (?)',[id])
    // Check affectedRows: Determines if a member was found and deleted.
    if(result.affectedRows>0){
    res.status(200).json({message:"Member removed succesfully"})
}
else{
  res.status(404).json({message:"Member deletion failed: Member not found."})
}}
catch(error){
  // Handle Foreign Key Constraint Violation (ER_ROW_IS_REFERENCED).
  // This prevents deletion if the member has active loans or history in the 'loans' table.
  if (error.code && error.code.startsWith('ER_ROW_IS_REFERENCED')) {
        return res.status(400).json({ message: 'Cannot delete member: Active loans or records are associated with this ID.', error: error.message });
        }
        // Handle all other unhandled server/database errors.
  res.status(500).json({message:'server error',error:error.message})
}
}
async function searchMembers(req,res){
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
  // --- SUCCESS RESPONSE (200 OK) ---
  // Returns results wrapped in a 'members' object for API consistency.
  res.status(200).json({ members: result });}
  catch(error){
    //internal server error
    res.status(500).json({message:'server error cant retrieve data', error: error.message})
  }
}

async function getMemberStats(req, res) {
 try {
  const [result] = await db.query('SELECT COUNT(*) as total FROM members');
  res.json(result[0]);
}
catch(error){
  res.status(500).json({ 
            message: 'Server error while fetching member statistics.', 
            error: error.message 
        });
}
}
module.exports={getMembers,
                createMember,
                deleteMember,
                updateMemberInfo,
                searchMembers,
                getMemberStats
              }