require.config({
  shim: {
    'd3': {
      exports: 'd3'
    },
    'socketio': {
      exports: 'io'
    },
    'underscore': {
      exports: '_'
    }
  },
  paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        underscore: '../bower_components/underscore/underscore',
        d3: '../bower_components/d3/d3',
        moment: '../bower_components/moment/moment',
        momentTZ: '../bower_components/moment-timezone/moment-timezone',
        socketio: '../socket.io/socket.io',
        beer: 'beer',
        match: 'match',
        vis: 'vis'
  }

});

require([
    'jquery',
    'underscore',
    'd3',
    'moment',
    'socketio',
    'beer',
    'match',
    'vis'
], function ($, _, d3, moment, io, Beer, Match, Vis) {

    /*test
    console.log('---test');
    // console.log(getDistance(3, 3, 0, 0));
    function getCos(v) {
        function getDistance(p1, p2) {
            var x1 = p1[0];
            var y1 = p1[1];
            var x2 = p2[0];
            var y2 = p2[1];
            return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        }
        var avgR = [3, 0];
        var lenA = getDistance(avgR, v);
        var lenB = getDistance(v, [0, 0]);
        var lenC = getDistance(avgR, [0, 0]);
        return (-1 * (lenA * lenA) + lenB * lenB + lenC * lenC) / (2 * lenB * lenC);
    }
    console.log(getCos([3, 0]));
    */

    //communication with server
    var socket = io.connect('http://localhost:8080');
    var singleUserData;
    var isMatch = false;

    var introMsgs = {
        init: 'Enter your UNTAPPD user name',
        diffName: 'Try a different name',
        userIdCheck: 'Checking user name...'
    };

    //create data & initiate vis
    function initVis(data) {

        function createBeerData(data, callback) {
            var beer = new Beer(data.userinfo, data.timezone, data.checkins);
            callback(beer);
        }

        createBeerData(data, function (b) {
            console.log('----init single vis');
            window.history.pushState('object or string', 'Title', b.userId);
            $('.js-intro').hide();
            $('.js-vis').show();
            Vis.startVis(b);
        });
    }
    function initVisMatch(data) {
        
        function createBeerMatchData(dataSet, callback) {
            var match = new Match(dataSet);
            callback(match);
        }

        createBeerMatchData([singleUserData, data], function (m) {
            console.log('----init match vis');
            window.history.pushState('object or string', 'Title', m.url);
            $('.js-intro').hide();
            $('.js-vis-match').show();
            Vis.startVisMatch(m);
        });
    }

    //show intro
    function checkTextInput() {
        $('.js-intro-input').keypress(function(event){
            //allow only alpha-numeric characters
            var ew = event.which;
            if (48 <= ew && ew <= 57)
                return true;
            if (65 <= ew && ew <= 90)
                return true;
            if (97 <= ew && ew <= 122)
                return true;
            return false;
        }).keydown(function(event) {
            if (event.keyCode == 13) {
                //at least five haracters
                var userId = $(this).val();
                if (userId.length < 3) {
                    renderIntro(introMsgs.diffName, 'Should be at least 3 characters');
                } else {
                    renderIntro(introMsgs.init, introMsgs.userIdCheck, userId);
                    socket.emit('userId', { userId: userId });
                }
            }
        });
    }

    function renderIntro(desc, warning, userId, friends) {
        
        window.history.pushState('object or string', 'Title', '/');

        var template = _.template($('#intro-start').html());
        var prevUser = singleUserData ? singleUserData.userinfo.userId.toUpperCase() : '';
        $('.js-intro-content').html(template({ desc: desc, warning: warning, userId: userId, friends: friends, prevUser: prevUser }));﻿
        checkTextInput();
        if (!userId) {
            $('.js-intro-input').focus();
        }
        if (prevUser) {
            $('.js-single').click(function() {
                initVis(singleUserData);
            });
        }     
    }

    function renderUserInfo(data) {

        var userinfo = data.userinfo;
        var timezone = 'No address/timezone info available';
        if (userinfo.address) {
            timezone = data.timezone.name +
                ' (UTC' + (data.timezone.offset >= 0 ? '+' : '') +
                data.timezone.offset/3600 + 'h)<br/>' +
                'If it\'s not correct, please <span class="link underline js-timezone-switch">choose another timezone.</span>';
        }
        var template = _.template($('#intro-userinfo').html());
        $('.js-intro-content').html(template({
            avatar: userinfo.avatar,
            username: userinfo.username,
            address: userinfo.address,
            timezone: timezone
        }));﻿

        function startDownload(d, tz) {
            $('.js-start').click(function() {
                socket.emit('timezone', {
                    userinfo: d.userinfo,
                    name: tz ? tz : d.timezone.name
                });
            });
        }

        var newTimezone;
        startDownload(data, newTimezone);

        //timezone select
        $('.js-timezone-switch').click(function() {
            $('.js-timezone-list').show();
        });
        $('.js-timezone-select').change(function() {
            newTimezone = $(this).val();
            $('.js-start').removeClass('disabled').addClass('link underline');
            startDownload(data, newTimezone);
        });
    }

    function renderIntroOptions(msg, data) {

        singleUserData = data;

        var userId = data.userinfo.userId;
        var template = _.template($('#intro-option').html());
        $('.js-intro-content').html(template({ msg: msg, username: userId, avatar: data.userinfo.avatar }));﻿
        $('.js-single').click(function() {
            initVis(data);
        });
        $('.js-match').click(function() {
            isMatch = true;
            console.log(data);
            console.log('match----', userId, data.userinfo.friendCount);
            socket.emit('friends', { userId: userId, count: data.userinfo.friendCount });
            socket.on('friends', function (d) {
                console.log(d.friends);
                var friends = d.friends;
                var msg = friends ? 'Or enter an Untapped user name.' : 'No friends found. Enter an Untapped user name.';      
                renderIntro(msg, 'Explore the match with ' + userId.toUpperCase(), '', friends);
                $('.js-friend-select').change(function() {
                    var friend = $(this).val();
                    console.log(friend);
                    socket.emit('userId', { userId: friend});
                });
            });
        });
    }

    //check url first
    var urlParts = window.location.href.split('/');
    var userId = urlParts[urlParts.length-1];
    if (userId.indexOf('+') > -1) {
        console.log('---multiple users');
        socket.emit('pair', { users: userId.split('+') });
    } else if (userId) {
        renderIntro(introMsgs.init, introMsgs.userIdCheck, userId);
        socket.emit('userId', { userId: userId });
    } else {
        renderIntro(introMsgs.init, '', '');
    }

    //receive data from the server
    socket.on('error', function (data) {
        console.log(data);
        renderIntro(introMsgs.diffName, data.error_detail);
    });

    socket.on('dataExist', function (data) {
        var userId = data.userId;
        console.log('---json exists');
        $.ajax({
            url: '/users/' + userId + '.json'
        }).done(function (d) {
            if (isMatch) {
                initVisMatch(d, true);
            } else {
                renderIntroOptions('Welcome back!', d);
            }
        });
    });

    socket.on('pairDataExist', function (data) {
        var users = data.users;
        $.ajax({
            url: '/users/' + users[0] + '.json'
        }).done(function (d) {
            singleUserData = d;
            $.ajax({
                url: '/users/' + users[1] + '.json'
            }).done(function (d) {
                initVisMatch(d);
            });    
        });    
                
    });
    socket.on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    });

    socket.on('progress', function (data) {
        $('.js-start').html(data.count + '/' + data.total);
    });

    socket.on('success', function (data) {
        if (isMatch) {
            initVisMatch(data, true);
        } else {
            // singleUserData = data.data;
            renderIntroOptions('Download completed!', data.data);
        }
    });

    //sign out
    $('.js-signout').click(function() {
        socket.emit('signout', { userId: userId });
    });
    socket.on('signout', function (data) {
        $('.js-vis').hide();
        $('.js-vis-match').hide();
        $('.js-intro').show();
        window.history.pushState('object or string', 'Title', '/');
        renderIntro(introMsgs.diffName, 'Safely signed out!');
    });

    //about and contact
    $('.js-link-extra').click(function() {
        $('.js-extra-elm').hide();
        $('.js-' + $(this).data().value).show();
        $('.js-extra').fadeIn();
    });
    $('.js-extra-close').click(function() {
        $('.js-extra').fadeOut();
    });

});