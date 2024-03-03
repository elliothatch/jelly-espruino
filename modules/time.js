var fetch = require('fetch.js');
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
* @param dstParameters: array - an array with 12 values, containing the Espruino daylight savings time parameters. See https://www.espruino.com/Reference#l_E_setDST
*/
function setLocalTime(timezoneOffset, area, location, dstParameters) {
	// E.setTimeZone(timezoneOffset);
	// use Utah DST configuration
	E.setDST(
		dstParameters[0], // dstOffset (minutes added during DST)
		dstParameters[1], // timezone (minutes)
		dstParameters[2], // startDowNumber (1 = second week of the month)
		dstParameters[3], // startDow (0 = sunday)
		dstParameters[4], // startMonth (2 = march)
		dstParameters[5], // startDayOffset
		dstParameters[6],  // startTimeOfDay (minutes, 2:00am)
		dstParameters[7], // endDowNumber (0 = first week of the month)
		dstParameters[8], // endDow (0 = sunday)
		dstParameters[9], // endMonth (10 = november)
		dstParameters[10], // endDayOffset
		dstParameters[11]  // endTimeOfDay (minutes, 2:00am)
	);
	return getCurrentTime(area, location).then(function(data) {
		setTime(data.body.unixtime);
	});
}

exports = {
	getCurrentTime: getCurrentTime,
	setLocalTime: setLocalTime,
};
