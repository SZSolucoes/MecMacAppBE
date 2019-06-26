var mysql = require('mysql');
const util = require('util');
const { sqlkeys } = require('../keys/Keys');

const mysqlConnection = () => {
    const con = mysql.createConnection({
        host     : sqlkeys.host,
        user     : sqlkeys.user,
        password : sqlkeys.password,
        database : sqlkeys.database
    });

    con.query = util.promisify(con.query);

    return con;
};

module.exports = {
    mysqlCon: () => (mysqlConnection())
};
