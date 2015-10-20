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
    'vis',
    'BeerMatch-match',
    'elements'
], function ($, _, d3, moment, chroma, textures, io, Vis, Match, E) {

    'use strict';

    var firstUserId;
    var prevTitle = 0;
    var sessions = [];

    function initVisCommon(sel, other, html, url) {

        window.history.pushState('object or string', 'Title', url);

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
    function renderIntro(desc, warning, userId, friends, apiError) {

        var template = _.template($('#intro-start').html());

        $('.js-intro-main').html(template({
            desc: desc,
            warning: warning,
            userId: userId,
            friends: friends,
            sessions: _.isEmpty(sessions) ? '' :
                _.map(sessions, function (d) { return d[0]; }).reverse(),
            firstUserId: _.isUndefined(firstUserId) ? '' : firstUserId.toUpperCase(),
            apiError: apiError
        }));﻿

        if (!userId) {
            $('.js-intro-input').focus();
        }

        $('.js-session-select').change(function () {
            var url = $(this).val();
            if (url.indexOf('+') > -1) {
                initVisMatch(JSON.parse(localStorage.getItem(url)));
            } else {
                initVisSingle(JSON.parse(localStorage.getItem(url)));
            }
        });

        if (apiError) {
            $('.js-start-single').click(function() {
                initVisSingle(JSON.parse(localStorage.getItem(userId)));
            });
        }
        callSampleVis();
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

    //render friends list after the first user is loaded
    function renderFriends(userId, friendCount) {

        firstUserId = userId;
        console.log('3--. two users match', userId, friendCount);
        socket.emit('friends', { userId: userId, count: friendCount });
        socket.on('friends', function (d) {
            var friends = d.friends;
            var msg = friends ? E.msgs.intro.friends : E.msgs.intro.noFriends;
            renderIntro(msg, '', '', friends);
            $('.js-friend-select').change(function() {
                var friend = $(this).val();
                resetToIntro(true);
                if (localStorage[friend]) {
                    var matchURL = userId + '+' + friend;
                    if (localStorage[matchURL]) {
                        initVisMatch(JSON.parse(localStorage.getItem(matchURL)));
                    } else {
                        createMatchData([userId, friend]);
                    }
                } else {
                    socket.emit('userId', { userId: friend, firstUserId: userId });
                }
            });
            $('.js-start-single').click(function() {
                if (localStorage[userId]) {
                    initVisSingle(JSON.parse(localStorage.getItem(userId)));
                } else {
                    socket.emit('userId', { userId: userId });
                }
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
            setLocalStorageItem(userId, JSON.stringify(data));
        }

        $('.js-start-single').click(function() {
            console.log('3--. single user vis');
            initVisSingle(data);
        });

        $('.js-start-match').click(function() {
            console.log('3--. match vis');
            if (data.userinfo.userId === '_sample1' ||
                data.userinfo.userId === '_sample2') {
                $.ajax({
                    url: 'users/_match.json'
                }).done(function (d) {
                    initVisMatch(d);
                });
            } else {
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
        window.history.pushState('object or string', 'Title', '/');
        firstUserId = undefined;
        if (loading) {
            $('.js-intro-main').html('LOADING...');
        } else {
            renderIntro(E.msgs.intro.init, '');
            callSampleVis();
        }
    }

    function getHeightSum (num, view, offset) {
        return _.reduce(_.map(_.range(0, num), function(i) {
                    return $('.js-' + view +
                        '-contents-' + i).outerHeight();
                }), function (memo, num) {
                    return memo + num;
                }, 0) - offset;
    }

    function changeVisTitle(i) {
        if (i !== prevTitle) {
            $('.js-title-overlaid')
                .html(firstUserId ? E.msgs.titles.match[i] : E.msgs.titles.single[i]);
            $('.js-slide').removeClass('selected');
            $('.js-nav-' + i).addClass('selected');
            prevTitle = i;
        }
    }

    function positionVisTitle() {
        for (var i = 1; i < 7; i++) {
            var diff = $(window).scrollTop() -
                getHeightSum(i, firstUserId ? 'match' : 'single', 0);
            if (diff < -60) {
                changeVisTitle(i-1);
                break;
            }
        }
    }

    function checkView() {
        if (!$('.js-intro').hasClass('hide')) {
            if ($(window).scrollTop() > 72) {
                $('.js-intro-header').addClass('header-scrolled');
                $('.js-intro-logo').addClass('logo-scrolled');
            } else {
                $('.js-intro-header').removeClass('header-scrolled');
                $('.js-intro-logo').addClass('logo-scrolled');
            }
        } else {
            positionVisTitle();
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
            setLocalStorageItem(m.url, JSON.stringify(m));
            initVisMatch(m);
        });
    }

    /*******************/
    /* session control */
    /*******************/

    console.log(localStorage);
    //localStorage.clear();

    //keep max 10 sessions, if longer, delete oldest
    function checkSessionLength() {
        function removeItem(len) {
            if (len > 10) {
                localStorage.removeItem(sessions[0][0]);
                sessions.shift();
                checkSessionLength();
            }
        }
        removeItem(sessions.length)
    }

    function setLocalStorageItem(key, val) {
        checkSessionLength();
        localStorage.setItem(key, val);
        $('.js-sessions-items').prepend('<li data-value="' + key + '">' +
            key + ' <i class="fa fa-times-circle link"></i>' +
            '</li>');
        sessions.push([key, moment().unix()]);
    }

    if (localStorage.length > 1) {
        sessions = _.sortBy(_.map(_.range(localStorage.length), function (i) {
            var key = localStorage.key(i);
            if (key !== 'debug') {
                var val = JSON.parse(localStorage.getItem(key));
                return [key, val.created];
            } else {
                return [key, 0];
            }
        }), function (d) {
            return d[1];
        });
    }
    sessions.shift();
    checkSessionLength();

    _.each(_.clone(sessions).reverse(), function (d) {
        $('.js-sessions-items').append('<li data-value="' + d[0] + '">' +
            d[0] + ' <i class="fa fa-times-circle link js-session-button"></i>' +
            '</li>');
    });

    /*****************************/
    /* url check for socket comm */
    /*****************************/

    var urlParts = window.location.href.split('/');
    var uIdURL = urlParts[urlParts.length - 1];
    var socket = io.connect('http://' + urlParts[2]);

    //check url first
    /*TEST: delete later, data generating mode
    if (uIdURL.indexOf('---') > -1) {
        socket.emit('dataset', { userId: uIdURL.split('---')[1] });
    } else if (uIdURL.indexOf('___') > -1) {
        socket.emit('datasetSession', { userId: uIdURL.split('___')[1] });
    }
    */

    //match view
    if (uIdURL.indexOf('+') > -1) {

        console.log('1---two users');

        firstUserId = uIdURL.split('+')[0];
        var secondUserId = uIdURL.split('+')[1];
        if (firstUserId === '_sample1' && secondUserId === '_sample2') {
            socket.emit('sampleMatch');
        } else if (localStorage[uIdURL]) {
            initVisMatch(JSON.parse(localStorage.getItem(uIdURL)));
        } else if (localStorage[firstUserId] && localStorage[secondUserId]){
            //create match data
            createMatchData([firstUserId, secondUserId]);
        } else if (localStorage[firstUserId] && !localStorage[secondUserId]) {
            //create single data first
            socket.emit('userId', { userId: secondUserId});
        } else if (!localStorage[firstUserId] && localStorage[secondUserId]) {
            //create single data first
            socket.emit('userId', { userId: firstUserId});
        } else {
            renderIntro(E.msgs.intro.noData, '', '');
        }
    //single view
    } else if (uIdURL) {
        console.log('1---single user');
        //check session first
        if (uIdURL === '_sample1' || uIdURL === '_sample2') {
            socket.emit('sampleSingle', { userId: uIdURL });
        } else if (localStorage[uIdURL]) {
            renderVisOptions(E.msgs.intro.back, JSON.parse(localStorage.getItem(uIdURL)));
        } else {
            socket.emit('userId', { userId: uIdURL });
        }
    } else {
        console.log('1---no url');
        renderIntro(E.msgs.intro.init, '', '');
    }

    /************************/
    /* socket communication */
    /************************/

    socket.on('error', function (data) {
        renderIntro(E.msgs.intro.diffName, data.error_detail, data.userId);
    }).on('apiError', function (data) {
        renderIntro(E.msgs.intro.apiError, data.error_detail, data.userId, '', true);
    }).on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    }).on('progress', function (data) {
        var progress = Math.round(data.count/data.total * 100);
        $('.js-progress').html(progress < 100 ? progress + '%' : 'Analyzing...');
    }).on('success', function (data) {
        if (data.sample) {
            firstUserId = data.sample;
            initVisSingle(data.data);
        } else if (firstUserId) { //for match
            var userId = data.data.userinfo.userId;
            setLocalStorageItem(userId, JSON.stringify(data.data));
            createMatchData([firstUserId, userId]);
        } else {
            renderVisOptions(E.msgs.intro.completed, data.data);
        }
    }).on('sampleMatch', function (data) {
        initVisMatch(data.data);
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
                //Single view, session exists
                if (localStorage[userId] && !firstUserId) {
                    renderVisOptions(E.msgs.intro.back, JSON.parse(localStorage.getItem(userId)));
                //match view, session exists
                } else if (localStorage[userId + '_' + firstUserId]) {
                    initVisMatch(JSON.parse(localStorage.getItem(userId + '+' + firstUserId)));
                //match view, single session exists, but match session doesn't exist
                } else if (localStorage[userId] && localStorage[firstUserId]) {
                    console.log('----2');
                    createMatchData([firstUserId, userId]);
                } else {
                    renderIntro('', E.msgs.intro.userIdCheck, userId);
                    socket.emit('userId', { userId: userId, firstUserId: firstUserId });
                }
            }
        }
    });

    /********************/
    /* page interaction */
    /********************/

    //intro sample vis
    function callSampleVis() {
        $('.js-start-sample-single').click(function() {
            socket.emit('sampleSingle', { userId: '_sample1' });
        });
        $('.js-start-sample-match').click(function() {
            socket.emit('sampleMatch');
        });
    }
    callSampleVis();

    //add intro footer height
    var hDiff = $(window).height() - $('.js-intro-last').outerHeight();
    $('.js-intro-last').css('margin-bottom', Math.max(hDiff, E.footerHeight) + 'px');

    //scroll
    var scrolled = _.debounce(checkView, 100);
    $(window).scroll(scrolled);

    //go home
    $('.js-goHome').mouseover(function() {
        $(this).addClass('home-over');
    }).click(function() {
        console.log('---go home');
        resetToIntro();
    }).mouseout(function() {
        $(this).removeClass('home-over');
    });

    //go to match view
    $('.js-go-match').click(function() {
        var id = $(this).data().value;
        if (id === '_sample1' || id === '_sample2') {
            firstUserId = id;
            $.ajax({
                url: 'users/_match.json'
            }).done(function (d) {
                initVisMatch(d);
            });
        } else {
            resetToIntro(true);
            renderFriends(id, $(this).data().friends);
        }
    });

    //go to single view
    $('.js-goSingle').click(function() {
        var id = $(this).data().value;
        if (id === '_sample1' || id === '_sample2') {
            firstUserId = undefined;
            $.ajax({
                url: 'users/' + id + '.json'
            }).done(function (d) {
                initVisSingle(d);
            });
        } else {
            if (localStorage[id]) {
                initVisSingle(JSON.parse(localStorage.getItem(id)));
            } else {
                console.log('----');
                resetToIntro(true);
                socket.emit('userId', { userId: id, firstUserId: undefined });
            }
        }
    });

    //remove sessions
    $('.js-remove').click(function() {
        $('.js-sessions').toggle();
    });
    $('.js-sessions-items').find('i').click(function () {
        $(this).parent().remove();
        var val = $(this).parent().data().value;
        localStorage.removeItem(val);
        sessions = _.without(sessions, val);
        var currentUrl = window.location.href.split('/');
        if (currentUrl[currentUrl.length - 1] === val) {
            resetToIntro();
        }
    });

    //header/footer slide
    $('.js-intro-slide').click(function() {
        if ($('.js-intro').hasClass('hide')) {
            resetToIntro();
        }
        $('html body').animate({
            scrollTop: getHeightSum(+$(this).data().value, 'intro', 42)
        });
    });

    //vis slide
    $('.js-slide').click(function() {
        $('html body').animate({
            scrollTop: getHeightSum(+$(this).data().value,
                firstUserId ? 'match' : 'single',
                0)
            });
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
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

    //social media
    $('.js-social').mouseover(function() {
        $(this).css('cursor', 'pointer');
    }).click(function() {
        var val = $(this).data().value;
        window.open(E.msgs.share[val]);
    });

});