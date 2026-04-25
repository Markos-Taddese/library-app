const bcrypt = require('bcryptjs');
const db =require('../config/database');
const crypto = require('crypto');
require('dotenv').config();
async function resetAdmin() {
  const email = process.argv[2]; 
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.log("Error: Missing arguments.");
    console.log("Usage: node scripts/reset-admin.js <user_email> <new_password>");
    process.exit(1);
  }
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const plainKey = crypto.randomBytes(8).toString('hex'); 
    const hashedKey = await bcrypt.hash(plainKey, 10);
    // This query finds the user by the email, that's going to be provided in the terminal and will force the change.
    const [result] = await db.execute(
      'UPDATE users SET password_hash = ?, role = "admin", recovery_key_hash = ? WHERE email = ?',
      [hashedPassword,hashedKey, email]
    );
if (result.affectedRows > 0) {
      console.log(`SUCCESS: ${email} is now an Admin with the new password.`);
      console.log(` This Your recover key ${plainKey}, Please save your NEW recovery key`)
    } else {
      console.log(`FAILED: No user found with email "${email}".`);
    }

  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
  } finally {
    process.exit();
  }
}

resetAdmin();