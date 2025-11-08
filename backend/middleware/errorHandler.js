const centralErrorHandler=(err,req,res,next)=>{
   // Determine Status Code: Use one set by thrown error, or default to 500
    let statusCode=err.statusCode||err.status||500 //err.status for general/inclusiv error handling
    // Use the fallback message only when the err.message is null/undefined, 
    // to guarantee 'message' is a string
    // this will prevent sending null/undefined to the message field.
    let message=err.message|| 'An unexpected Internal server error occured'
    
     //  Map MySQL Error Codes
    if(err.code && err.code.startWith('ER_DUP_ENTRY')){
        statusCode=409;
        message='Data conflict: A record with this unique key already exists.'
    }
    else if (err.code && err.code.startsWith('ER_ROW_IS_REFERENCED')){
        statusCode=409;
        message = 'Data conflict: A record with this unique key already exists.';
    }
 //Overwrite potentially sensitive err.message to prevent exposing internal server details.
    else if(statusCode===500){
        message = 'An unexpected server error occurred.';
    }
   
    res.status(statusCode).json({
        success: false, // Indicates the request failed, regardless of the status code
        message: message,
        // Hide stack trace in production for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
}

const notFoundHandler=(req,res,next)=>{
    // Create an error object for any unhandled route.
    const error=new Error(`Not Found- ${req.originalUrl}`)
    error.statusCode=404;
    // Pass the labeled error to the centralErrorHandler
    next(error)
}
module.exports={
    centralErrorHandler,
    notFoundHandler
}