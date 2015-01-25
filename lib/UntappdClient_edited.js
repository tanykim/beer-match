// ********
// THIS is edited & simplified version of the original code by Glen R. Goodwin.
// Some calls for API are obsolete, so I have to edit.
// Please check the original library at https://www.npmjs.org/package/node-untappd
// ********
//
// Following is the original comment:
//
// UntappdClient v4
//
// By Glen R. Goodwin
// twitter: @areinet

var QS = require('querystring');
var HTTPS = require('https');

var UntappdClient = function(debug) {
	var that = this;
	var id;
	var secret;

	var setClientId = function(clientId) {
		id = clientId;
		return that;
	};
	this.setClientId = setClientId;

	var setClientSecret = function(clientSecret) {
		secret = clientSecret;
		return that;
	};
	this.setClientSecret = setClientSecret;

	var get = function(path, params, callback){
		return req('GET',path,params,null,callback);
	}

	var req = function(method, path, params, data, callback) {
		if (params && params.constructor==='function' && !callback) callback = params, params = {};
		if (!params) params = {};

		var options = {
			host: 'api.untappd.com',
			port: 443,
			path: path,
			method: method
		};

		Object.keys(params).forEach(function(k) {
			if (params[k]===undefined || params[k]===null) delete params[k];
		});

		if (id) params.client_id = id;
		if (secret) params.client_secret = secret;
		if (params) options.path += '?' + QS.stringify(params);
		if (debug) {
			console.log('node-untappd: get : ' + options.path);
			console.log(params);
			console.log(data);
		}

		var request = HTTPS.request(options,function(response){
			response.setEncoding('utf8');
			var data = '';
			response.on('data',function(incoming){
				if (debug) console.log('node-untappd: data: ',incoming.length);
				data += incoming;
			})
			response.on('end',function(incoming){
				if (debug) console.log('node-untappd: end: ',incoming?incoming.length:0);
				data += incoming?incoming:'';
				var obj = JSON.parse(data);
				callback.call(that,null,obj);
			});
			response.on('error',function(){
				if (debug) console.log('node-untappd: error: ',arguments);
				callback.call(that,arguments,null);
			});
		});
		request.on('error',function(){
			if (debug) console.log('node-untappd: error: ',arguments);
			callback.call(that,arguments,null);
		});
		request.end();
		return request;
	};

	// Verify that a connection works

	that.verify = function(callback) {
		if (callback===undefined || callback===null) throw new Error('callback cannot be undefined or null.');
		var request = get('/v4',null,function(response){
			callback.call(that,null,true);
		});
		request.on('error',function(err){
			callback.call(that,err,null);
		});
	};

	// The FEEDS
	that.userFeed = function(callback,lookupUser,limit,max_id) {
		if (lookupUser===undefined || lookupUser===null) throw new Error('lookupUser cannot be undefined or null.');
		if (callback===undefined || callback===null) throw new Error('callback cannot be undefined or null.');
		return get('/v4/user/checkins/'+lookupUser,{
			limit: limit,
			max_id: max_id
		},callback);
	};

	// USER Related Calls
	that.userInfo = function(callback,lookupUser) {
		if (lookupUser===undefined || lookupUser===null) throw new Error('lookupUser cannot be undefined or null.');
		if (callback===undefined || callback===null) throw new Error('callback cannot be undefined or null.');
		return get('/v4/user/info/'+lookupUser,{
		},callback);
	};

	// Friends
	that.userFriends = function(callback,lookupUser,limit,offset) {
		if (lookupUser===undefined || lookupUser===null) throw new Error("lookupUser cannot be undefined or null.");
		if (callback===undefined || callback===null) throw new Error("callback cannot be undefined or null.");
		return get("/v4/user/friends/"+lookupUser,{
			limit: limit,
			offset: offset
		},callback);	
	};
};

module.exports = UntappdClient;

