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
    'vis'
], function ($, _, d3, moment, io, Beer, Vis) {

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

    function initVis(data, vis) {

        function createBeerData(data, callback) {
            var beer = new Beer(data.userinfo, data.timezone, data.checkins);
            callback(beer);
        }

        createBeerData(data, function (b) {
            window.history.pushState('object or string', 'Title', b.userId);
            $('.js-intro').hide();
            $('.js-vis').show();
            Vis.startVis(b);
        });
    }

    var introMsgs = {
        init: 'Enter your UNTAPPD user name',
        diffName: 'Try a different name',
        shortInput: 'Should be at least 5 characters',
        userIdCheck: 'Checking user name...',
    };

    //check url first
    var urlParts = window.location.href.split('/');
    var userId = urlParts[urlParts.length-1];
    if (userId) {
        renderIntro(introMsgs.init, introMsgs.userIdCheck, userId);
        socket.emit('userId', { userId: userId });
    }
    else {
        renderIntro(introMsgs.init, '', '');
    }

    //text input
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
            if (userId.length < 5) {
                renderIntro(introMsgs.diffName, introMsgs.shortInput);
            } else {
                renderIntro(introMsgs.init, introMsgs.userIdCheck, userId);
                socket.emit('userId', { userId: userId });
            }
        }
    });

    function renderIntro(desc, warning, userId) {
        var template = _.template($('#intro-start').html());
        $('.js-intro-content').html(template({ desc: desc, warning: warning, userId: userId }));﻿
    }

    function renderUserInfo(data) {

        var template = _.template($('#intro-userinfo').html());
        var userinfo = data.userinfo;
        var timezone = 'No address/timezone info available';
        if (userinfo.address) {
            timezone = data.timezone.name +
                ' (UTC' + (data.timezone.offset >= 0 ? '+' : '') +
                data.timezone.offset/3600 + 'h)<br/>' +
                'If it\'s not correct, please <span class="link underline js-timezone-switch">choose another timezone.</span>'
        }
        $('.js-intro-content').html(template({
            avatar: userinfo.avatar,
            username: userinfo.username,
            address: userinfo.address,
            timezone: timezone
        }));﻿

        //timezone select
        $('.js-timezone-switch').click(function() {
            $('.js-timezone-list').show();
        });
        $('.js-timezone-select').change(function() {
            var newTimezone = $(this).val();
            $('.js-start').removeClass('disabled').addClass('link underline')
                .click(function() {
                    socket.emit('timezone', {
                        userinfo: data.userinfo,
                        name: newTimezone ? newTimezone : data.timezone.name
                    });
            });
        });
    }

    //receive data from the server
    socket.on('dataExist', function (data) {
        userId = data.userId;
        console.log('---json exists');
        $.ajax({
            url: '/users/' + userId + '.json'
        }).done(function(data) {
            initVis(data, true);
        });
    });

    socket.on('error', function (data) {
        console.log(data);
        renderIntro(introMsgs.diffName, data.error_detail);
    });

    socket.on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    });

    socket.on('progress', function (data) {
        $('.js-start').html(data.count + '/' + data.total);
    });

    socket.on('success', function (data) {
        userId = data.userId;
        console.log(data.userId);
        console.log(data.data);
        initVis(data.data);
    });

    //sign out
    $('.js-signout').click(function() {
        socket.emit('signout', { userId: userId });
    });
    socket.on('signout', function (data) {
        $('.js-vis').hide();
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