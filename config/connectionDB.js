const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'tomanhht123',
  database: 'chatapp',
});

connection.connect((err) => {
  if (!err) {
    console.log('connected');
  } else {
    console.log('connection fail');
  }
});

module.exports = connection;
