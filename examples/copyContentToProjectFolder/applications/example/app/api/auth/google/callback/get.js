module.exports = function(client, callback) {
	client.passport.init(function () {
		client.passport.strategies.google.authenticateCallback(client.req, client.res, callback);
	}, callback);
};