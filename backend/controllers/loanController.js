const db=require('../config/database')
async function createLoans(req,res,next){
let connection;
  try{
    const {copy_id,member_id}=req.body
    //check the required inputs are present in the request body
    if (!copy_id||!member_id) {
      const err=new Error(`Book's copy ID and Member ID are required for loan creation.`)
      err.statusCode=400;
      return next(err)
        }
    connection=await db.getConnection()
    await connection.beginTransaction()
    
    const [bookCopy]=await connection.query(`SELECT * FROM book_copies WHERE copy_id=? 
                                         FOR UPDATE`,[copy_id])
      //Rollback if the book isnt available
      if (bookCopy.length === 0)
        {
          await connection.rollback();  
        const err=new Error(`Book copy with ID ${copy_id} not found.`)
         err.statusCode=404;
          return next(err)
        }
        if(bookCopy[0].status!=='available'){
          await connection.rollback()
          const err=new Error(`Book copy is currently ${bookCopy[0].status} and cannot be loaned.`)
          //409 coz book exists in the database but its state(available=false)
          err.statusCode=409;
          return next(err);
        }
         const [member]=await connection.query('SELECT * FROM members WHERE member_id=?',[member_id])
      //Rollback if the member isnt available
     if (member.length === 0) {
          await connection.rollback();  
          const err=new Error('Member not available for loan or ID is invalid.')
          err.statusCode=404;//404 bcoz the member dont exist in the database at all
          return next(err)
        }
         if (member[0].is_deleted) {
            await connection.rollback();
            const err = new Error(`Member ID ${member_id} is deactivated and cannot borrow books.`);
            err.statusCode = 403; // Forbidden
            return next(err);
        }
        console.log("Attempting to create loan with:", { copy_id, member_id });
    await connection.query(`INSERT INTO loans (copy_id, member_id, loan_date, due_date)
                            VALUES(?,?,CURRENT_DATE(), DATE_ADD(CURRENT_DATE(),INTERVAL 14 DAY))`,
                            [copy_id,member_id])
    //the nature of 'insert' makes the need of checking if theres affected row, obsolete
    await connection.query(`UPDATE book_copies SET status= 'loaned' WHERE copy_id=?`,[copy_id])   
    //commits only when all queries were successful, the process is atomic
    await connection.commit(); 
    
    res.status(201).json({
      success:true,
      book_id: bookCopy[0].book_id,
      copy_id: copy_id,
      message: 'Book Copy loaned successfully'});                
    }
    catch(error){
    //if the error happens while there's a database connection
if(connection){
   await connection.rollback();
   return  next(error)
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
  const [loans]=await db.query(`SELECT l.loan_id, l.member_id, 
                       CONCAT(m.first_name," ",m.last_name) as member_name,
                       CASE WHEN m.is_deleted = TRUE THEN 'Banned' ELSE 'Active' END AS member_status,
                       b.title, a.author_name AS author, l.loan_date, l.return_date, l.due_date
                       FROM loans l
                       INNER JOIN members m on l.member_id=m.member_id
                       INNER JOIN book_copies bc on l.copy_id=bc.copy_id
                       INNER JOIN books b on b.book_id=bc.book_id
                       INNER JOIN authors a on a.author_id=b.author_id
                       WHERE l.return_date IS NULL
                       ORDER BY l.loan_date DESC`)
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
  count:loans.length,
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
    const [loanData]= await connection.query (`SELECT copy_id FROM loans WHERE loan_id=? AND
                                              return_date IS NULL FOR UPDATE`,[loan_id])
    //Rollback if the loan is already returned or the ID is invalid
    if(loanData.length===0){
      await connection.rollback();
    // Use 409 Conflict: The requested loan cannot be returned 
    // because it is either invalid or already marked as returned.
    const err=new Error('No active loan found with that ID.' );
    err.statusCode=409;
    return next(err) //will be handled by centralErrorHandler
    }
    const copy_id=loanData[0].copy_id // destructure copy_id from the fetched row data
    // The preceding SELECT FOR UPDATE verified the loan is active and locked it.
    // **AFFECTED ROWS CHECK IS OMITTED HERE** because the row is guaranteed to be updated.
    await connection.query(`UPDATE loans SET return_date=CURRENT_DATE WHERE loan_id=? AND return_date IS NULL`,[loan_id])
    await connection.query(`UPDATE book_copies SET status='available' WHERE copy_id=?`,[copy_id])
    await connection.commit(); 
   
    res.status(200).json({
      success:true,
      message: 'Book returned successfully',
      loan_id: loan_id,
      copy_id: copy_id
     });
   }
   catch(error){
    if(connection){
       await connection.rollback();
      return  next(error)
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
  const[[{count}]]=await db.query(`SELECT COUNT(*) as count FROM members WHERE member_id=?`,[member_id])
  const memberExist=count>0;
   // This prevents returning "No loan history" for a fake ID (which should be 404).
  if (!memberExist) {
    const err=new Error(`Error: Member with ID ${member_id} not found.`)
    err.statusCode=404;
     return next(err)
}
//left join used, if bokk copies and title were to be complelty..
// ..delted to get member history we need everything from loans 
//inner join would only give us the matches
// prevents us from getting the whole loan histroy of the member for the deleted books
  const [result]=await db.query(`SELECT CONCAT(m.first_name," ",m.last_name) as member_name,b.book_id,
                                 b.title, a.author_name,l.loan_date,l.return_date,l.due_date
                                 FROM loans l
                                 INNER JOIN members m on l.member_id=m.member_id
                                 LEFT JOIN book_copies bc on l.copy_id=bc.copy_id
                                 LEFT JOIN books b on b.book_id=bc.book_id
                                 LEFT JOIN authors a on a.author_id=b.author_id 
                                 WHERE m.member_id=?
                                 ORDER BY l.loan_date DESC`,[member_id])
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
  [[{count}]]=await db.query(`SELECT COUNT(*) AS count FROM books WHERE book_id=?`,[book_id])
  const bookExist=count>0;
  if (!bookExist) {
    // Return 404 Not Found: The requested book resource does not exist.
    const err=new Error(`Error: Book with ID ${book_id} not found.`)
    err.statusCode=404;
    return next(err)
}
  const [result]=await db.query(`SELECT CONCAT(m.first_name," ",m.last_name) AS member_name,m.member_id,
                                 b.title, a.author_name,l.loan_date,l.return_date,l.due_date,l.copy_id
                                 FROM loans L
                                 INNER JOIN members m ON l.member_id=m.member_id
                                 INNER JOIN book_copies bc ON l.copy_id=bc.copy_id
                                 INNER JOIN books b on b.book_id=bc.book_id
                                 INNER JOIN authors a on a.author_id=b.author_id 
                                 WHERE b.book_id=?
                                 ORDER BY l.loan_date DESC`,[book_id])
if(result.length===0){
  // Return 200 OK with a clear message and a consistent 'history' key (as an empty array).
 return res.status(200).json({
  success:true,
  message:`Book ID ${book_id} exists but, no loans history for this book`,
  count:result.length,
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
   const[overdueLoans]=await db.query(`SELECT l.member_id, CONCAT(m.first_name," ",m.last_name)AS member_name,
                           b.title,a.author_name,l.loan_id,l.loan_date,l.due_date,
                           DATEDIFF(CURRENT_DATE(), l.due_date) AS days_overdue
                           FROM loans l
                           INNER JOIN members m ON l.member_id=m.member_id
                           INNER JOIN book_copies bc on l.copy_id=bc.copy_id
                           INNER JOIN books b on b.book_id=bc.book_id
                           INNER JOIN authors a on a.author_id=b.author_id
                           WHERE return_date IS NULL 
                           AND l.due_date<CURRENT_DATE()
                           ORDER BY l.due_date ASC`)
   if(overdueLoans.length===0){
              return res.status(200).json({
                success:true,
                message:'No loans are currently marked as overdue.',
                history:[]})
     }
   return res.status(200).json({
    success:true,
    count: overdueLoans.length,
    history:overdueLoans
  });
     }
     catch(error){
      next(error)
     }
}
async function getMembersWithOverdues(req,res,next){
try {    
// Query: Join loans, members, and books to count overdue loans per member.
  const [overduemembers] = await db.query(`
  SELECT 
    ANY_VALUE(l.member_id) as member_id,
    CONCAT(m.first_name, " ", m.last_name) AS members,
    COUNT(l.loan_id) AS overdues,
    ANY_VALUE(m.email) as email,
    ANY_VALUE(m.phone_number) as phone_number
  FROM loans l
  INNER JOIN members m ON l.member_id = m.member_id
  WHERE l.return_date IS NULL 
    AND l.due_date < CURDATE()
  GROUP BY m.member_id, m.first_name, m.last_name
  ORDER BY overdues DESC
`);
//wrapping up the result array in history key, object wrapper
if(overduemembers.length===0){
    return res.status(200).json({
      success:true,
      message:'No members are currently have overdues.',
      history:[]})
     }
  return res.status(200).json({
       success:true,
       count: overduemembers.length,
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
            `UPDATE loans l
             INNER JOIN members m ON l.member_id = m.member_id
             SET due_date = date_add(due_date, INTERVAL 14 DAY)
             WHERE loan_id = ?
             AND return_date IS NULL
             AND due_date >= CURRENT_DATE()
             AND m.is_deleted = FALSE`, 
            [loan_id]
        );
//check if our query brings changes to our data
//and rollback if it dont
    if (updateResult.affectedRows === 0) {
            await connection.rollback();
            const err=new Error(`Renewal failed: Loan is either not active, 
                                past its due date, or the ID is invalid, or the member is not active.`)
            err.statusCode=400;
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
      return next(error)
    }
    //retrun this when database connection failed or was never made
const err=new Error('Database connection failed. Unable to process request.')
err.statusCode=503;
return next(err)
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
    renewLoan,
}
