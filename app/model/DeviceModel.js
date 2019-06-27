const _ = require('lodash');
const DAO = require('./DAO');

class DeviceModel extends DAO {
    constructor(sqlCon, sockets) {
        super(sqlCon, sockets, 'devices', ['device_uniqueid']);

        this.defaultFields = {
            device_user_name: null,
            device_user_email: null,
            device_uniqueid: null,
            device_name: null,
            device_os: null,
            device_os_version: null,
            device_brand: null,
            device_buildnumber: null,
            device_carrier: null,
            device_locale_wire: null,
            device_deviceid: null,
            device_locale_os: null,
            device_locale_preferred: null,
            device_firstinstall: null,
            device_last_local_ip: null,
            device_last_external_ip: null,
            device_lastupdate_app: null,
            device_manufacturer: null,
            device_timezone: null,
            device_is_emulator: null,
            device_type: null
        };

        this.fields = { ...this.defaultFields };
    }

    setDeviceExternalIp(ip) {
        this.fields.device_last_external_ip = ip;
    }
}

module.exports = DeviceModel;
