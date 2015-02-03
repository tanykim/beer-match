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
    'match',
    'vis'
], function ($, _, d3, moment, io, Match, Vis) {

    //communication with server
    var socket = io.connect('http://localhost:8080');
    var userData = [];
    var isMatch = false;

    var introMsgs = {
        init: 'Enter your UNTAPPD user name',
        diffName: 'Try a different user name',
        userIdCheck: 'Checking user name...'
    };

    //initiate single vis
    function initVisSingle(data) {

        userData = [data, null];

        var u = data.userinfo;
        window.history.pushState('object or string', 'Title', u.userId);

        $('.js-intro').hide();
        $('.js-single').show();
        $('.js-goMatch').show();

        var template = _.template($('#header-single').html());
        $('.js-vis-header').html(template({
            avatar: u.avatar,
            username: u.username,
            address: u.address,
            since: moment(u.since, 'ddd, DD MMM YYYY HH:mm:ssZ').format('MMM D, YYYY'),
            checkinCount: u.checkinCount,
            beerCount: u.beerCount
        }));﻿

        Vis.startVis(data);
    }

    //match
    function initVisMatch(data) {

        userData[1] = data;

        function createBeerMatchData(dataSet, callback) {
            var match = new Match(dataSet);
            callback(match);
        }

        createBeerMatchData(userData, function (m) {
            console.log('----init match vis');

            window.history.pushState('object or string', 'Title', m.url);

            $('.js-intro').hide();
            $('.js-match').show();
            $('.js-goSingle').show();

            var template = _.template($('#header-match').html());
            $('.js-vis-header').html(template({
                avatar1: userData[0].userinfo.avatar,
                username1: userData[0].userinfo.username,
                checkinCount1: userData[0].userinfo.checkinCount,
                avatar2: data.userinfo.avatar,
                username2: data.userinfo.username,
                checkinCount2: data.userinfo.checkinCount,
            }));﻿

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

    // default text input
    function renderIntro(desc, warning, userId, friends) {

        // window.history.pushState('object or string', 'Title', '/');

        var template = _.template($('#intro-start').html());
        var prevUser = userData[0] ? userData[0].userinfo.userId.toUpperCase() : '';
        $('.js-intro-content').html(template({
            desc: desc,
            warning: warning,
            userId: userId,
            friends: friends,
            prevUser: prevUser
        }));﻿

        checkTextInput();

        if (!userId) {
            $('.js-intro-input').focus();
        }
        //select a single user, not the match
        if (prevUser) {
            $('.js-start-single').click(function() {
                initVisSingle(userData[0]);
            });
        }
    }

    // after search of user
    function renderUserInfo(data) {

        var userinfo = data.userinfo;
        var timezone = 'No address/timezone info available';
        if (userinfo.address) {
            timezone = data.timezone.name +
                ' (UTC' + (data.timezone.offset >= 0 ? '+' : '') +
                data.timezone.offset/3600 + 'h)<br/>' +
                'If the timezone is not correct, please <span class="link underline js-timezone-switch">change.</span>';
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
                console.log('2---. downloading feeds')
                socket.emit('timezone', {
                    userinfo: d.userinfo,
                    name: tz ? tz : d.timezone.name
                });
            });
        }

        var newTimezone;
        if (userinfo.address) {
            startDownload(data, newTimezone);
        }

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

    //render friends list after the first user is loaded
    function renderFriends(userId, friendCount) {
        isMatch = true;
        console.log('3--. two users match', userId, friendCount);
        socket.emit('friends', { userId: userId, count: friendCount });
        socket.on('friends', function (d) {
            var friends = d.friends;
            var msg = friends ? 'Or enter an Untapped user name.' : 'No friends found. Enter an UNTAPPD user name.';
            renderIntro(msg, '', '', friends);
            $('.js-friend-select').change(function() {
                var friend = $(this).val();
                socket.emit('userId', { userId: friend});
            });
        });
    }

    // after loading the first user
    function renderIntroOptions(msg, data) {

        var userId = data.userinfo.userId;
        var template = _.template($('#intro-option').html());
        $('.js-intro-content').html(template({
            msg: msg,
            username: userId.toUpperCase(),
            avatar: data.userinfo.avatar
        }));﻿

        $('.js-start-single').click(function() {
            console.log('3--. single user vis');
            initVisSingle(data);
        });

        $('.js-start-match').click(function() {
            userData[0] = data;
            renderFriends(userId, data.userinfo.friendCount);
        });
    }

    //--1. check url
    var urlParts = window.location.href.split('/');
    var userId = urlParts[urlParts.length-1];

    if (userId.indexOf('---') > -1) {
        console.log('---dataset generating mode');
        socket.emit('dataset', { userId: userId.split('---')[1] });
    } else if (userId.indexOf('+') > -1) {
        console.log('1---two users');
        //FIXME: loading needed
        socket.emit('pair', { users: userId.split('+') });
    } else if (userId) {
        console.log('1---single user');
        renderIntro(introMsgs.init, introMsgs.userIdCheck, userId);
        socket.emit('userId', { userId: userId });
    } else {
        console.log('1---no url');
        renderIntro(introMsgs.init, '', '');
    }

    //receive data from the server
    socket.on('error', function (data) {
        console.log('---error', data);
        renderIntro(introMsgs.diffName, data.error_detail);
    });

    //FIXME: delete later
    socket.on('dataExist', function (data) {
        var userId = data.userId;
        console.log('---json exists');
        $.ajax({
            url: '/users/' + userId + '.json'
        }).done(function (d) {
            if (isMatch) {
                initVisMatch(d, true);
            } else {
                //FIXME: temporarily
                initVisSingle(d);
                // renderIntroOptions('Welcome back!', d);
            }
        });
    });

    //FIXME --> move to app. js later
    socket.on('pairDataExist', function (data) {
        var users = data.users;
        $.ajax({
            url: '/users/' + users[0] + '.json'
        }).done(function (d1) {
            userData[0] = d1;
            $.ajax({
                url: '/users/' + users[1] + '.json'
            }).done(function (d2) {
                initVisMatch(d2);
            });
        });

    });

    socket.on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    });

    socket.on('progress', function (data) {
        $('.js-start').removeClass('underline').html(Math.round(data.count/data.total * 100) + '%');
    });

    socket.on('success', function (data) {
        if (isMatch) {
            initVisMatch(data.data, true);
        } else {
            renderIntroOptions('Download completed!', data.data);
        }
    });

    //social media
    $('.js-social').mouseover(function() {
        $(this).css('cursor', 'pointer');
    }).click(function() {
        var val = $(this).data().value;
        if (val === 'facebook') {
            window.open("https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fbeer.tany.kim");
        } else if (val === 'twitter') {
            window.open("https://twitter.com/intent/tweet?text=Check this cool visualization of beer! See your beer taste and the match with your friends at http%3A%2F%2Fbeer.tany.kim");
        } else {
            window.open("https://plus.google.com/share?url=http%3A%2F%2Fbeer.tany.com");
        }
    });
    //intro slide
    //add footer height
    var hDiff = $(window).height() - $('.js-single-contents-2').outerHeight();
    if (hDiff > 0) {
        $('.js-intro-dummy').css('height', hDiff + 'px');
    }
    function getHeightSum (num) {
        return _.reduce(_.map(_.range(0, num), function(i) {
                    return $('.js-intro-' + i).outerHeight();
                }), function (memo, num) {
                    return memo + num;
                }, 0);
    };
    $('.js-intro-slide').click(function() {
        $('html body').animate({ scrollTop: getHeightSum(+$(this).data().value) });
    });

    //go home
    $('.js-goHome').click(function() {
        console.log('---go home');
        $('.js-single').hide();
        $('.js-match').hide();
        $('.js-intro').show();
        window.history.pushState('object or string', 'Title', '/');
        userData = [null, null];
        isMatch = false;
        renderIntro(introMsgs.init, '');
    });

    //go to match view
    $('.js-goMatch').click(function() {
        console.log('---go match');
        $('.js-single').hide();
        $('.js-intro').show();
        $('.js-goMatch').hide();
        // $('.js-match').find('.vis-contents-wrapper').css('top', 0);
        renderFriends(userData[0].userinfo.userId, userData[0].userinfo.friendCount);
    });
    //go to single view
    $('.js-goSingle').click(function() {
        console.log('--go single');
        $('.js-goSingle').hide();
        isMatch = false;
        // $('.js-single').find('.vis-contents-wrapper').css('top', 0);
        initVisSingle(userData[$(this).data().value]);
    });
});