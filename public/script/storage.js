define(['jquery', 'underscore', 'socketio', 'moment'], function ($, _, io, moment) {

    'use strict';

    var sessions = [];

    function checkSessionLength() {
        function removeItem(len) {
            if (len > 10) {
                localStorage.removeItem(sessions[0][0]);
                sessions.shift();
                $('.js-sessions-items li:last-child').remove();
                checkSessionLength();
            } else if (len === 0) {
                $('.js-remove').hide();
            }
        }
        removeItem(sessions.length);
    }

    function setLocalStorageItem(key, val, socket) {
        checkSessionLength();
        localStorage.setItem(key, val);
        $('.js-sessions-items').prepend('<li data-value="' + key + '">' +
            key + ' <i class="fa fa-times-circle link"></i>' +
            '</li>');
        sessions.push([key, moment().unix()]);
        if (sessions.length > 0) {
            $('.js-remove').show();
        }
        callSessionInteraction(socket);
    }

    function callSessionInteraction(socket) {

        $('.js-remove').click(function() {
            $('.js-sessions').toggle();
        });
        $('.js-sessions-items').find('i').click(function () {
            $(this).parent().remove();
            var key = $(this).parent().data().value;
            localStorage.removeItem(key);

            //remove the selected key from the session
            sessions = _.filter(sessions, function (d) {
                return d[0] !== key;
            });
            if (sessions.length === 0) {
                $('.js-remove').hide();;
            }
            var url = key;
            if (key.indexOf('+') > -1) {
                url = key.split('+')[0] + '/' + key.split('+')[1];
            }
            if (window.location.hash === '#/' + url) {
                socket.emit('reset');
            }
        });
    }

    function init(socket) {
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

        if (sessions[0][0] === 'debug') {
            sessions.shift();
        }
        if (sessions.length > 0) {
            _.each(_.clone(sessions).reverse(), function (d) {
                $('.js-sessions-items').append('<li data-value="' + d[0] + '">' +
                    d[0] + ' <i class="fa fa-times-circle link js-session-button"></i>' +
                    '</li>');
            });
        }
        checkSessionLength();
        callSessionInteraction(socket);
    }

    function getSessions() {
        return sessions;
    }

    return {
        init: init,
        setLocalStorageItem: setLocalStorageItem,
        getSessions: getSessions
    };
});