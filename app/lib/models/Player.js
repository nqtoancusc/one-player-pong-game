var Sequelize = require('sequelize')
	, winston = require('winston')
	, database = require('../database')
	;

var Player = database.sequelize.define(
	'Player',
	{
		email	    : Sequelize.STRING,
		name	    : Sequelize.STRING,
		phone	    : Sequelize.STRING,
		firstanswer	: Sequelize.STRING,
		secondanswer: Sequelize.STRING,
		homescore   : Sequelize.INTEGER,
		awayscore   : Sequelize.INTEGER
	}
);

module.exports = Player;
