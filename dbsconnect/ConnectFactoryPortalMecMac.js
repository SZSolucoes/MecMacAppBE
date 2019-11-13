const mysql = require('mysql');
const util = require('util');
const { sqlkeysPortalMecMac } = require('../keys/Keys');

const mysqlConnection = () => {
    const con = mysql.createConnection({
        host: sqlkeysPortalMecMac.host,
        user: sqlkeysPortalMecMac.user,
        password: sqlkeysPortalMecMac.password,
        database: sqlkeysPortalMecMac.database,
        multipleStatements: true
    });

    con.query = util.promisify(con.query);

    return con;
};

module.exports = {
    mysqlConPortalMecMac: () => (mysqlConnection())
};
