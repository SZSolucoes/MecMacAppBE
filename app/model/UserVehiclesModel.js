const _ = require('lodash');
const DAO = require('./DAO');

const unique = ['user_email', 'manufacturer', 'model', 'year', 'nickname'];

class UserVehiclesModel extends DAO {
    constructor(sqlCon, sockets) {
        
        super(sqlCon, sockets, 'users_vehicles', unique);

        this.defaultFields = {
            user_email: null,
            manufacturer: null,
            model: null,
            year: null,
            price: null,
            fuel: null,
            fipe_ref: null,
            nickname: null,
            quilometers: null
        };

        this.fields = { ...this.defaultFields };
    }

    validUpdate(params, fieldsEqual = []) {
        try {
            const paramsKeys = Object.keys(params);
            if (fieldsEqual.length) {
                return _.isEqual(paramsKeys, [...unique, ...fieldsEqual]);
            } else {
                return _.includes(paramsKeys, unique);
            }
        } catch (e) {
            return false;
        }
    }
}

module.exports = UserVehiclesModel;
