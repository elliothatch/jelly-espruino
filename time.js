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
	// E.setTimeZone(timezoneOffset);
	// use Utah DST configuration
	E.setDST(
		60,                // dstOffset (minutes added during DST)
		timezoneOffset*60, // timezone (minutes)
		1,                 // startDowNumber (1 = second week of the month)
		0,                 // startDow (0 = sunday)
		2,                 // startMonth (2 = march)
		0,                 // startDayOffset
		120,                // startTimeOfDay (minutes, 2:00am)
		0,                 // endDowNumber (0 = first week of the month)
		0,                 // endDow (0 = sunday)
		10,                // endMonth (10 = november)
		0,                 // endDayOffset
		120                 // endTimeOfDay (minutes, 2:00am)
	);
	return getCurrentTime(area, location).then(function(data) {
		setTime(data.body.unixtime);
	});
}

exports = {
	getCurrentTime: getCurrentTime,
	setLocalTime: setLocalTime,
};
