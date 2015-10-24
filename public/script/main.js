require.config({
    shim: {
        'elements': {
            exports: 'E'
        },
        'pathjs': {
            exports: 'Path'
        },
        'scroll': {
            exports: 'Scroll'
        },
        'storage': {
            exports: 'Storage'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        underscore: '../bower_components/underscore/underscore',
        d3: '../bower_components/d3/d3',
        moment: '../bower_components/moment/moment',
        momentTZ: '../bower_components/moment-timezone/moment-timezone',
        pathjs: '../bower_components/pathjs/path',
        chroma: '../bower_components/chroma-js/chroma.min',
        textures: '../bower_components/textures/textures.min',
        socketio: '../socket.io/socket.io',
        elements: 'vis-elements',
        scroll: 'scroll',
        storage: 'storage'
    }
});
require([
    'jquery',
    'underscore',
    'd3',
    'moment',
    'pathjs',
    'chroma',
    'textures',
    'socketio',
    'vis',
    'BeerMatch-match',
    'elements',
    'scroll',
    'storage'
], function ($, _, d3, moment, Path, chroma, textures, io, Vis, Match, E, Scroll, Storage) {

    'use strict';

    var firstUserId;

    function initVisCommon(sel, other, html, url) {

        $('.js-intro').addClass('hide');

        $('.js-nav').show();
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        $('.js-sessions').hide();

        $('.js-' + other).addClass('hide');
        $('.js-' + sel).removeClass('hide');
        $('.js-go-' + other).removeClass('hide');
        $('.js-go-' + sel).addClass('hide');

        var template = _.template($('#header-' + sel).html());
        $('.js-vis-header').html(template(html));﻿

        $('.js-title-overlaid').html(E.msgs.titles[sel][0]);
        _.each(_.range(6), function (i) {
            $('.js-nav-title-' + i).html(E.msgs.titles[sel][i]);
        });
    }

    function initVisSingle(data) {

        var u = data.userinfo;
        window.location.hash = '#/' + u.userId;

        $('.js-go-match').data('value', u.userId);
        $('.js-go-match').data('friends', u.friendCount);

        var html = {
            avatar: u.avatar,
            name: u.username,
            address: u.address? '<i class="fa fa-lg fa-map-marker"></i> ' + u.address : '',
            checkinCount: u.checkinCount
        };
        initVisCommon('single', 'match', html, u.userId);
        Vis.startVis(data);
    }

    function initVisMatch(data) {

        /*
        console.log(data);
        var temp = data;

        temp.userinfo[0].userId = '_sample1';
        temp.userinfo[1].userId = '_sample2';
        temp.userinfo[0].username = 'Ale B.';
        temp.userinfo[1].username = 'Lager B.';
        temp.userinfo[0].address = 'Santa Cruz, CA';
        temp.userinfo[1].address = 'Santa Cruz, CA';
        temp.userinfo[0].avatar = 'http://beer.tany.kim/images/sample1.png';
        temp.userinfo[1].avatar = 'http://beer.tany.kim/images/sample2.png';
        temp.profile[0].username = 'Ale B.';
        temp.profile[1].username = 'Lager B.';
        temp.profile[0].avatar = 'http://beer.tany.kim/images/sample1.png';
        temp.profile[1].avatar = 'http://beer.tany.kim/images/sample2.png';
        temp.url = '_sample1+_sample2';

        console.log(JSON.stringify(temp));
        socket.emit('sampleMatchMake', { data: data});
        */

        var userIds = [data.userinfo[0].userId, data.userinfo[1].userId];
        window.location.hash = '#/' + userIds[0] + '/' + userIds[1];

        $('.js-goSingle-0').html(userIds[0].toUpperCase())
            .parent().data('value', userIds[0]);
        $('.js-goSingle-1').html(userIds[1].toUpperCase())
            .parent().data('value', userIds[1]);

        var html = {
            avatar0: data.userinfo[0].avatar,
            avatar1: data.userinfo[1].avatar,
            name0: data.userinfo[0].username,
            name1: data.userinfo[1].username
        };﻿

        initVisCommon('match', 'single', html, data.url);
        Vis.startVisMatch(data);
    }

    // default text input
    function renderIntro(desc, warning, userId, friends, error, apiError) {

        var template = _.template($('#intro-start').html());

        var sessions = Storage.getSessions();

        $('.js-intro-main').html(template({
            desc: desc,
            warning: warning,
            userId: error? '' : userId,
            friends: friends,
            sessions: _.isEmpty(sessions) ? '' :
                _.map(sessions, function (d) { return d[0]; }).reverse(),
            firstUserId: _.isUndefined(firstUserId) ? '' : firstUserId.toUpperCase(),
            apiError: apiError
        }));﻿
        $('.js-session-select').change(function () {
            var key = $(this).val();
            if (key.indexOf('+') > -1) {
                initVisMatch(JSON.parse(localStorage.getItem(key)));
            } else {
                initVisSingle(JSON.parse(localStorage.getItem(key)));
            }
        });

        if (error || apiError) {
            $('.js-start-single').click(function() {
                if (userId) {
                    initVisSingle(JSON.parse(localStorage.getItem(userId)));
                } else {
                    if (localStorage[firstUserId]) {
                        initVisSingle(JSON.parse(localStorage.getItem(firstUserId)));
                    } else {
                        socket.emit('userId', { userId: firstUserId });
                    }
                }

            });
        } else {
            callSampleVis();
        }
    }

    function startDownload(d, tz) {
        $('.js-start').click(function() {
            $(this).addClass('hide');
            $('.js-progress').removeClass('hide').html('Starting to download...');
            console.log('2---. downloading feeds');
            socket.emit('timezone', {
                userinfo: d.userinfo,
                name: tz ? tz : d.timezone.name
            });
        });
    }

    //after finding a user
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
            $('.js-start').removeClass('disabled').addClass('link').html('<i class="fa fa-cloud-download"></i> Download');
            startDownload(data, newTimezone);
        });
    }

    function showMatchFriend(userId, friendId) {

        var matchURL = userId + '+' + friendId;

        if (localStorage[matchURL]) {
            initVisMatch(JSON.parse(localStorage.getItem(matchURL)));
        } else if (localStorage[userId] && localStorage[friendId]) {
            createMatchData([userId, friendId]);
        } else {
            resetToIntro(true);
            socket.emit('userId', { userId: friendId });
        }
    }

    //render friends list after the first user is loaded
    function renderFriends(userId, friendCount) {
        console.log('3--. two users match', userId, friendCount);
        socket.emit('friends', { userId: userId, count: friendCount });
        socket.on('friends', function (d) {
            var friends = d.friends;
            var msg = friends ? E.msgs.intro.friends : E.msgs.intro.noFriends;
            renderIntro(msg, '', '', friends, true);
            $('.js-friend-select').change(function() {
                showMatchFriend(userId, $(this).val());
            });
        });
    }

    //after loading the first user
    function renderVisOptions(msg, data) {

        var userId = data.userinfo.userId;
        var template = _.template($('#intro-option').html());
        $('.js-intro-main').html(template({
            msg: msg,
            username: userId.toUpperCase(),
            avatar: data.userinfo.avatar
        }));﻿

        if (!localStorage[userId] && userId !== '_sample1' && userId !== '_sample2') {
            Storage.setLocalStorageItem(userId, JSON.stringify(data));
        }

        $('.js-start-single').click(function() {
            console.log('3--. single user vis');
            initVisSingle(data);
        });

        $('.js-start-match').click(function() {

            firstUserId = userId;

            console.log('3--. match vis');
            if (data.userinfo.userId === '_sample1' ||
                data.userinfo.userId === '_sample2') {
                $.ajax({
                    url: 'users/_match.json'
                }).done(function (d) {
                    initVisMatch(d);
                });
            } else {
                resetToIntro(true);
                renderFriends(userId, data.userinfo.friendCount);
            }
        });
    }

    function resetToIntro(loading) {

        $('.js-single').addClass('hide');
        $('.js-match').addClass('hide');
        $('.js-nav').hide();
        $('.js-sessions').hide();
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        $('.js-intro').removeClass('hide');
        $('.js-start').removeClass('hide');
        $('.js-progress').addClass('hide').html('');

        if (loading) {
            $('.js-intro-main').html(E.msgs.intro.loading);
        } else {
            window.location.hash = '#/';
            firstUserId = undefined;
            renderIntro(E.msgs.intro.init);
        }
    }

    function createMatchData(userIds) {

        function createDataset(userIds, callback) {
            var match = Match.createDataset([
                JSON.parse(localStorage.getItem(userIds[0])),
                JSON.parse(localStorage.getItem(userIds[1]))
            ]);
            callback(match);
        }
        createDataset(userIds, function (m) {
            Storage.setLocalStorageItem(m.url, JSON.stringify(m));
            initVisMatch(m);
        });
    }

    /*******************/
    /* Storage control */
    /*******************/

    var urlParts = window.location.href.split('/');
    //var socket = io.connect('http://' + urlParts[2]);
    var socket = io.connect('http://beer.tany.kim');

    //console.log(socket);
    Storage.init(socket);

    /*****************************/
    /* url check for socket comm */
    /*****************************/

    Path.root('#/');
    Path.map('#/').to(function () {
        resetToIntro();
        $('.js-intro-input').focus();
    });

    //samples
    Path.map('#/_sample1').to(function () {
        socket.emit('sampleSingle', { userId: '_sample1' });
    });
    Path.map('#/_smaple2').to(function () {
        socket.emit('sampleSingle', { userId: '_sample2' });
    });
    Path.map('#/_sample1/_sample2').to(function () {
        socket.emit('sampleMatch');
    });

    //normal id
    Path.map('#/:userId').to(function () {
        var uIdURL = this.params['userId'];
        if (localStorage[uIdURL]) {
            renderVisOptions(E.msgs.intro.back, JSON.parse(localStorage.getItem(uIdURL)));
        } else {
            socket.emit('userId', { userId: uIdURL });
        }
    });
    Path.map('#/:userId0/:userId1').to(function () {
        firstUserId = this.params['userId0'];
        var secondUserId = this.params['userId1'];
        var uIdURL = firstUserId + '+' + secondUserId;
        if (localStorage[uIdURL]) {
            initVisMatch(JSON.parse(localStorage.getItem(uIdURL)));
        } else if (localStorage[firstUserId] && localStorage[secondUserId]){
            createMatchData([firstUserId, secondUserId]);
        } else {
            renderIntro(E.msgs.intro.noData, '', '', '', true);
        }
    });

    Path.rescue(function () {
        renderIntro(E.msgs.intro.init, '', '');
    });

    Path.listen();

    /************************/
    /* socket communication */
    /************************/

    socket.on('sampleSingle', function (data) {
        firstUserId = data.userId;
        initVisSingle(data.data);
    }).on('sampleMatch', function (data) {
        initVisMatch(data.data);
    }).on('error', function (data) {
        renderIntro(E.msgs.intro.diffName, data.error_detail, data.userId, '', true);
    }).on('apiError', function (data) {
        renderIntro(E.msgs.intro.apiError, data.error_detail, data.userId, '', false, true);
    }).on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    }).on('progress', function (data) {
        var progress = Math.round(data.count/data.total * 100);
        $('.js-progress').html(progress < 100 ?
            E.msgs.intro.loadingImg + '<br/>' + progress + '%' :
            'Analyzing...');
    }).on('success', function (data) {
        if (firstUserId) { //for match
            var userId = data.data.userinfo.userId;
            Storage.setLocalStorageItem(userId, JSON.stringify(data.data));
            createMatchData([firstUserId, userId]);
        } else {
            renderVisOptions(E.msgs.intro.completed, data.data);
        }
    }).on('reset', function () {
        resetToIntro();
    });

    /*******************/
    /* intro key enter */
    /*******************/

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
                renderIntro(E.msgs.intro.diffName, E.msgs.intro.tooShort);
            } else {
                if (firstUserId) {
                    showMatchFriend(firstUserId, userId);
                } else {
                    if (localStorage.getItem(userId)) {
                        renderVisOptions(E.msgs.intro.back, JSON.parse(localStorage.getItem(userId)));
                    } else {
                        renderIntro('', E.msgs.intro.userIdCheck, userId);
                        socket.emit('userId', { userId: userId });
                    }
                }
            }
        }
    });

    /********************/
    /* page interaction */
    /********************/

    //scroll interaction
    Scroll.init();
    $('.js-intro-footer').click(function() {
        resetToIntro();
    });

    //---- intro
    //social media
    $('.js-social').mouseover(function() {
        $(this).css('cursor', 'pointer');
    }).click(function() {
        var val = $(this).data().value;
        window.open(E.msgs.share[val]);
    });

    //sample vis
    function callSampleVis() {
        $('.js-start-sample-single').click(function() {
            socket.emit('sampleSingle', { userId: '_sample1' });
        });
        $('.js-start-sample-match').click(function() {
            socket.emit('sampleMatch');
        });
    }
    callSampleVis();

    //intro footer height
    var hDiff = $(window).height() - $('.js-intro-last').outerHeight();
    $('.js-intro-last').css('margin-bottom', Math.max(hDiff, E.footerHeight) + 'px');

    //---- vis header interaction
    //go home
    $('.js-goHome').mouseover(function() {
        $(this).addClass('home-over');
    }).click(function() {
        resetToIntro();
    }).mouseout(function() {
        $(this).removeClass('home-over');
    });

    //go to match view
    $('.js-go-match').click(function() {

        var userId = $(this).data().value;
        firstUserId = userId;

        if (userId === '_sample1' || userId === '_sample2') {
            $.ajax({
                url: 'users/_match.json'
            }).done(function (d) {
                initVisMatch(d);
            });
        } else {
            resetToIntro(true);
            renderFriends(userId, $(this).data().friends);
        }
    });

    //go to single view
    $('.js-goSingle').click(function() {

        firstUserId = undefined;

        var userId = $(this).data().value;
        if (userId === '_sample1' || userId === '_sample2') {
            $.ajax({
                url: 'users/' + userId + '.json'
            }).done(function (d) {
                initVisSingle(d);
            });
        } else {
            if (localStorage[userId]) {
                initVisSingle(JSON.parse(localStorage.getItem(userId)));
            } else {
                resetToIntro(true);
                socket.emit('userId', { userId: userId });
            }
        }
    });
});