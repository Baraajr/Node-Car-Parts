const mongoose = require('mongoose');
require('dotenv').config();

const connectDb = () =>
  mongoose
    .connect(process.env.DATABASE)
    .then((conn) =>
      console.log(
        `database connected successfully on host: ${conn.connection.host}`,
      ),
    );

module.exports = connectDb;
