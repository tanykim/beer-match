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
    function renderFriends(userId, friendCount, data) {

        firstUserId = userId;
        //console.log('3--. two users match', userId, friendCount);
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
                initVisSingle(data);
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

        $('.js-start-single').click(function() {
            console.log('3--. single user vis');
            initVisSingle(data);
        });

        $('.js-start-match').click(function() {
            console.log('3--. match vis');
            renderFriends(userId, data.userinfo.friendCount, data);
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
            } else {
                $('.js-intro-header').removeClass('header-scrolled');
            }
        } else {
            positionVisTitle();
        }
    }

    /************************/
    /* socket communication */
    /************************/

    var uIdURL = urlParts[urlParts.length-1];

    //FOR TEST : delete later, data generating mode
    if (uIdURL.indexOf('---') > -1) {
        //console.log('---dataset generating mode');
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

    //FOR TEST: directly go to single view
    socket.on('dataExistTest', function (data) {
        var userId = data.userId;
        //console.log('---json exists');
        $.ajax({
            url: '/users/' + userId + '.json'
        }).done(function (d) {
           if (firstUserId) {
               socket.emit('pair', { users: [$('.js-go-match').data().value, userId] });
           } else {
                //show directly vis
                initVisSingle(d);
                //show option
                //renderVisOptions(E.msgs.intro.back, d);
           }
        });
    });

    socket.on('error', function (data) {
        renderIntro(E.msgs.intro.diffName, data.error_detail);
    });

    socket.on('profile', function (data) {
        $('.js-intro-status').html('');
        renderUserInfo(data);
    });

    socket.on('progress', function (data) {
        var progress = Math.round(data.count/data.total * 100);
        $('.js-start').removeClass('underline')
            .html(progress <= 100 ? progress + '%' : 'Analyzing...');
    });

    socket.on('success', function (data) {
        if (firstUserId) {
            firstUserId = undefined;
            initVisSingle(data.data);
        } else {
            renderVisOptions(E.msgs.intro.completed, data.data);
        }
    });

    socket.on('pair', function (data) {
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

    //add intro footer height
    var hDiff = $(window).height() - $('.js-intro-last').outerHeight();
    $('.js-intro-last').css('margin-bottom', Math.max(hDiff, E.footerHeight) + 'px');

    //go home
    $('.js-goHome').mouseover(function() {
        $(this).addClass('home-over');
    }).click(function() {
        console.log('---go home');
        resetToIntro();
    }).mouseout(function() {
        $(this).removeClass('home-over');
    });

    var scrolled = _.debounce(checkView, 100);
    $(window).scroll(scrolled);

    //go to match view
    $('.js-go-match').click(function() {
        console.log('---go match', $(this).data().value);
        $('.js-single').addClass('hide');
        $('.js-nav').hide();
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
        $('.js-go-match').addClass('hide');
        $('.js-intro').removeClass('hide');
        $('.js-intro-main').html('LOADING...');
        renderFriends($(this).data().value, undefined);
    });

    //go to single view
    $('.js-goSingle').click(function() {
        console.log('--go single');
        socket.emit('userId', { userId: $(this).data().value, firstUserId: undefined });
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