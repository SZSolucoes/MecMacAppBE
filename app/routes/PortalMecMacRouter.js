const rateLimit = require("express-rate-limit");
const _ = require("lodash");

const limiterGet = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many accounts created from this IP, please try again after an hour",
    onLimitReached: (req, res, options) => console.log('limite get excedido')
});

/* const limiterPost = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many accounts created from this IP, please try again after an hour",
    onLimitReached: (req, res, options) => console.log('limite post excedido')
}); */

const portalMecMacRouter = (express, mysqlConPortalMecMac, mysqlConMecMacApp) => {
    const router = express.Router();

    router.use('/getManut', limiterGet);
    router.get('/getManut', (req, res) => {
        try {
            const params = req.query;

            if (!params) {
                res.send({ success: false, message: "parâmetros inválidos", data: {} });
                return;
            }

            const { manufacturer, model, year, quilometers, type, nickname, user_email } = params;
            const validParams = (manufacturer && model && year && quilometers && type);

            if (!validParams) {
                res.send({ success: false, message: "parâmetros inválidos", data: {} });
                return;
            }

            if (type === 'all_merged' && !(nickname && user_email)) {
                res.send({ success: false, message: "parâmetros inválidos", data: {} });
                return;
            }

            const con = mysqlConPortalMecMac();
            
            let queryProx = '';
            let queryAtras = '';
            let queryManutsApp = '';
            let fullquery = '';
            
            const fieldsProx = 'itemabrev, mes, milhas, tipomanut, MIN(CASE WHEN quilometros = 0 THEN milhas * 1.609 ELSE quilometros END) quilometros';
            queryProx = `SELECT ${fieldsProx} FROM manutencao `;
            queryProx += 'INNER JOIN itemmanutencao ON manutencao.iditemmanut = itemmanutencao.id '
            queryProx += `WHERE (milhas > 0 OR quilometros > 0) `;
            queryProx += `AND manutencao.idcar LIKE ${con.escape(`%${manufacturer}|%`)} `;
            queryProx += `AND manutencao.idcar LIKE ${con.escape(`%|${model}|%`)} `;
            queryProx += `AND manutencao.idcar LIKE ${con.escape(`%|${year}%`)} `;
            queryProx += `AND quilometros >= ${con.escape(quilometers)} `;
            queryProx += `GROUP BY itemabrev `;
            queryProx += 'ORDER BY quilometros ASC';
            queryProx += ';';

            const fieldsAtras = 'itemabrev, mes, milhas, tipomanut, (CASE WHEN quilometros = 0 THEN milhas * 1.609 ELSE quilometros END) quilometros';
            queryAtras = `SELECT ${fieldsAtras} FROM manutencao `;
            queryAtras += 'INNER JOIN itemmanutencao ON manutencao.iditemmanut = itemmanutencao.id '
            queryAtras += `WHERE (milhas > 0 OR quilometros > 0) `;
            queryAtras += `AND manutencao.idcar LIKE ${con.escape(`%${manufacturer}|%`)} `;
            queryAtras += `AND manutencao.idcar LIKE ${con.escape(`%|${model}|%`)} `;
            queryAtras += `AND manutencao.idcar LIKE ${con.escape(`%|${year}%`)} `;
            queryAtras += `AND quilometros < ${con.escape(quilometers)} `;
            queryAtras += 'ORDER BY itemabrev, quilometros DESC';
            queryAtras += ';';

            const fieldsManutsApp = 'itemabrev, type_manut, (CASE WHEN quilometers_manut = 0 THEN miles * 1.609 ELSE quilometers_manut END) quilometers_manut, action';
            queryManutsApp = `SELECT ${fieldsManutsApp} FROM users_vehicles_manut `;
            queryManutsApp += 'WHERE user_email = ? ';
            queryManutsApp += 'AND manufacturer = ? ';
            queryManutsApp += 'AND model = ? ';
            queryManutsApp += 'AND year = ? ';
            queryManutsApp += 'AND nickname = ? ';
            queryManutsApp += 'AND (action = 1 OR action = 2)';
            queryManutsApp += ';';

            if (type === 'all' || type === 'all_merged') {
                fullquery = queryProx + queryAtras;
            } else if (type === 'prox') {
                fullquery = queryProx;
            } else if (type === 'atras') {
                fullquery = queryAtras;
            }

            try {
                con.connect();
                con.query(fullquery, [], (error, results, fields) => {
                    if (!error) {
                        if (type === 'all_merged') {
                            const conB = mysqlConMecMacApp();

                            try {
                                conB.connect();
                                conB.query(queryManutsApp, [user_email, manufacturer, model, year, nickname], (error, resultsB, fields) => {
                                    if (!error) {
                                        let atrasResults = [...results[1]];
                                        const confirmResults = [];

                                        atrasResults = _.filter(atrasResults, (itemf) => {
                                            const indexFounded = _.findIndex(resultsB, (ith) => {
                                                return (
                                                    itemf.itemabrev === ith.itemabrev &&
                                                    itemf.quilometros === ith.quilometers_manut &&
                                                    itemf.tipomanut === ith.type_manut
                                                );
                                            });

                                            const validExist = indexFounded !== -1;

                                            if (validExist) confirmResults.push({ ...itemf, action: resultsB[indexFounded].action });

                                            return !validExist;
                                        });

                                        res.send({ success: true, data: { prox: [...results[0]], atras: atrasResults, confirm: confirmResults } });
                                    } else {
                                        res.send({ success: false, data: JSON.stringify(error) });
                                    }
                                });
                            } catch (e) {
                                console.log('manutenções não localizadas');
                                console.log(e);
                                res.send({ success: false, data: {} });
                            }

                            conB.end();
                        } else if (type === 'all') {
                            res.send({ success: true, data: { prox: [...results[0]], atras: [...results[1]] } });
                        } else {
                            res.send({ success: true, data: [...results] });
                        }
                    } else {
                        res.send({ success: false, data: JSON.stringify(error) });
                    }
                });
            } catch (e) {
                console.log('manutenções não localizadas');
                console.log(e);
                res.send({ success: false, data: {} });
            }

            con.end();
        } catch (e) {
            console.log('manutenções não localizadas');
            console.log(e);
            res.send({ success: false, data: {} });
        }
    });

    return router;
}

module.exports = portalMecMacRouter;
