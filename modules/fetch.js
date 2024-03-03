// This module filename MUST be capitalized to distinguish it from the official 3rd party espruino 'fetch' module
var http = require('http');
/** make an http request and return the results as a promise
* @returns - promise that resolves with {code: number, headers: object, body: string} or rejects with {code: number, message: string}
*/
function fetch(options) {
	return new Promise((resolve, reject) => {
		var body = '';

		var req = http.request(options, function(res) {
			res.on('data', function(data) {
				body += data;
			});
			res.on('close', function(hadError) {
				if(hadError) {
					reject({
						code: res.statusCode,
						headers: res.headers,
						body: body
					});
					return;
				}
				resolve({
					code: res.statusCode,
					headers: res.headers,
					body: body
				});
			});

			res.on('error', reject);
		});

		req.on('error', reject);

		req.end();
	});
}

exports = fetch;
