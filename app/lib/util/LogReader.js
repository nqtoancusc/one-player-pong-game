/* jshint -W109 */
var sequelize = require('../database').sequelize
	;

function getRemoteOrigins() {
	var that = this;
	var data = {};
	var sql =	"select data, count(data) as count " +
				"from Log where " +
				"eventGroup = 'remote' and " +
				"eventType = 'origin' " +
				"group by data " +
				"with rollup";
	sequelize
		.query(sql, null, { raw: true })
		.success(function(results) {
			results.forEach(function(row) {
				// If row.data is null, it's the rollup total (mysql) 
				var key = row.data || 'TOTAL';
				data[key] = row.count;
			});
			that.storeDataAndRespond(data);
		});
}

function getUserSessions() {
	var that = this;
	var data = {
		uniques: 0,
		sessions: 0,
		views: 0
	};
	var sql =	"select " +
				"u.id as uid, count(distinct u.id) as uidCount, " +
				"s.id as sid, count(distinct s.id) as sessionCount, " +
				"l.eventType as ready, count(l.eventType) as readyCount " +
				"from Log l " +
				"left join Session s on (l.SessionId = s.id) " +
				"left join Uuid u on (s.UuidId = u.id) " +
				"where l.eventGroup = 'remote' and l.eventType = 'ready' " +
				"group by uid, sid, ready " +
				"with rollup";
	sequelize
		.query(sql, null, { raw: true })
		.success(function(results) {
			var row = results.pop();
			data.uniques = row.uidCount;
			data.sessions = row.sessionCount;
			data.views = row.readyCount;
			that.storeDataAndRespond(data);
		});
}


module.exports = {
	getRemoteOrigins: getRemoteOrigins,
	getUserSessions: getUserSessions
};