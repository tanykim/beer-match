//dependencies
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var _ = require('underscore');
var fs = require('fs');
var geocoder = require('geocoder');
var nconf = require('nconf');
var timezoner = require('timezoner');

//run server
server.listen(8080);
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
	console.log('server started--');
    res.sendFile(__dirname + '/index.html');
});
app.get('/:userId', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

//untapped api
var UntappdClient = require('./lib/UntappdClient_edited.js');
var debug = false;
var untappd = new UntappdClient(debug);
nconf.argv().env().file({ file: 'settings.json'});
var credentials = {
	clientId: nconf.get('clientId'),
	clientSecret: nconf.get('clientSecret')
};
untappd.setClientId(credentials.clientId);
untappd.setClientSecret(credentials.clientSecret);

//emit profile
function emitProfile(userinfo, timezone) {
	io.emit('profile', {
		userinfo: userinfo,
		timezone: timezone
	});
}

function getTimezone(user) {

	var userinfo = {
		userId: user.user_name.toLowerCase(),
		address: user.location,
		avatar: user.user_avatar,
		username: user.first_name + ' ' + user.last_name,
		since: user.date_joined,
		beerCount: user.stats.total_beers,
		checkinCount: user.stats.total_checkins
	};

	geocoder.geocode(userinfo.address, function (err, data) {
		if (err) {
			console.log('geocoding error');
			emitProfile(userinfo, '');
		} else {
			console.log(data.results[0].geometry.location);
			location = data.results[0].geometry.location;
			timezoner.getTimeZone(
			    location.lat, location.lng,
			    function (err, data) {
			        if (err) {
			            console.log(err);
			            emitProfile(userinfo, '');
			        } else {
			            console.log(data);
			            emitProfile(userinfo, {
			            	name: data.timeZoneName,
			            	offset: data.rawOffset
			            });
			        }
			    }
			);
	    }
	});
}

function getUserFeed(id, data) {

	// var userId = data.userId;
	var userinfo = data.userinfo;
	var userId = userinfo.userId;
	console.log('userid----', userId);
	var checkins = [];

	//max 50 feeds per call
	var apiCallsNeeded = Math.ceil(userinfo.checkinCount / 50);
	var apiCallCount = 0;

	function callUserFeedAPI(id) {

		untappd.userFeed(function (err,obj){
			if (debug) console.log(err,obj);
			if (obj && obj.response && obj.response.checkins && obj.response.checkins.items) {
				checkins.push(obj.response.checkins.items);
				if (obj.response.pagination.max_id) {
					//consold log print twice
					console.log('feed api call---', id);
					apiCallCount = apiCallCount + 1;
					io.emit('progress', { total: apiCallsNeeded, count: apiCallCount });
					callUserFeedAPI(obj.response.pagination.max_id);
					prevId = obj.response.pagination.max_id;
				} else {
					var all = { userinfo: userinfo, timezone: data.name, checkins: _.flatten(checkins) };
					fs.writeFileSync('public/users/' + userId + '.json', JSON.stringify(all));
					console.log('---file written');
					io.emit('success', { userId: userId, data: all });
				}
			}
			else {
				console.log('-----error at feed api', err, obj, obj.meta.code);
				io.emit('error', { error_detail: obj.meta.error_detail });
			}
		}, userId, 50, id);
	}

	callUserFeedAPI();
}

function getUserInfo(userId) {

	//file check first
	if (fs.existsSync('public/users/' + userId + '.json')) {
    	console.log('---file exists');
    	io.emit('dataExist', { userId: userId });
	} else {
		untappd.userInfo(function (err,obj) {
			if (obj && obj.response && obj.response.user) {
				if (obj.response.user.is_private) {
					console.log('--private id');
					io.emit('error', { error_detail: userId.toUpperCase() + ' is a private account.' });
				} else if (obj.response.user.stats.total_checkins === 0) {
					io.emit('error', { error_detail: 'No check-in data available.' });
				} else {
					//get timezone infromation & emit
					console.log ('--id found, get timezone info now');
					getTimezone(obj.response.user);
				}
			}
			else {
				console.log('--------error at userinfo api', err, obj.meta.code);
				io.emit('error', { error_detail: obj.meta.error_detail });
			}
		}, userId);
	}
}

io.on('connection', function (socket) {
	socket.on('userId', function (data) {
		console.log(data);
		//two users comparison
        // if (data.userId.indexOf('-') === -1) {
        // 	data.userId.toLowerCase()
        //     socket.emit('userId', { userId: userId });
        // }
        // //one user
        // else {

    	getUserInfo(data.userId.toLowerCase());
  	});
  	socket.on('timezone', function (data) {
  		console.log(data);
  		getUserFeed(undefined, data);
  	})
  	socket.on('signout', function (data) {
  		console.log('singout---', data);
  		//do actions
  		io.emit('signout', { userId: data.userId });
  	})
});