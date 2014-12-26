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
        socketio: '../socket.io/socket.io',
        beer: 'beer'
  }

});
 
require([
    'jquery',
    'underscore',
    'd3',
    'moment',
    'socketio',
    'beer'
], function ($, _, d3, moment, io, Beer)  {

    //test
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


    //communication with server
    var socket = io.connect('http://localhost:8080');

    function putIntroUserInfo(data) {

        function callStart() {
            $('.js-start').show().removeClass('disabled').addClass('link underline')
                .click(function() {
                    window.history.pushState('object or string', 'Title', userinfo.userId);
                    $(this).hide();
                    socket.emit('timezone', {
                        userinfo: userinfo,
                        name: newTimezone ? newTimezone : data.timezone.name
                    });
            });     
        }

        var userinfo = data.userinfo;

        //show and hide
        $('.js-intro-status').html('We found you!');
        $('.js-intro-enter').hide();
        $('.js-intro-user').show();
            
        $('.js-user-pic').css('background-image', 'url(' + userinfo.avatar + ')');
        $('.js-user-name').html(userinfo.username);
        if (userinfo.address) {
            $('.js-location').html('from ' + userinfo.address);
            $('.js-timezone-noData').hide();
            $('.js-timezone-data-id').html(data.timezone.name +
                ' (UTC' + (data.timezone.offset >= 0 ? '+' : '') + data.timezone.offset/3600 + 'h)');
            callStart();
        } else {
            $('.js-location').hide();
            $('.js-timezone-data').hide();
            $('.js-timezone-list').show();
        }

        //timezone select
        var newTimezone;
        $('.js-timezone-switch').click(function() {
            $('.js-timezone-list').show();
        });
        $('.js-timezone-select').change(function() {
            console.log('----', $(this).val());
            newTimezone = $(this).val();
            callStart();
        });
    }

    function initIntroUserInfo(data, vis) {

        function createBeerData(data, callback) {       
            var beer = new Beer(data.userinfo, data.timezone, data.checkins);
            callback(beer);
        }

        createBeerData(data, function (b) {
            window.history.pushState('object or string', 'Title', b.userId);
            b.startVis();
        });
    }

    function getJSONfile(userId) {
        $.ajax({
            url: '/users/' + userId + '.json'
        }).done(function(data) {
            initIntroUserInfo(data, true);
        });
    }

    //intro interaction functions
    function resetInputBox() {
            $('.js-intro-input').removeAttr('disabled').val('');
            $('.js-intro-input').focus();       
        window.history.pushState('object or string', 'Title', '/');     
    }
    function resetIntro() {
        $('.js-intro-user').hide();
        $('.js-intro-enter').show();
        $('.js-location').show();
        $('.js-timezone-data').show();
        $('.js-timezone-noData').show();
        $('.js-timezone-list').hide();
    }

    //FIXME for testing
    var testMode = false;
    if (testMode) {
        getJSONfile('gregavola');
    }

    //check url first
    var urlParts = window.location.href.split('/');
    var userId = urlParts[urlParts.length-1];
    if (userId) {
        $('.js-intro-status').html('...');
        $('.js-intro-input').attr('value', userId);
        socket.emit('userId', { userId: userId });
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
            if ($(this).val().length < 5) {
                $('.js-intro-status').html('Should be at least 5 characters.' +
                    '<br/> Try a different name.');
                resetInputBox();
            } else {
                socket.emit('userId', { userId: $(this).val() });
                $(this).attr('disabled', 'disabled');
                $('.js-intro-status').html('...');
            }
        }
    });

    //receive data from the server
    socket.on('dataExist', function (data) {
        userId = data.userId;
        console.log('---json exists');
        getJSONfile(data.userId);
    });

    socket.on('error', function (data) {
        console.log(data);
        $('.js-intro-status').html(data.error_detail +
            '<br/> Try a different name.');
        resetInputBox();
    });

    socket.on('profile', function (data) {
        $('.js-intro-status').html('');
        putIntroUserInfo(data);
    });

    socket.on('progress', function (data) {
        $('.js-intro-status').html(data.count + '/' + data.total);
    });

    socket.on('success', function (data) {
        userId = data.userId;
        console.log(data.userId);
        console.log(data.data);
        initIntroUserInfo(data.data);
    });

    //sign out
    $('.js-signout').click(function() {
        socket.emit('signout', { userId: userId });
    });
    socket.on('signout', function (data) {      
        $('.js-vis').hide();        
        $('.js-intro').show();
        $('.js-intro-status').html(data.userId.toUpperCase() + ' is safely signed out!');
        resetIntro();
        resetInputBox();
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