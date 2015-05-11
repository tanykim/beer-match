require.config({
    shim: {
        'elements': {
            exports: 'E'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        underscore: '../bower_components/underscore/underscore',
        d3: '../bower_components/d3/d3',
        moment: '../bower_components/moment/moment',
        momentTZ: '../bower_components/moment-timezone/moment-timezone',
        chroma: '../bower_components/chroma-js/chroma.min',
        textures: '../bower_components/textures/textures.min',
        socketio: '../socket.io/socket.io',
        elements: 'vis-elements'
    }
});
require([
    'jquery',
    'underscore',
    'd3',
    'moment',
    'chroma',
    'textures',
    'socketio',
    'match',
    'vis',
    'elements'
], function ($, _, d3, moment, chroma, textures, io, Match, Vis, E) {

    'use strict';

    // later: communication with server
    // FIXME: URL
    var socket = io.connect('http://localhost:8080');
    var userData = [];
    var isMatch = false;

    //initiate single vis
    function initVisSingle(data) {

        userData = [data, null];

        var u = data.userinfo;
        window.history.pushState('object or string', 'Title', u.userId);

        $('.js-intro').addClass('hide');
        $('.js-match').addClass('hide');
        $('.js-single').removeClass('hide');
        $('.js-nav').removeClass('hide');
        $('.js-goMatch').removeClass('hide');
        $('.js-goSingles').addClass('hide');

        var template = _.template($('#header-single').html());
        $('.js-vis-header').html(template({
            avatar: u.avatar,
            name: u.username,
            address: u.address,
            checkinCount: u.checkinCount
        }));﻿

        $('.js-title-overlaid').html(E.msgs.titles.single[0]);
        _.each(_.range(6), function (i) {
            $('.js-nav-title-' + i).html(E.msgs.titles.single[i]);
        });
        Vis.startVis(data);
    }

    //match
    function initVisMatch(data) {

        userData[1] = data;

        //FIXME: create match data at the server
        function createBeerMatchData(dataSet, callback) {
            var match = new Match(dataSet);
            callback(match);
        }

        createBeerMatchData(userData, function (m) {
            console.log('----init match vis');

            window.history.pushState('object or string', 'Title', m.url);

            $('.js-intro').addClass('hide');
            $('.js-single').addClass('hide');
            $('.js-match').removeClass('hide');
            $('.js-nav').removeClass('hide');
            $('.js-goSingles').removeClass('hide');
            $('.js-goMatch').addClass('hide');

            var template = _.template($('#header-match').html());
            $('.js-goSingle-0').html(userData[0].userinfo.userId.toUpperCase());
            $('.js-goSingle-1').html(userData[1].userinfo.userId.toUpperCase());
            $('.js-vis-header').html(template({
                avatar1: userData[0].userinfo.avatar,
                avatar2: data.userinfo.avatar
            }));﻿

            $('.js-title-overlaid').html(E.msgs.titles.match[0]);
            _.each(_.range(6), function (i) {
                $('.js-nav-title-' + i).html(E.msgs.titles.match[i]);
            });
            Vis.startVisMatch(m);
        });
    }

    //intro id input check
    $('.js-intro-main').keypress(function(event){
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
            var userId = $('.js-intro-input').val();
            if (userId.length < 3) {
                renderSettings(E.msgs.intro.diffName, E.msgs.intro.tooShort);
            } else {
                console.log('---entered');
                renderSettings(E.msgs.intro.init, E.msgs.intro.userIdCheck, userId);
                socket.emit('userId', { userId: userId });
            }
        }
    });

    // default text input
    function renderSettings(desc, warning, userId, friends) {

        // window.history.pushState('object or string', 'Title', '/');

        var template = _.template($('#intro-start').html());
        var prevUser = userData[0] ?
                userData[0].userinfo.userId.toUpperCase() :
                '';
        $('.js-intro-main').html(template({
            desc: desc,
            warning: warning,
            userId: userId,
            friends: friends,
            prevUser: prevUser
        }));﻿

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

    //download
    function startDownload(d, tz) {
        $('.js-start').click(function() {
            console.log('2---. downloading feeds')
            socket.emit('timezone', {
                userinfo: d.userinfo,
                name: tz ? tz : d.timezone.name
            });
        });
    }

    // after fouding a user
    function renderUserInfo(data) {

        var userinfo = data.userinfo;
        var timezone = userinfo.address ? data.timezone.name +
                ' (UTC' + (data.timezone.offset >= 0 ? '+' : '') +
                data.timezone.offset/3600 + 'h)<br/>' +
                'If the timezone is not correct, please ' +
                '<span class="link underline js-timezone-switch">change. ' +
                '</span>' :
                'No address/timezone info available';
        var template = _.template($('#intro-userinfo').html());
        $('.js-intro-main').html(template({
            avatar: userinfo.avatar,
            username: userinfo.username,
            address: userinfo.address,
            timezone: timezone
        }));﻿

        var newTimezone;
        if (userinfo.address) {
            startDownload(data, newTimezone);
        }

        //timezone select
        $('.js-timezone-switch').click(function() {
            $('.js-timezone-list').removeClass('hide');
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
            var msg = friends ? E.msgs.intro.friends : E.msgs.intro.noFriends;
            renderSettings(msg, '', '', friends);
            $('.js-friend-select').change(function() {
                var friend = $(this).val();
                socket.emit('userId', { userId: friend});
            });
        });
    }

    // after loading the first user
    function renderSettingsOptions(msg, data) {

        var userId = data.userinfo.userId;
        var template = _.template($('#intro-option').html());
        $('.js-intro-main').html(template({
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

    //FIXME : delete later, test mode
    if (userId.indexOf('---') > -1) {
        console.log('---dataset generating mode');
        socket.emit('dataset', { userId: userId.split('---')[1] });
    } else if (userId.indexOf('+') > -1) {
        console.log('1---two users');
        //FIXME: loading needed
        socket.emit('pair', { users: userId.split('+') });
    } else if (userId) {
        console.log('1---single user');
        renderSettings(E.msgs.intro.init, E.msgs.intro.userIdCheck, userId);
        socket.emit('userId', { userId: userId });
    } else {
        console.log('1---no url');
        renderSettings(E.msgs.intro.init, '', '');
    }

    //receive data from the server
    socket.on('error', function (data) {
        console.log('---error', data);
        renderSettings(E.msgs.intro.diffName, data.error_detail);
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
                // renderSettingsOptions(E.msgs.intro.back, d);
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
                isMatch = true;
                initVisMatch(d2);
            });
        });

    });

    socket.on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    });

    socket.on('progress', function (data) {
        $('.js-start').removeClass('underline')
            .html(Math.min(Math.round(data.count/data.total * 100), 100) + '%');
    });

    socket.on('success', function (data) {
        if (isMatch) {
            initVisMatch(data.data, true);
        } else {
            renderSettingsOptions('Download completed!', data.data);
        }
    });

    //social media
    $('.js-social').mouseover(function() {
        $(this).css('cursor', 'pointer');
    }).click(function() {
        var val = $(this).data().value;
        window.open(S.share[val]);
    });

    //add intro footer height
    var hDiff = $(window).height() - $('.js-intro-last').outerHeight();
    $('.js-intro-dummy').css('height', Math.max(hDiff, E.footerHeight) + 'px');

    function getHeightSum (num, view, offset) {
        return _.reduce(_.map(_.range(0, num), function(i) {
                    return $('.js-' + view +
                        '-contents-' + i).outerHeight();
                }), function (memo, num) {
                    return memo + num;
                }, 0) - offset;
    };
    $('.js-intro-slide').click(function() {
        $('html body').animate({
            scrollTop: getHeightSum(+$(this).data().value,
                    'intro',
                    $('.js-intro-header').outerHeight()
                )
        });
    });

    //go home
    $('.js-goHome').mouseover(function() {
        $(this).addClass('home-over');
    }).click(function() {
        console.log('---go home');
        $('.js-single').addClass('hide');
        $('.js-match').addClass('hide');
        $('.js-nav').addClass('hide');
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        $('.js-intro').removeClass('hide');
        window.history.pushState('object or string', 'Title', '/');
        userData = [null, null];
        isMatch = false;
        renderSettings(E.msgs.intro.init, '');
    }).mouseout(function() {
        $(this).removeClass('home-over');
    });

    //vis menu show/hide
    $('.js-nav-open').click(function() {
        if ($('.js-nav-expand').hasClass('hide')) {
            $('.js-nav-expand').removeClass('hide');
            $('.js-nav-open').html('<i class="fa fa-chevron-left"></i>');
        } else {
            $('.js-nav-expand').addClass('hide');
            $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        }
    });

    //get vis position
    var prevTitle = 0;
    function changeVisTitle(i) {
        if (i !== prevTitle) {
            $('.js-title-overlaid')
                .html(isMatch ? E.msgs.titles.match[i] : E.msgs.titles.single[i]);
            $('.js-slide').removeClass('selected');
            $('.js-nav-' + i).addClass('selected');
            prevTitle = i;
        }
    };
    //vis slide
    $('.js-slide').click(function() {
        $('html body').animate({
            scrollTop: getHeightSum(+$(this).data().value,
                isMatch ? 'match' : 'single',
                0)
            });
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
    });
    //scroll
    function positionVisTitle() {
        for (var i = 1; i < 7; i++) {
            var diff = $(window).scrollTop() -
                getHeightSum(i, isMatch ? 'match' : 'single', 0);
            if (diff < -60) {
                changeVisTitle(i-1);
                break;
            }
        }
    }
    var scrolled = _.debounce(positionVisTitle, 100);
    $(window).scroll(scrolled);

    //go to match view
    $('.js-goMatch').click(function() {
        console.log('---go match');
        $('.js-single').addClass('hide');
        $('.js-nav').addClass('hide');
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').removeClass('nav-toggle-open');
        $('.js-goMatch').addClass('hide');
        $('.js-intro').removeClass('hide');
        renderFriends(userData[0].userinfo.userId, userData[0].userinfo.friendCount);
    });
    //go to single view
    $('.js-goSingle').click(function() {
        console.log('--go single');
        $('.js-goSingles').addClass('hide');
        isMatch = false;
        initVisSingle(userData[$(this).data().value]);
    });
});