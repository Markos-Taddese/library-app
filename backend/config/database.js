const mysql=require('mysql2')
const fs = require('fs');
require('dotenv').config({path:'../.env'});
// We use createPool (instead of createConnection) to efficiently manage multiple
// simultaneous connections. This prevents resource exhaustion and improves
// performance for an application handling many concurrent API requests.
const pool=mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_DATABASE,
    ssl: {
        // connecting to TiDB Cloud,must use the server's certificate.
        //set rejectUnauthorized to true to verify the server's identity.
        rejectUnauthorized: true, 
    },
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,// Max number of simultaneous connections allowed
    waitForConnections:true,// Queue requests if the limit is reached
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 10// Max number of requests allowed in the queue
});
// Export the promise-wrapped pool for use in controller functions (db.query())
module.exports=pool.promise()