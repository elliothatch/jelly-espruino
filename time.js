var fetch = require('Fetch');
function getCurrentTime(area, location) {
	var path = `/api/timezone/${area}/${location}`;
	console.log(`GET http://worldtimeapi.org${path}`);
	return fetch({
		host: 'worldtimeapi.org',
		path: path,
		method: 'GET',
		protocol: 'http:'
	}).then(function(response) {
		response.body = JSON.parse(response.body);
		return response;
	});
}

/**
* @param timezoneOffset: number - integer number of hours offset from UTC
* @param area: string - timezone general area (e.g. 'America')
* @param location: string - timezone local location (e.g. 'Denver')
*/
function setLocalTime(timezoneOffset, area, location) {
	E.setTimeZone(timezoneOffset); // Mountain Time
	return getCurrentTime(area, location).then(function(data) {
		setTime(data.body.unixtime);
	});
}

exports = {
	getCurrentTime: getCurrentTime,
	setLocalTime: setLocalTime,
};
