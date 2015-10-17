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
    'elements'
], function ($, _, d3, moment, chroma, textures, io, Vis, E) {

    'use strict';

    var urlParts = window.location.href.split('/');
    var socket = io.connect('http://' + urlParts[2]);

    var firstUserId;
    var prevTitle = 0;

    function initVisCommon(sel, other, html, url) {

        window.history.pushState('object or string', 'Title', url);

        $('.js-intro').addClass('hide');
        $('.js-nav').show();
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

    //initiate single vis
    function initVisSingle(data) {

        var u = data.userinfo;

        $('.js-go-match').attr('data-value', u.userId);
        $('.js-go-match').attr('data-friends', u.friendCount);

        var html = {
            avatar: u.avatar,
            name: u.username,
            address: u.address,
            checkinCount: u.checkinCount
        };
        initVisCommon('single', 'match', html, u.userId);
        Vis.startVis(data);
    }

    //match
    function initVisMatch(d) {

        var data = d.data;

        $('.js-goSingle-0').html(data.userinfo[0].userId.toUpperCase())
            .attr('data-value', data.userinfo[0].userId);
        $('.js-goSingle-1').html(data.userinfo[1].userId.toUpperCase())
            .attr('data-value', data.userinfo[1].userId);

        var html = {
            avatar0: data.userinfo[0].avatar,
            avatar1: data.userinfo[1].avatar,
            name0: data.userinfo[0].username,
            name1: data.userinfo[1].username,
        };﻿
        initVisCommon('match', 'single', html, data.url);
        Vis.startVisMatch(data);
    }

    // default text input
    function renderIntro(desc, warning, userId, friends) {

        var template = _.template($('#intro-start').html());
        $('.js-intro-main').html(template({
            desc: desc,
            warning: warning,
            userId: userId,
            friends: friends,
            firstUserId: firstUserId? firstUserId.toUpperCase() : ''
        }));﻿

        if (!userId) {
            $('.js-intro-input').focus();
        }
    }

    //download
    function startDownload(d, tz) {
        $('.js-start').click(function() {
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
            $('.js-start').removeClass('disabled').addClass('link underline');
            startDownload(data, newTimezone);
        });
    }

    //render friends list after the first user is loaded
    function renderFriends(userId, friendCount, data, isTopMenu) {

        firstUserId = userId;
        console.log('3--. two users match', userId, friendCount);
        socket.emit('friends', { userId: userId, count: friendCount });
        socket.on('friends', function (d) {
            var friends = d.friends;
            var msg = friends ? E.msgs.intro.friends : E.msgs.intro.noFriends;
            renderIntro(msg, '', '', friends);
            $('.js-friend-select').change(function() {
                var friend = $(this).val();
                socket.emit('userId', { userId: friend, firstUserId: userId });
            });
            $('.js-start-single').click(function() {
                if (isTopMenu) {
                    socket.emit('userId', { userId: uIdURL });
                } else {
                    initVisSingle(data);
                }
            });
        });
    }

    //after loading the first user
    function renderVisOptions(msg, data) {

        console.log(data);
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
            console.log('3--. match vis');
            if (data.userinfo.userId === '_sample1' ||
                data.userinfo.userId === '_sample2') {
                $.ajax({
                    url: 'users/_match.json'
                }).done(function (d) {
                    initVisMatch(d);
                });
            } else {
                renderFriends(userId, data.userinfo.friendCount, data);
            }
        });
    }

    function resetToIntro() {
        $('.js-single').addClass('hide');
        $('.js-match').addClass('hide');
        $('.js-nav').hide();
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        $('.js-intro').removeClass('hide');
        window.history.pushState('object or string', 'Title', '/');
        firstUserId = undefined;
        renderIntro(E.msgs.intro.init, '');
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

    function updateSampleData(data) {
        var dCount = moment()
            .diff(moment(data.timeRange[1], 'YYYYMMDD'), 'days');
        var wCount = Math.floor(dCount/7);
        var newEd = moment(data.timeRange[1], 'YYYYMMDD').add(wCount, 'weeks');
        data.timeRange = _.map(data.timeRange, function (d) {
            return moment(d, 'YYYYMMDD').add(wCount, 'weeks')
                .format('YYYYMMDD');
        });
    }

    /************************/
    /* socket communication */
    /************************/

    var uIdURL = urlParts[urlParts.length-1];

    //check url first
    //TEST: delete later, data generating mode
    if (uIdURL.indexOf('---') > -1) {
        socket.emit('dataset', { userId: uIdURL.split('---')[1] });
    } else if (uIdURL.indexOf('+') > -1) {
        //console.log('1---two users');
        //FIXME: loading needed
        firstUserId = uIdURL.split('+')[0];
        socket.emit('pair', { users: uIdURL.split('+') });
    } else if (uIdURL) {
        //console.log('1---single user');
        renderIntro('', E.msgs.intro.userIdCheck, uIdURL);
        socket.emit('userId', { userId: uIdURL });
    } else {
        //console.log('1---no url');
        renderIntro(E.msgs.intro.init, '', '');
    }

    socket.on('error', function (data) {
        renderIntro(E.msgs.intro.diffName, data.error_detail);
    }).on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    }).on('progress', function (data) {
        var progress = Math.round(data.count/data.total * 100);
        $('.js-start').removeClass('underline')
            .html(progress < 100 ? progress + '%' : 'Analyzing...');
    }).on('success', function (data) {
        if (data.sample) {
            firstUserId = '_example1';
            var dataset = updateSampleData(data.data);
            initVisSingle(data.data);
        } else if (firstUserId) {
            firstUserId = undefined;
            initVisSingle(data.data);
        } else {
            renderVisOptions(E.msgs.intro.completed, data.data);
        }
    }).on('pair', function (data) {
        initVisMatch(data);
    });

    /********************/
    /* View interaction */
    /********************/

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
                console.log('---entered');
                renderIntro('', E.msgs.intro.userIdCheck, userId);
                socket.emit('userId', { userId: userId, firstUserId: firstUserId });
            }
        }
    });

    //intro sample vis
    $('.js-start-sample-single').click(function() {
        socket.emit('userId', { userId: '_sample1', sample: true });
    });
    $('.js-start-sample-match').click(function() {
        socket.emit('pair', { users: ['_sample1', '_sample2'], sample: true });
    });

    //add intro footer height
    var hDiff = $(window).height() - $('.js-intro-last').outerHeight();
    $('.js-intro-last')
        .css('margin-bottom', Math.max(hDiff, E.footerHeight) + 'px');

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
        console.log('---go match', id);

        if (id === '_sample1' || id === '_sample2') {
            firstUserId = id;
            $.ajax({
                url: 'users/_match.json'
            }).done(function (d) {
                initVisMatch(d);
            });
        } else {
            $('.js-single').addClass('hide');
            $('.js-nav').hide();
            $('.js-intro').removeClass('hide');
            $('.js-intro-main').html('LOADING...');
            renderFriends($(this).data().value, $(this).data().friends, undefined, true);
        }
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        $('.js-go-match').addClass('hide');
    });

    //go to single view
    $('.js-goSingle').click(function() {

        var id = $(this).data().value;
        console.log('--go single', id);

        if (id === '_sample1' || id === '_sample2') {
            firstUserId = undefined;
            $.ajax({
                url: 'users/' + id + '.json'
            }).done(function (d) {
                initVisSingle(d);
            });
        } else {
            socket.emit('userId',
                { userId: $(this).data().value, firstUserId: undefined });
        }
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
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