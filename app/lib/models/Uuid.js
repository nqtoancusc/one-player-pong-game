var Sequelize = require('sequelize')
	, database = require('../database')
	, Session = require('./Session')
	;

var Uuid = database.sequelize.define(
	'Uuid',
	{
		uuid: { type: Sequelize.STRING(32), unique: true }
	}
);

Session.belongsTo(Uuid);
Uuid.hasMany(Session);

module.exports = Uuid;
