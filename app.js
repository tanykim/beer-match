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
var port = process.env.PORT || 8080;
server.listen(port);
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

//data processing
var User = require('./lib/BeerMatch-user.js');

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
		checkinCount: user.stats.total_checkins,
		friendCount: user.stats.total_friends
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
			            	name: data.timeZoneId,
			            	offset: data.rawOffset
			            });
			        }
			    }
			);
	    }
	});
}

function createSingleData(data) {

	//FOR TEST: temporarily save raw data
	fs.writeFileSync('public/users/raw/' + data.userinfo.userId + '.json', JSON.stringify(data));

    function createBeerData(data, callback) {
        var user = new User(data.userinfo, data.timezone, data.checkins);
        callback(user);
    }
    createBeerData(data, function (u) {
		fs.writeFileSync('public/users/' + data.userinfo.userId + '.json', JSON.stringify(u));
		//console.log('---file written');
		io.emit('success', { data: u });
    });
}

function getUserFeed(id, data) {

	var userinfo = data.userinfo;
	var userId = userinfo.userId;
	//console.log('userid----', userId);
	var checkins = [];

	//max 50 feeds per call
	var feedCallsNeeded = Math.ceil(userinfo.checkinCount / 50);
	var feedCallCount = 0;

	function callUserFeedAPI(id) {

		untappd.userFeed(function (err,obj){
			if (debug) console.log(err,obj);
			if (obj && obj.response && obj.response.checkins && obj.response.checkins.items) {
				checkins.push(obj.response.checkins.items);
				if (obj.response.pagination.max_id) {
					//FIXME: often called twice
					//console.log('feed api call---', id);
					feedCallCount = feedCallCount + 1;
					io.emit('progress', { total: feedCallsNeeded, count: feedCallCount });
					callUserFeedAPI(obj.response.pagination.max_id);
				} else {
					var all = { userinfo: userinfo, timezone: data.name, checkins: _.flatten(checkins) };
					createSingleData(all);
				}
			}
			else {
				//console.log('-----error at feed api', err, obj, obj.meta.code);
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

    	//FOR TEST
    	io.emit('dataExist', { userId: userId });

    	//FOR REAL
  		//var data = JSON.parse(fs.readFileSync('public/users/' + userId + '.json', 'utf8'));
		// io.emit('success', { data: data });

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
					//console.log ('--id found, get timezone info now');
					getTimezone(obj.response.user);
				}
			}
			else {
				//console.log('--------error at userinfo api', err, obj.meta.code);
				io.emit('error', { error_detail: obj.meta.error_detail });
			}
		}, userId);
	}
}

function getFriendsList(userId, count) {

	//console.log('----friends', userId, count);

	//max 25 feeds per call, upto 100 friends
	var friendCallsNeeded = _.isUndefined(count) ? 100 : Math.min(count, 100);
	var friendCallCount = 0;

	var friends = [];

	//FIXME: save friends in the data, update the data
	function callFriendsFeedAPI(offset) {
	  	untappd.userFriends(function (err,obj) {
	  		if (obj && obj.response && obj.response.items && obj.response.count > 0) {
				var fList = _.map(obj.response.items, function (d) {
					return d.user.user_name.toLowerCase();
				});
				friends.push(fList);
				friendCallCount = friendCallCount + 25;
				if (friendCallCount < friendCallsNeeded) {
					//console.log('----', offset);
					callFriendsFeedAPI(friendCallCount);
				}
				else {
					//console.log('---friends loading done');
					io.emit('friends', { friends: _.flatten(friends).sort() });
				}
			}
		}, userId, 25, offset);
	}
	callFriendsFeedAPI();
}

function checkFileExists(users) {
	var u0 = fs.existsSync('public/users/' + users[0] + '.json') ? true : false;
	var u1 = fs.existsSync('public/users/' + users[1] + '.json') ? true : false;
	if (u0 && u1) {
		//console.log('---both file exist');
		io.emit('pairDataExist', { users: users });
	} else {
		io.emit('error', { error_detail: 'No previous data exist. Please restart.' });
	}
}

io.on('connection', function (socket) {

	//FOR TEST
	socket.on('dataset', function (data) {
		//console.log('data generating mode---', data.userId);
		var d = JSON.parse(fs.readFileSync('public/users/raw/' + data.userId + '.json', 'utf8'));
		//console.log(d.userinfo.userId);
		createSingleData(d);
  	});

	socket.on('userId', function (data) {
		//console.log('userId---', data);
    	getUserInfo(data.userId.toLowerCase());
  	});
  	socket.on('pair', function (data) {
  		//console.log('pair---', data);
  		checkFileExists(data.users);
  	});
  	socket.on('timezone', function (data) {
  		//console.log('timezone---', data);
  		getUserFeed(undefined, data);
  	});
  	socket.on('friends', function (data) {
  		//console.log('friends---', data);
  		getFriendsList(data.userId.toLowerCase(), data.count);
  	});
  	socket.on('signout', function (data) {
  		//console.log('singout---', data);
  		io.emit('signout', { userId: data.userId });
  	});
});