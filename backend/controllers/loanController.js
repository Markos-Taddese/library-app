const db=require('../config/database')
async function createLoans(req,res,next){
let connection;
    try{
      const {book_id,member_id}=req.body
      //check the required inputs are present in the request body
     if (!book_id||!member_id) {
         const err=new Error('Book ID and Member ID are required for loan creation.')
          err.statusCode=400;
          return next(err)
        }
    connection=await db.getConnection()
    await connection.beginTransaction()
    
    const [book]=await connection.query(`select * from books where book_id=? 
                                         and available=true for update`,[book_id])
      //Rollback if the book isnt available
      if (book.length === 0)
        {
          await connection.rollback();  
        const err=new Error('Book not available for loan or ID is invalid.')
        //409 coz book exists int the database but its state(available=false)
          err.statusCode=409;
          return next(err)
        }
         const [member]=await connection.query('select * from members where member_id=?',[member_id])
      //Rollback if the member isnt available
     if (member.length === 0) {
          await connection.rollback();  
          const err=new Error('Member not available for loan or ID is invalid.')
          err.statusCode=404;//404 bcoz the member dont exist in the database at all
          return next(err)
        }
    await connection.query(`insert into loans (book_id, member_id, loan_date, due_date)
                            values(?,?,current_date(), date_add(current_date(),interval 14 days))`,
                            [book_id,member_id])
    //the nature of 'insert' makes the need of checking if theres affected row, obsolete
    await connection.query(`update books set available= false where book_id=?`,[book_id])   
    //commits only when all queries were successful, the process is atomic
    await connection.commit(); 
    
    res.status(201).json({
      success:true,
      message: 'Book loaned successfully'});                
    }
    catch(error){
    //if the error happens while there's a database connection
      if(connection){
   await connection.rollback();
  next(error)
      }
    // and if the error is happen bc theres no connection of database at the momemnt/ was never made
        const err=new Error('Database connection failed. Unable to process request.')
          err.statusCode=503;
          return next(err)
    }
    // realease the connection regardless of success or failure
    finally{
      if(connection){
        connection.release();
      }
    }
}

async function getActiveLoans(req,res,next){
  //look for active loans by fetching data where specifically return_date is null
 try{
  const [loans]=await db.query(`select members.member_id, 
                           concat(members.first_name," ",members.last_name) as member_name,
                           books.title,books.author,loans.loan_date, loans.return_date,loans.due_date
                           from loans 
                           inner join members on loans.member_id=members.member_id
                           inner join books on loans.book_id=books.book_id
                           where loans.return_date is null`)
// Ensure 200 OK is returned when no loans are found, 
 // avoiding a 500 error and providing a clear success message.
 if(loans.length===0){
 return res.status(200).json({
  success:true,
  message:'no active loans available',
  active_loans:[]})
}
return res.status(200).json({
  success:true,
  active_loans:loans});
}
// respond internal error as the error is directly related with the database 
catch(error){
  //handled by our centralErrorHandler
next(error)
}
}
async function returnLoan(req,res,next){
let connection;// declare the connection globally to use everywhere in the function
    
try{  
    const {loan_id}=req.body
    //check the required input(loan_id) is present in the request body
   if (!loan_id) {
   const err=new Error('Loan ID is required for return.')
   err.statusCode=400;
   return next(err)
        }
    connection=await db.getConnection()
    await connection.beginTransaction()
    //lock the query with 'for update' to avoid race condition
    const [loanData]= await connection.query (`select book_id from loans where loan_id=? and 
                                              return_date is null for update`,[loan_id])
    //Rollback if the loan is already returned or the ID is invalid
    if(loanData.length===0){
      await connection.rollback();
    // Use 409 Conflict: The requested loan cannot be returned 
    // because it is either invalid or already marked as returned.
    const err=new Error('No active loan found with that ID.' );
    err.statusCode=409;
    return next(err) //will be handled by centralErrorHandler
    }
    const book_id=loanData[0].book_id // destructure book_id from the fetched row data
      // The preceding SELECT FOR UPDATE verified the loan is active and locked it.
    // **AFFECTED ROWS CHECK IS OMITTED HERE** because the row is guaranteed to be updated.
    await connection.query(`update loans set return_date=current_date where loan_id=? and return_date is null`,[loan_id])
    await connection.query(`update books set available=true where book_id=?`,[book_id])
    await connection.commit(); 
   
    res.status(201).json({
      success:true,
      message: 'Book returned successfully',
     });
   }
   catch(error){
    if(connection){
       await connection.rollback();
       next(error)
    }
const err=new Error('Database connection failed. Unable to process request.')
err.statusCode=503;
return next(err)
   }
   finally{
    if(connection){
        connection.release();
    }
   }
}

async function  getLoanByMember(req,res,next){

try{
  const member_id=req.params.id
  if (!member_id) {
          const err=new Error('Member ID is required in the URL path.')
          err.statusCode=400;
          return next(err)
        }
  //validate if the member is actually existsin members table
  //chose count to do that in the query bc we need the to check simply the existence of that id not fetch the whole data
  const[[{count}]]=await db.query(`select count(*) as count from members where member_id=?`,[member_id])
  const memberExist=count>0;
   // This prevents returning "No loan history" for a fake ID (which should be 404).
  if (!memberExist) {
    const err=new Error(`Error: Member with ID ${member_id} not found.`)
    err.statusCode=404;
     return next(err)
}
  const [result]=await db.query(`select concat(members.first_name," ",members.last_name) as member_name,
                                 books.title, books.author, loans.loan_date, loans.return_date, loans.due_date
                                 from loans
                                 inner join members on loans.member_id=members.member_id
                                 inner join books on loans.book_id=books.book_id
                                 where members.member_id=?
                                 order by loans.loan_date desc`,[member_id])
if(result.length===0){
 return res.status(200).json({
  success:true,
  message:`Member ${member_id} exists but, no loans history for this member`,
  history: []})
}
// Return 200 OK, wrapping the array of results in the consistent 'history' key.
//this will make it easier during frontend developmemnt
return res.status(200).json({
  success:true,
  history: result });
}
catch(error){
next(error)
}
  }
