const rateLimit = require("express-rate-limit");
const _ = require('lodash');

const DAOUtils = require('../model/DAOUtils');
const UserModel = require('../model/UserModel');
const DeviceModel = require('../model/DeviceModel');
const UserVehiclesModel = require('../model/UserVehiclesModel');
const UserVehiclesManutsModel = require('../model/UserVehiclesManutsModel');

const RoutersUtils = require('./RoutersUtils');

const limiterGet = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many accounts created from this IP, please try again after an hour",
    onLimitReached: (req, res, options) => console.log('limite get excedido')
});

const limiterPost = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many accounts created from this IP, please try again after an hour",
    onLimitReached: (req, res, options) => console.log('limite post excedido')
});

const userRouter = (express, sqlCon, sockets) => {
    const router = express.Router();

    // GET
    router.use('/getUserInfo', limiterGet);
    router.get('/getUserInfo', async (req, res) => {
        const params = req.query;
        const retJson = { success: false, message: '' };

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid) {
            const user = new UserModel(sqlCon, sockets);
            const retInfo = await user.selectSingle();

            if (retInfo.length) {
                retJson.success = true;
                retJson.message = '';
                retJson.userInfo = retInfo[0];
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    router.use('/getUserVehicles', limiterGet);
    router.get('/getUserVehicles', async (req, res) => {
        const params = req.query;
        const retJson = { success: false, message: '' };

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid && params.user_email) {
            const user = new UserVehiclesModel(sqlCon, sockets);
            user.addFilter('user_email', '=', params.user_email)
            const retInfo = await user.select();

            if (retInfo.length) {
                retJson.success = true;
                const mapedUnique = _.orderBy(_.map(retInfo, (item) => ({
                    ...item,
                    uniqueId: `${item.manufacturer}${item.model}${item.year}${item.nickname}`
                })), ['nickname'], ['asc']);
                retJson.data = [...mapedUnique];
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    router.use('/getCheckVehicleExist', limiterGet);
    router.get('/getCheckVehicleExist', async (req, res) => {
        const params = req.query;
        const retJson = { success: false, message: '' };

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid && params.user_email && params.manufacturer && params.year && params.model && params.nickname) {
            const user = new UserVehiclesModel(sqlCon, sockets);
            user.addFilter('user_email', '=', params.user_email, 'AND');
            user.addFilter('manufacturer', '=', params.manufacturer, 'AND');
            user.addFilter('year', '=', params.year, 'AND');
            user.addFilter('model', '=', params.model, 'AND');
            user.addFilter('nickname', '=', params.nickname);

            const retInfo = await user.selectSingle();

            if (retInfo.length) {
                retJson.success = true;
            } else {
                retJson.success = false;
            }
        } else {
            retJson.success = null;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    // POST
    router.use('/postUserInfo', limiterPost);
    router.post('/postUserInfo', async (req, res) => {
        const params = req.body;
        const retJson = { success: false, message: '' };
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid) {
            let retJsonData = null;

            const user = new UserModel(sqlCon, sockets);
            user.setAssocObjFields(params);

            const device = new DeviceModel(sqlCon, sockets);
            device.setAssocObjFields(params);
            device.setDeviceExternalIp(ip);

            retJsonData = await DAOUtils.beginInsertOrUpdateTransaction(sqlCon, [user, device]);

            if (retJsonData) {
                retJson.success = true;
                retJson.message = 'ok';
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    router.use('/postUserVehicles', limiterPost);
    router.post('/postUserVehicles', async (req, res) => {
        const params = req.body;
        const retJson = { success: false, message: '' };

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid) {
            let retJsonData = null;
            const models = [];

            const userVehicle = new UserVehiclesModel(sqlCon, sockets);
            userVehicle.setAssocObjFields(params);

            models.push(userVehicle);

            if (params.manuts && params.manuts instanceof Array && params.manuts.length) {
                for (let indexA = 0; indexA < params.manuts.length; indexA++) {
                    const elementA = params.manuts[indexA];
                    const newParams = {
                        ...params,
                        ...elementA,
                        manuts: null
                    };

                    const userVehicleManut = new UserVehiclesManutsModel(sqlCon, sockets);
                    userVehicleManut.setAssocObjFields(newParams);

                    models.push(userVehicleManut);
                }
            }

            retJsonData = await DAOUtils.beginInsertOrUpdateTransaction(sqlCon, models);

            if (retJsonData) {
                retJson.success = true;
                retJson.message = 'ok';
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    router.use('/updateUserVehicles', limiterPost);
    router.post('/updateUserVehicles', async (req, res) => {
        const params = req.body;
        const retJson = { success: false, message: '' };

        const userVehicleManut = new UserVehiclesModel(sqlCon, sockets);

        const valid = RoutersUtils.checkParamsByToken(params) && userVehicleManut.validUpdate(params, ['quilometers']);

        if (valid) {
            let retJsonData = null;

            userVehicleManut.setAssocObjFields(params);
            retJsonData = await DAOUtils.beginUpdateTransaction(sqlCon, [userVehicleManut]);

            if (retJsonData) {
                retJson.success = true;
                retJson.message = 'ok';
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    router.use('/updateUserVehiclesManut', limiterPost);
    router.post('/updateUserVehiclesManut', async (req, res) => {
        const params = req.body;
        const retJson = { success: false, message: '' };

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid) {
            let retJsonData = null;

            const userVehicleManut = new UserVehiclesManutsModel(sqlCon, sockets);
            userVehicleManut.setAssocObjFields(params);
                
            retJsonData = await DAOUtils.beginUpdateTransaction(sqlCon, [userVehicleManut]);

            if (retJsonData) {
                retJson.success = true;
                retJson.message = 'ok';
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    router.use('/updateUserVehiclesManutBatch', limiterPost);
    router.post('/updateUserVehiclesManutBatch', async (req, res) => {
        const params = req.body;
        const retJson = { success: false, message: '' };

        const valid = RoutersUtils.checkParamsByToken(params);

        if (valid) {
            let retJsonData = null;
            const models = [];
            const validBatch = !!(params && params.batch && params.batch instanceof Array && params.batch.length)

            if (validBatch) {
                for (let index = 0; index < params.batch.length; index++) {
                    const element = params.batch[index];
                    
                    const userVehicleManut = new UserVehiclesManutsModel(sqlCon, sockets);
                    userVehicleManut.setAssocObjFields(element);

                    models.push(userVehicleManut);
                }

                retJsonData = await DAOUtils.beginUpdateTransaction(sqlCon, models);
    
                if (retJsonData) {
                    retJson.success = true;
                    retJson.message = 'ok';
                }
            }
        } else {
            retJson.success = false;
            retJson.message = 'Argumentos inválidos.'
        }

        res.send(retJson);
    });

    return router;
};

module.exports = userRouter;
