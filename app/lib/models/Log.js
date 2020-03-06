var Sequelize = require('sequelize')
	, database = require('../database')
	;

var Log = database.sequelize.define(
	'Log',
	{
		eventGroup	: Sequelize.STRING,
		eventType	: Sequelize.STRING,
		data		: Sequelize.TEXT
	}
);

module.exports = Log;
