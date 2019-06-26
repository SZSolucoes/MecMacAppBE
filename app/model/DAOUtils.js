const { masterApiToken } = require('../../keys/Keys');

class DAOUtils {
    static async beginInsertTransaction(sqlCon, modelsToInsert = []) {
        let ret = true;

        if (sqlCon && modelsToInsert.length) {
            const con = sqlCon();
            let transRet = false;

            try {
                con.connect();

                ret = await new Promise((resolve) => con.beginTransaction(async (err) => {
                    try {
                        for (let index = 0; index < modelsToInsert.length; index++) {
                            const element = modelsToInsert[index];
                            
                            transRet = await element.insertByTransaction(con);
    
                            if (!transRet) {
                                resolve(false);
                            }
                        }
    
                        transRet = DAOUtils.commit(con);
    
                        resolve(transRet);
                    } catch (e) {
                        con.rollback();
                        resolve(false);
                    }
                }));

                con.end();
            } catch (e) {
                console.log(e);
                con.end();
            }
        }

        return ret;
    }

    static async beginUpdateTransaction(sqlCon, modelsToInsert = []) {
        let ret = true;

        if (sqlCon && modelsToInsert.length) {
            const con = sqlCon();
            let transRet = false;

            try {
                con.connect();

                ret = await new Promise((resolve) => con.beginTransaction(async (err) => {
                    try {
                        for (let index = 0; index < modelsToInsert.length; index++) {
                            const element = modelsToInsert[index];
                            
                            transRet = await element.updateByTransaction(con);
    
                            if (!transRet) {
                                resolve(false);
                            }
                        }
    
                        transRet = DAOUtils.commit(con);
    
                        resolve(transRet);
                    } catch (e) {
                        con.rollback();
                        resolve(false);
                    }
                }));

                con.end();
            } catch (e) {
                console.log(e);
                con.end();
            }
        }

        return ret;
    }

    static async beginInsertOrUpdateTransaction(sqlCon, modelsToInsert = []) {
        let ret = true;

        if (sqlCon && modelsToInsert.length) {
            const con = sqlCon();
            let transRet = false;

            try {
                con.connect();

                ret = await new Promise((resolve) => con.beginTransaction(async (err) => {
                    try {
                        for (let index = 0; index < modelsToInsert.length; index++) {
                            const element = modelsToInsert[index];
                            
                            const isInsert = await element.selectSingle(['id'], true);

                            console.log(isInsert);

                            if (isInsert.length === 0) {
                                transRet = await element.insertByTransaction(con);
                            } else {
                                transRet = await element.updateByTransaction(con);
                            }
    
                            if (!transRet) {
                                resolve(false);
                                return false;
                            }
                        }
    
                        transRet = await DAOUtils.commit(con);
    
                        resolve(transRet);
                    } catch (e) {
                        console.log(e);
                        resolve(false);
                    }
                }));

                con.end();
            } catch (e) {
                console.log(e);
                con.end();
            }
        }

        return ret;
    }

    static async commit(con) {
        // Realiza o commit
        try {
            const ret = await new Promise((resolve) => {
                try {
                    con.commit((err) => {
                        if (err) {
                            con.rollback();
                            resolve(false);
                        }
                        
                        resolve(true);
                    })
                } catch (e) {
                    console.log(e);
                    resolve(false);
                }
            });

            return ret;
        } catch (e) {
            con.rollback();
            console.log(e);
            return false;
        }
    }
}

module.exports = DAOUtils;
