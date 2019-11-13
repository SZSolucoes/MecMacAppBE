const _ = require('lodash');

class DAO {
    constructor(sqlCon, sockets, table, ogrigatedFields = []) {
        this.sqlCon = sqlCon;
        this.sockets = sockets;
        this.table = table;
        this.ogrigatedFields = ogrigatedFields;
        this.where = [];
    }

    async select(fields = [...Object.keys(this.fields)], setOgrigatedFilter = false) {
        if (setOgrigatedFilter) this.setOgrigatedFilter();

        const con = this.sqlCon();
        let ret = [];
    
        try {
            con.connect();
            let query = 'SELECT ?? FROM ??';
            const values = [fields, this.table];

            if (this.where.length) {
                query += ' WHERE';

                for (let index = 0; index < this.where.length; index++) {
                    const element = this.where[index];

                    query += ` (${element.field} ${element.operator} ?) ${element.condition}`;
                    values.push(element.value);
                }
            }

            const queryRet = await con.query(query, values);
            const isOk = queryRet && queryRet instanceof Array && queryRet.length > 0;

            if (isOk) ret = queryRet;
        } catch (e) {
            console.log(e);
        }
    
        con.end();
        return ret;
    }

    async insert() {
        if (!this.checkObrigatedFields().valid) return false;

        const fields = this.getFieldsSetted();
        const values = _.values(fields);

        const con = this.sqlCon();
        let ret = null;

        try {
            con.connect();
            const queryRet = await con.query('INSERT IGNORE INTO ??(??) VALUES (?)', [this.table, Object.keys(fields), values]);
            const isOk = queryRet && queryRet.insertId;

            if (isOk) ret = queryRet.insertId;
        } catch (e) {
            console.log(e);
        }
    
        con.end();

        return ret;
    }

    async update() {
        if (!this.checkObrigatedFields().valid) return false;

        if (!this.where.length) {
            const retSetOF = this.setOgrigatedFilter();

            if (!retSetOF) return false;
        }

        const fields = this.getFieldsSetted();
        const values = _.values(fields);

        const con = this.sqlCon();
        let ret = false;

        try {
            con.connect();
            let query = 'UPDATE ?? SET ? WHERE';
            const values = [this.table, valuesFields];

            for (let index = 0; index < this.where.length; index++) {
                const element = this.where[index];

                query += ` (${element.field} ${element.operator} ?) ${element.condition}`;
                values.push(element.value);
            }
            
            await con.query(query, values);

            ret = true;
        } catch (e) {
            console.log(e);
        }
    
        con.end();
        return ret;
    }

    async insertByTransaction(con) {
        if (!this.checkObrigatedFields().valid) return false;

        const fields = this.getFieldsSetted();
        const values = _.values(fields);
    
        try {
            await con.query('INSERT IGNORE INTO ??(??) VALUES (?)', [this.table, Object.keys(fields), values]);
            return true;
        } catch (e) {
            console.log(e);
            return false
        }
    }

    async updateByTransaction(con) {
        if (!this.checkObrigatedFields().valid) return false;

        if (!this.where.length) {
            const retSetOF = this.setOgrigatedFilter();

            if (!retSetOF) return false;
        }
        
        const valuesFields = this.getFieldsSetted();
    
        try {
            let query = 'UPDATE ?? SET ? WHERE';
            const values = [this.table, valuesFields];

            for (let index = 0; index < this.where.length; index++) {
                const element = this.where[index];

                query += ` (${element.field} ${element.operator} ?) ${element.condition}`;
                values.push(element.value);
            }
            
            await con.query(query, values);
            return true;
        } catch (e) {
            console.log(e);
            return false
        }
    }

    async selectSingle(fields = [...Object.keys(this.fields)], setOgrigatedFilter = false) {
        if (setOgrigatedFilter) this.setOgrigatedFilter();

        const con = this.sqlCon();
        let ret = [];
    
        try {
            con.connect();
            let query = 'SELECT ?? FROM ??';
            const values = [fields, this.table];

            if (this.where.length) {
                query += ' WHERE';

                for (let index = 0; index < this.where.length; index++) {
                    const element = this.where[index];

                    query += ` (${element.field} ${element.operator} ?) ${element.condition}`;
                    values.push(element.value);
                }
            }

            query += ' LIMIT 1';

            const queryRet = await con.query(query, values);
            const isOk = queryRet && queryRet instanceof Array && queryRet.length > 0;

            if (isOk) ret = queryRet;
        } catch (e) {
            console.log(e);
        }
    
        con.end();
        return ret;
    }

    setAssocObjFields(newFieldsObj = {}) {
        this.clearToDefaultFields();

        _.assign(this.fields, _.pick(newFieldsObj, _.keys(this.fields)));
    }

    addFilter(field, operator, value, condition = '') {
        if (!this.fields.hasOwnProperty(field)) return false;
        if (!operator) return false;
        if (!value && value !== null) return false;

        this.where.push({ field, operator, value, condition });
    }

    checkObrigatedFields() {
        let ret = { valid: true, field: '' };
        
        if (this.ogrigatedFields.length) {
            for (let index = 0; index < this.ogrigatedFields.length; index++) {
                const element = this.ogrigatedFields[index];

                if (!this.fields[element]) return { valid: false, field: element };
            }
        }

        return ret;
    }

    async checkNecessaryUpdate() {
        let ret = true;
        
        ret = this.setFieldsAsFilter();
        if (!ret) {
            this.clearWhere();
            return true;
        } 

        ret = await this.selectSingle(['id']);

        this.clearWhere();

        // Se existe um igual entao retorna false devido a nao ter necessidade de update
        if (ret.length) return false;

        return ret;
    }

    clearToDefaultFields() {
        this.fields = { ...this.defaultFields };
    }

    getFieldsSetted() {
        return _.pickBy(this.fields, _.identity);
    }

    setOgrigatedFilter() {
        const fildsSetted = _.pickBy(this.fields, (value, key) => this.ogrigatedFields.includes(key));
        if (!Object.keys(fildsSetted).length) return false;

        const arValues = _.map(fildsSetted, (value, key) => ({ key, value }));

        this.clearWhere();

        for (let index = 0; index < arValues.length; index++) {
            const element = arValues[index];

            this.addFilter(element.key, '=', element.value, ((index + 1) === arValues.length) ? '' : 'AND');
        }

        return true;
    }

    setFieldsAsFilter() {
        const fildsSetted = _.pickBy(this.fields, _.identity);
        if (!Object.keys(fildsSetted).length) return false;

        const arValues = _.map(fildsSetted, (value, key) => ({ key, value }));

        this.clearWhere();

        for (let index = 0; index < arValues.length; index++) {
            const element = arValues[index];

            this.addFilter(element.key, '=', element.value, ((index + 1) === arValues.length) ? '' : 'AND');
        }

        return true;
    }

    clearWhere() {
        this.where = [];
    }
}

module.exports = DAO;
