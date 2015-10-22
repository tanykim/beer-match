define(['jquery', 'underscore'], function ($, _) {

    'use strict';

    var prevTitle = 0;

    function isMatch() {
        var status = false;
        if ($('.js-vis').hasClass('hide')) {
            status = true;
        }
        return status;
    }

    function getHeightSum(num, view, offset) {
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
                .html(isMatch() ? E.msgs.titles.match[i] : E.msgs.titles.single[i]);
            $('.js-slide').removeClass('selected');
            $('.js-nav-' + i).addClass('selected');
            prevTitle = i;
        }
    }

    function positionVisTitle() {
        for (var i = 1; i < 7; i++) {
            var diff = $(window).scrollTop() - getHeightSum(i, isMatch() ? 'match' : 'single', 0);
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


    function init() {
        var scrolled = _.debounce(checkView, 100);
        $(window).scroll(scrolled);
    }

    //vis slide
    $('.js-slide').click(function() {
        $('html body').animate({
            scrollTop: getHeightSum(+$(this).data().value,
                isMatch() ? 'match' : 'single',
                0)
            });
        $('.js-nav-expand').addClass('hide');
        $('.js-nav-open').html('<i class="fa fa-chevron-right"></i>');
    });

    $('.js-intro-slide').click(function() {
        $('html body').animate({
            scrollTop: getHeightSum(+$(this).data().value, 'intro', 0)
        });
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

    return {
        init: init
    };
});