async function  getLoanByBook(req,res,next){

try{
  const book_id=req.params.id
  if (!book_id) {
            const err=new Error('Book ID is required in the URL path.')
            err.statusCode=400;
            return next(err)
        }
        //validate if the book is actually existsin members table
        //using count for the same reason we use it in members
  [[{count}]]=await db.query(`select count(*) as count from books where book_id=?`,[book_id])
  const bookExist=count>0;
  if (!bookExist) {
    // Return 404 Not Found: The requested book resource does not exist.
    const err=new Error(`Error: Book with ID ${book_id} not found.`)
    err.statusCode=404;
    return next(err)
}
  const [result]=await db.query(`select concat(members.first_name," ",members.last_name) as member_name,
                                 books.title, books.author, loans.loan_date, loans.return_date, loans.due_date
                                 from loans
                                 inner join members on loans.member_id=members.member_id
                                 inner join books on loans.book_id=books.book_id
                                 where books.book_id=?
                                 order by loans.loan_date desc`,[book_id])
if(result.length===0){
  // Return 200 OK with a clear message and a consistent 'history' key (as an empty array).
 return res.status(200).json({
  success:true,
  message:'Book ${book_id} exists but, no loans history for this book',
  history:[]})
}
return res.status(200).json({
  success:true,
  history:result});
}
  catch(error){
      next(error)
    }
}
async function getOverdueLoans(req,res,next){
try{  
  // Query: Join loans, members, and books to track overdue loans.
   const[overdueLoans]=await db.query(`select members.member_id, concat(members.first_name," ",members.last_name),
                           books.title,books.author,loans.loan_id,loans.loan_date,loans.due_date,
                           DATEDIFF(current_date(), loans.due_date) as days_overdue
                           from loans 
                           inner join members on loans.member_id=members.member_id
                           inner join books on loans.book_id=books.book_id
                           where return_date is null and loans.due_date<current_date()
                           ORDER BY loans.due_date ASC`)
   if(overdueLoans.length===0){
              return res.status(200).json({
                success:true,
                message:'No loans are currently marked as overdue.',
                history:[]})
     }
   return res.status(200).json({
    success:true,
    history:overdueLoans});
     }
     catch(error){
      next(error)
     }
}
async function getMembersWithOverdues(req,res,next){
try {    
// Query: Join loans, members, and books to count overdue loans per member.
  const[overduemembers]=await db.query(`select members.member_id, concat(members.first_name," ",members.last_name) as members,
                                           count(loans.loan_id) as overdues
                                           from loans 
                                           inner join members on loans.member_id=members.member_id
                                           inner join books on loans.book_id=books.book_id
                                           where return_date is null and loans.due_date<current_date()
                                           group by  members.member_id,members
                                           order by overdues DESC;`)
//wrapping up the result array in history key, object wrapper
if(overduemembers.length===0){
    return res.status(200).json({
      success:true,
      message:'No members are currently have overdues.',
      history:[]})
     }
  return res.status(200).json({
       success:true,
      history:overduemembers});
  }
catch(error){
   // Return 500 Internal Server Error for unhandled database/server exceptions.
      next(error)
     }
}

async function renewLoan(req,res,next){
  let connection;
try{
    const {loan_id}=req.body
    if (!loan_id) {
          const err=new Error('Loan ID is required for renewal.')
          err.statusCode=400;
          return next(err)
        }
    connection=await db.getConnection()
    await connection.beginTransaction()
// Note: We avoid a separate SELECT query here.
// the system does not need any data returned from the row; 
// it only needs to check the WHERE conditions. Therefore, one UPDATE query will be enough for both check and action.
const [updateResult] = await connection.query(
            `update loans
             set due_date = date_add(due_date, interval 14 day)
             where loan_id = ?
             and return_date IS NULL
             and due_date >= current_date()`, 
            [loan_id]
        );
//check if our query brings changes to our data
//and rollback if it dont
    if (updateResult.affectedRows === 0) {
            await connection.rollback();
            const err=new Error(`Renewal failed: Loan is either not active, 
                                past its due date, or the ID is invalid.`)
            return next(err)
        }
//commit if change is made, every query needs to be successful
      await connection.commit()
      return res.status(200).json({
            success:true,
            message: `Loan ID ${loan_id} successfully renewed for another 14 days.`,
            new_due_date_info: 'The new due date is 14 days from today.'
        });
      }
        catch (error) {
      if(connection){
       await connection.rollback();
       next(error)
    }
    //retrun this when database connection failed or was never made
const err=new Error('Database connection failed. Unable to process request.')
err.statusCode=503;
return next(error)
    } 
     // realease the connection regardless of success or failure  
    finally {
        if (connection) connection.release();
    }
}

module.exports={
    createLoans,
    getActiveLoans,
    returnLoan,
    getLoanByMember,
    getLoanByBook,
    getOverdueLoans,
    getMembersWithOverdues,
    renewLoan
}