const { Pool } = require("pg")
require("dotenv").config();

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password:process.env.DB_PASSWORD,
    database:process.env.DBNAME,
    port: process.env.DBPORT
})
// console.log("DB PASSWORD TYPE:", typeof process.env.DB_PASSWORD);
// console.log("DB PASSWORD VALUE:", process.env.DB_PASSWORD);
// console.log("DB NAME TYPE:", typeof process.env.DBNAME); 
// console.log("DB PORT VALUE:", process.env.DBPORT);
module.exports = pool;