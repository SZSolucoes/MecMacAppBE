const express = require('express');
const expressApp = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
const { mysqlCon } = require('./dbsconnect/ConnectFactory');
const httpserver = require('http').createServer(expressApp);
const socketio = require('socket.io')(httpserver);
const rateLimit = require("express-rate-limit");

const limiterGet = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many accounts created from this IP, please try again after an hour",
    onLimitReached: (req, res, options) => console.log('limite get excedido')
});

const sockets = [];

const userRouter = require('./app/routes/UserRouter')(express, mysqlCon, sockets);

socketio.on('connection', socket => {
    sockets.push(socket);
});

expressApp.use(logger('dev'));

expressApp.use(bodyParser.json()); // support json encoded bodies
expressApp.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
expressApp.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Rotas Padrão
expressApp.use('/', limiterGet);
expressApp.get('/', (req, res) => res.send({ message: 'MecMacApp API!' }));
// Rotas via Router
expressApp.use('/user', userRouter);

httpserver.listen(8085, '0.0.0.0', () => {
  console.log('servidor iniciado na porta 8085!');
});
