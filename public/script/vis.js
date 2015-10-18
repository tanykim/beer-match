define(['moment', 'vis-settings',
    'single-count', 'single-ratings', 'single-beers',
    'single-when', 'single-where', 'single-whenWhere',
    'match-score', 'match-behavior', 'match-style',
    'match-both', 'match-time', 'match-venues'],

    function (moment, S, Count, Ratings, Beers, When, Where, WhenWhere,
        Score, Behavior, Styles, Both, Time, Venues) {

    'use strict';

    function setDummyHeight(sort) {
        var hDiff = $(window).height() - $('.js-' + sort + '-contents-5').outerHeight();
        $('.js-' + sort + '-wrapper').css('margin-bottom', Math.max(hDiff, E.footerHeight) + 'px');
    }

    var startVis = function(b) {

        //view change
        $('.js-single-svg').empty();

        //0--count
        var countScale = function (length) {
            return S.getChroma(
                E.colors.calendar, length);
        };
        S.changeRadioSelection($('.js-count-period-' + b.avgUnit));

        Count.setUnit(b.avgUnit,
            countScale(b.countByPeriod.frequency[b.avgUnit].counts.length));
        S.setVis('frequency', function (vis) {
            Count.drawFrequency(vis, b.countByPeriod, b.avgCount);
        });
        Count.drawCalendar(S.setVisNoSVG('calendar'), b.timeRange,
            b.countByPeriod);
        $('.js-count-period').click(function() {
            var changed = S.changeRadioSelection($(this));
            if (changed) {
                var unit = $(this).data().value;
                Count.transformCount(unit,
                    countScale(b.countByPeriod.frequency[unit].counts.length),
                    b.countByPeriod, b.avgCount);
            }
        });

        //1--ratings
        //revert to the first category
        S.resetRadioSelect('js-ratings-title', 'style');
        Ratings.drawCategories(S.setVisNoSVG('categories'), 'style', b.userinfo.checkinCount, b.ratingsList);
        Ratings.drawRatings(S.setVisNoSVG('ratings'), b.scoreAvg);

        //select category
        $('.js-ratings-title').click(function() {
            var changed = S.changeRadioSelection($(this));
            if (changed) {
                var category = $(this).data().value;
                S.resetRadioSelect('js-ratings-sortBy', 'count');
                Ratings.updateVis(category);
                Ratings.drawRatings();
            }
        });

        //sort bar chart
        $('.js-ratings-sortBy').click(function() {
            var changed = S.changeRadioSelection($(this));
            if (changed) {
                Ratings.transformRatingsBar($(this).data().value);
            }
        });

        S.setVis('score', function (vis) {
            Ratings.drawScoresStats(vis, b.scoreAvg, b.scoreCount);
        });

        //2--beers loved and hated
        Beers.putBeers(b.beerList);
        S.setVis('beers', function (vis) {
            Beers.drawBeers(vis, b.ratingsList);
            Beers.updateCenterBeer(
                (!_.isEmpty(b.beerList.loves) ?
                 b.beerList.loves[0].list[0] :
                 b.beerList.mosts[0].list[0]), b.maxCount);
        });
        $('.js-beers-images').find('img').click(function (e) {
            S.updateSelection($(this), 'img');
            var val = $(this).data().value.split('-');
            Beers.updateCenterBeer(b.beerList[val[0]][val[1]].list[val[2]], b.maxCount);
        });

        //3--when
        var whenScale = function (length) {
            return S.getChroma([E.colors.when, '#000'], length);
        };
        S.setVis('when', function (vis) {
            var chromaVals = E.getAxisTicks(b.maxValsForWhen.matrix);
            When.drawMatrix(vis, b.byDay, b.byHour, b.maxValsForWhen,
                chromaVals.endPoint, chromaVals.count, whenScale(chromaVals.count));
        });
        $('.js-when-switch').click(function() {
            var changed = S.changeRadioSelection($(this));
            if (changed) {
                When.updateGraph($(this).data().value);
            }
        });


        //4-where
        if (!_.isEmpty(b.locationList)) {
            $('.js-where-map').removeClass('hide');
            $('.js-where-noData').addClass('hide');
            Where.createHeatmap(b.locationList);
            Where.drawVenueConnection(b.venues, S.setVisNoSVG('where'));
            WhenWhere.drawTimeline(b.venueByTime, b.venueByTimeUnit,
                b.timeRange, S.setVisNoSVG('timeline'));
        } else {
            $('.js-where-noData').removeClass('hide');
            $('.js-where-map').addClass('hide');
        }

        //5-when and where
        S.setVis('day', function (vis) {
            WhenWhere.drawDayStats(vis, b.byDay);
        });

        //add dummy height
        setDummyHeight('single');
    };

    var startVisMatch = function (m) {

        $('.js-match-svg').empty();

        console.log('---match view');

        //0--match scores
        Score.putScore(m.profile, m.matchScore, m.matchList);

        //1--behavior
        S.setVis('behavior', function (vis) {
            Behavior.drawBehavior(vis, m.behavior);
        });
        S.setVis('detail', function (vis) {
            Behavior.drawDetail(vis, m.avgCount);
        });

        //2--beer list
        S.setVis('distinctive', function (vis) {
            Both.drawDistinctive(vis, m.distinctive);
        });
        Both.putBoth(m.beersList);

        //3--style
        Styles.drawChord(m.styles);

        //4--timeline
        S.setVis('time', function (vis) {
            Time.drawTimeline(vis, m.byDay, m.byHour, m.byDayHour, m.profile);
        });
        $('.js-time-switch').click(function() {
            var changed = S.changeRadioSelection($(this));
            if (changed) {
                var type = $(this).data().type;
                var selected = $(this).data().value;
                Time.updateGraph(type, selected);
            }
        });

        //5-venues
        S.setVis('publicRatio', function (vis) {
            Venues.drawPublicRatio(vis, m.publicCount, m.profile);
        });
        if (m.topVenueTypes[0].length + m.topVenueTypes[1].length > 1) {
            Venues.drawTopTypes(S.setVisNoSVG('topTypes'), m.topVenueTypes);
        }
        $('.js-venues-switch').click(function() {
            var changed = S.changeRadioSelection($(this));
            if (changed) {
                Venues.updateGraph($(this).data().value);
            }
        });
        if (!_.isEmpty(m.venues)) {
            Venues.drawCommonVenues(S.setVisNoSVG('commonVenues'), m.venues);
        }

        //add dummy height
        setDummyHeight('match');

    };

    return {
        startVis: startVis,
        startVisMatch: startVisMatch
    };
});
