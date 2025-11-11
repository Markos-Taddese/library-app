const express=require('express')
// Load environment variables first
require('dotenv').config();
// Require the database connection utility
//the server starts running only when database is connected
const db=require('./config/database')
console.log('--- Environment Check Active. Mode:', process.env.NODE_ENV, '---');
const port=3000
const app=express()
const {notFoundHandler,centralErrorHandler}=require('./middleware/errorHandler')
// --- MIDDLEWARE SETUP ---
// Enable Express to parse incoming JSON request bodies
app.use(express.json())
// A simple route to confirm the API is running successfully.
app.get('/', (req, res) => {
    res.status(200).json({ message: "Library API is running successfully!" });
});
const bookroutes=require('./routes/bookRoutes')
const memberRoutes=require('./routes/memberRoutes')
const loanRoutes=require('./routes/loanRoutes')
// Mount the imported routers to specific base paths
app.use('/books', bookroutes);
app.use('/members',memberRoutes);
app.use('/loans',loanRoutes);
app.use(notFoundHandler);
app.use(centralErrorHandler);
async function startServer(){
try{
    await db.getConnection()
    console.log("Database connected Succesfully")
    app.listen(port,()=>{
    console.log(`server running on port ${port}`)
})
  } 
  catch(error){
    // If the database connection fails, log the error and stop the process (fail fast)
               console.error({message:'database connection failed'},error.message)
    // Exit with a failure code
               process.exit(1)
      }
}
startServer();
