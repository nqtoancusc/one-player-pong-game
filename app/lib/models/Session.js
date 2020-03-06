var Sequelize = require('sequelize')
	, database = require('../database')
	, Log = require('./Log')
	;

var Session = database.sequelize.define(
	'Session',
	{
		token		: { type: Sequelize.STRING, unique: true },
		userAgent	: Sequelize.STRING(1023),
		remoteIp	: Sequelize.STRING
	}
);

Log.belongsTo(Session);
Session.hasMany(Log);

module.exports = Session;
