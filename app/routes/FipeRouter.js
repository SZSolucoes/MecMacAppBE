const rateLimit = require("express-rate-limit");

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

const fipeRouter = (express) => {
    const router = express.Router();

    router.use('/ConsultarTabelaDeReferencia', limiterGet);
    router.get('/ConsultarTabelaDeReferencia', (req, res) => {
        return axios.post(
            'http://veiculos.fipe.org.br/api/veiculos/ConsultarTabelaDeReferencia', 
            {},
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    Referer: 'http://veiculos.fipe.org.br',
                    Host: 'veiculos.fipe.org.br',
                    Origin: 'veiculos.fipe.org.br'
                }
            }
        )
        .then((axres) => res.send({ success: 'true', data: axres.data }))
        .catch(() => res.send({ success: 'false', data: [] }));
    });
    
    router.use('/ConsultarMarcas', limiterGet);
    router.get('/ConsultarMarcas', (req, res) => {
        return axios.post(
            'http://veiculos.fipe.org.br/api/veiculos/ConsultarMarcas', 
            {
                ...req.query
            },
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    Referer: 'http://veiculos.fipe.org.br',
                    Host: 'veiculos.fipe.org.br',
                    Origin: 'veiculos.fipe.org.br'
                }
            }
        )
        .then((axres) => res.send({ success: 'true', data: axres.data }))
        .catch(() => res.send({ success: 'false', data: [] }));
    });
    
    router.use('/ConsultarModelos', limiterGet);
    router.get('/ConsultarModelos', (req, res) => {
        return axios.post(
            'http://veiculos.fipe.org.br/api/veiculos/ConsultarModelos', 
            {
                ...req.query
            },
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    Referer: 'http://veiculos.fipe.org.br',
                    Host: 'veiculos.fipe.org.br',
                    Origin: 'veiculos.fipe.org.br'
                }
            }
        )
        .then((axres) => res.send({ success: 'true', data: axres.data }))
        .catch(() => res.send({ success: 'false', data: [] }));
    });
    
    router.use('/ConsultarAnoModelo', limiterGet);
    router.get('/ConsultarAnoModelo', (req, res) => {
        return axios.post(
            'http://veiculos.fipe.org.br/api/veiculos/ConsultarAnoModelo', 
            {
                ...req.query
            },
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    Referer: 'http://veiculos.fipe.org.br',
                    Host: 'veiculos.fipe.org.br',
                    Origin: 'veiculos.fipe.org.br'
                }
            }
        )
        .then((axres) => res.send({ success: 'true', data: axres.data }))
        .catch(() => res.send({ success: 'false', data: [] }));
    });
    
    router.use('/ConsultarModelosAtravesDoAno', limiterGet);
    router.get('/ConsultarModelosAtravesDoAno', (req, res) => {
        return axios.post(
            'http://veiculos.fipe.org.br/api/veiculos/ConsultarModelosAtravesDoAno', 
            {
                ...req.query
            },
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    Referer: 'http://veiculos.fipe.org.br',
                    Host: 'veiculos.fipe.org.br',
                    Origin: 'veiculos.fipe.org.br'
                }
            }
        )
        .then((axres) => res.send({ success: 'true', data: axres.data }))
        .catch(() => res.send({ success: 'false', data: [] }));
    });
    
    router.use('/ConsultarValorComTodosParametros', limiterGet);
    router.get('/ConsultarValorComTodosParametros', (req, res) => {
        return axios.post(
            'http://veiculos.fipe.org.br/api/veiculos/ConsultarValorComTodosParametros', 
            {
                ...req.query
            },
            {
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    Referer: 'http://veiculos.fipe.org.br',
                    Host: 'veiculos.fipe.org.br',
                    Origin: 'veiculos.fipe.org.br'
                }
            }
        )
        .then((axres) => res.send({ success: 'true', data: axres.data }))
        .catch(() => res.send({ success: 'false', data: [] }));
    });

    return router;
}

module.exports = fipeRouter;
