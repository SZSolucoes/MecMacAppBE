const rateLimit = require("express-rate-limit");

const DAOUtils = require('../model/DAOUtils');
const UserModel = require('../model/UserModel');
const DeviceModel = require('../model/DeviceModel');

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

    return router;
};

module.exports = userRouter;
