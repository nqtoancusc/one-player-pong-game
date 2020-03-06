var _ = require('underscore')
	, Sequelize = require('sequelize')
	, serverConfig = require('../serverConfig')
	;

var models = [
	'Log',
	'Session',
	'Uuid',
	'Player'
];
	
var loadModels = function() {
	_.each(models, function(model) {
		require('./models/' + model);
	});
};

var database = {
		
	sequelize: null,
	
	init: function(callback) {
		var sequelizeOpts = {
			define: {
				freezeTableName: true,
				charset: 'utf8',
				collate: 'utf8_general_ci'
			}
		};
		
		if (!process.env.DEBUG_DB_QUERIES) {
			sequelizeOpts.logging = false;
		}
		
		this.sequelize = new Sequelize(serverConfig.dbUrl, sequelizeOpts);
		loadModels();
		
		this.sequelize
			.sync()
			.success(function() {
				callback();
			});
	}
};

module.exports = database;
