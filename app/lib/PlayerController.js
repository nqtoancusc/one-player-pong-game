var winston           = require('winston')
	, database = require('./database')
    , playerModel      = require('./models/Player')
	;

function PlayerController() {

}

PlayerController.prototype.add = function(email, name, phone, firstanswer, secondanswer) {
	var item = playerModel.build({
		email:email,
		name:name,
		phone:phone,
		firstanswer: firstanswer,
		secondanswer: secondanswer
	});

	//Inserting Data into database
	item.save().complete(function (err) {
		if (err) {
			winston.info('Error while inserting player information');
		} else {
			winston.info('New player has just been inserted successfully');
		}
	});
}

PlayerController.prototype.updateScores = function(homescore, awayscore) {
	database.sequelize.query("SELECT MAX(id) as maxid FROM Player").success(function(foundRecord) {
		if (foundRecord && foundRecord.length > 0) {
			if (foundRecord[0].maxid) {
				database.sequelize.query("UPDATE Player SET homescore = " + homescore + ", awayscore = " + awayscore + 
					" WHERE id = " + foundRecord[0].maxid)
				.success(function(topPlayers) {
					winston.info('Score updated');
				});
			}
		}
	});
}

module.exports = new PlayerController();