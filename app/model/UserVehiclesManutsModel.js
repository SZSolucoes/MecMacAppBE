const _ = require('lodash');
const DAO = require('./DAO');

const unique = ['user_email', 'manufacturer', 'model', 'year', 'itemabrev', 'quilometers_manut', 'type_manut', 'nickname'];

class UserVehiclesManutsModel extends DAO {
    constructor(sqlCon, sockets) {
        super(sqlCon, sockets, 'users_vehicles_manut', unique);

        this.defaultFields = {
            user_email: null,
            manufacturer: null,
            model: null,
            year: null,
            vehicletype: null,
            itemabrev: null,
            months: null,
            miles: null,
            quilometers_manut: null,
            type_manut: null,
            action: null,
            nickname: null
        };

        this.fields = { ...this.defaultFields };
    }
}

module.exports = UserVehiclesManutsModel;
