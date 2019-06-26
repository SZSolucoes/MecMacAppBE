const _ = require('lodash');
const DAO = require('./DAO');

class UserModel extends DAO {
    constructor(sqlCon, sockets) {
        super(sqlCon, sockets, 'users', ['user_email']);

        this.defaultFields = {
            user_name: null,
            user_email: null,
            user_profile_url: null,
            user_fb_id: null,
            user_google_id: null
        };

        this.fields = { ...this.defaultFields };
    }
}

module.exports = UserModel;
