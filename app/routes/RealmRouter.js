const rateLimit = require("express-rate-limit");
const fs = require('fs');
const path = require('path');
const fileName = 'fipe.json';

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

const realmRouter = (express, rootPath) => {
    const router = express.Router();

    router.use('/getManufacturesAndModels', limiterGet);
    router.get('/getManufacturesAndModels', (req, res) => {
        try {
            if (req.query && (typeof req.query.fileVersion === 'number' || typeof req.query.fileVersion === 'string')) {
                const file = fs.readFileSync(path.join(rootPath, fileName));
                if (file) {
                    const fileJson = JSON.parse(file);

                    if (fileJson && fileJson.fileVersion && fileJson.fileVersion.toString() !== req.query.fileVersion.toString()) {
                        res.send({ success: true, data: fileJson });
                        return;
                    }
                }
            }

            res.send({ success: false, data: {} });
        } catch (e) {
            console.log('error read file fipe.json');
            res.send({ success: false, data: {} });
        }
    });
    
    return router;
}

module.exports = realmRouter;
