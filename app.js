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
            emitProfile(userinfo, '');
        } else {
            var location = data.results[0].geometry.location;
            timezoner.getTimeZone(
                location.lat, location.lng,
                function (err, data) {
                    if (err) {
                        emitProfile(userinfo, '');
                    } else {
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

    function createBeerData(data, callback) {
        var user = new User(data.userinfo, data.timezone, data.checkins);
        callback(user);
    }

    createBeerData(data, function (u) {
        io.emit('success', { data: u });
    });
}

function getUserFeed(id, data) {

    console.log('getting user data userid----', data.userinfo.userId);

    var userinfo = data.userinfo;
    var userId = userinfo.userId;
    var checkins = [];

    //max 50 feeds per call
    var feedCallsNeeded = Math.ceil(userinfo.checkinCount / 50);
    var feedCallCount = 0;

    function callUserFeedAPI(id) {

        untappd.userFeed(function (err, obj){
            if (debug) console.log(err, obj);
            if (obj && obj.response && obj.response.checkins && obj.response.checkins.items) {
                checkins.push(obj.response.checkins.items);
                if (obj.response.pagination.max_id) {
                    //FIXME: often called twice
                    console.log('feed api call---', id);
                    feedCallCount = feedCallCount + 1;
                    io.emit('progress', {
                        total: feedCallsNeeded,
                        count: feedCallCount
                    });
                    callUserFeedAPI(obj.response.pagination.max_id);
                } else {
                    createSingleData({
                        userinfo: userinfo,
                        timezone: data.name,
                        checkins: _.flatten(checkins)
                    });
                }
            }
            else {
                io.emit('apiError', { error_detail: obj.meta.error_detail, userId: userId });
            }
        }, userId, 50, id);
    }
    callUserFeedAPI();
}

function getUserInfo(userId) {

    untappd.userInfo(function (err, obj) {
        //console.log(err, obj);
        if (obj && obj.response && obj.response.user) {
            if (obj.response.user.is_private) {
                console.log('--private id');
                io.emit('error', { error_detail: userId.toUpperCase() + ' is a private account.', userId: userId });
            } else if (obj.response.user.stats.total_checkins === 0) {
                io.emit('error', { error_detail: 'No check-in data available.', userId: userId });
            } else {
                //get timezone info & emit
                console.log ('--id found, get timezone info now');
                getTimezone(obj.response.user);
            }
        } else {
            io.emit('apiError', { error_detail: obj.meta.error_detail, userId: userId });
        }
    }, userId);
}

function getFriendsList(userId, count) {

    //max 25 feeds per call, upto 100 friends
    var friendCallsNeeded = Math.min(count, 100);
    var friendCallCount = 0;

    var friends = [];

    function callFriendsFeedAPI(offset) {
        untappd.userFriends(function (err, obj) {
            //console.log(err, obj);
            if (obj && obj.response && obj.response.items && obj.response.count > 0) {
                var fList = _.map(obj.response.items, function (d) {
                    return d.user.user_name.toLowerCase();
                });
                friends.push(fList);
                friendCallCount = friendCallCount + 25;
                if (friendCallCount < friendCallsNeeded) {
                    callFriendsFeedAPI(friendCallCount);
                }
                else {
                    io.emit('friends', { friends: _.flatten(friends).sort() });
                }
            } else if (obj.response.count === 0) {
                io.emit('error', { error_detail: userId.toUpperCase() + ' doesn\'t have friends', userId: userId });
            } else {
                io.emit('apiError', { error_detail: obj.meta.error_detail, userId: userId });
            }
        }, userId, 25, offset);
    }
    callFriendsFeedAPI();
}

io.on('connection', function (socket) {

    /*TEST: data generating mode
    socket.on('dataset', function (data) {
        var d = JSON.parse(fs.readFileSync('public/users/raw/' + data.userId + '.json', 'utf8'));
        createSingleData(d);
    });
    socket.on('datasetSession', function (data) {
        console.log('using downloaded json');
        var d = JSON.parse(fs.readFileSync('public/users/' + data.userId + '.json', 'utf8'));
        io.emit('success', { data: d });
    });
    socket.on('sampleMatchMake', function (data) {
        fs.writeFileSync('public/users/_match.json', JSON.stringify(data.data));
    });
    */

    socket.on('userId', function (data) {
        getUserInfo(data.userId.toLowerCase());
    }).on('timezone', function (data) {
        getUserFeed(undefined, data);
    }).on('friends', function (data) {
        getFriendsList(data.userId.toLowerCase(), data.count);
    }).on('reset', function () {
        io.emit('reset');
    });
});