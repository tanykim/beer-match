define(['moment', 'vis-settings',
	'single-count', 'single-ratings', 'single-beers',
	'single-when', 'single-where', 'single-whenWhere',
	'match-score', 'match-behavior', 'match-style',
	'match-both', 'match-time', 'match-venues'],

	function (moment, S, Count, Ratings, Beers, When, Where, WhenWhere,
		Score, Behavior, Styles, Both, Time, Venues) {

	'use strict';

	var startVis = function(b) {

		//view change
		$('.js-single-svg').empty();

		//0--count
		var countScale = function (length) {
			return S.getChroma(
				E.colors.calendar, length);
		}
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
		S.setVisNoSVG('categories', function (vis) {
			Ratings.drawCategories(vis, 'style', b.userinfo.checkinCount,
				b.ratingsList);
		});
		Ratings.drawRatings(S.setVisNoSVG('ratings'), b.scoreAvg);

		//select category
		$('.js-ratings-title').click(function() {
			var changed = S.changeRadioSelection($(this));
			if (changed) {
				var category = $(this).data().value;
				//revert to the first choice
				_.each($('.js-ratings-sortBy'), function (d) {
					if ($(d).data().value === 'count') {
						$(d).addClass('slected');
						$(d).find('i').removeClass('fa-circle-o').addClass('fa-dot-circle-o');
					} else {
						$(d).removeClass('slected');
						$(d).find('i').removeClass('fa-dot-circle-o').addClass('fa-circle-o');
					}
				});
				Ratings.updateVis(b.ratingsList[category], category);
				Ratings.drawRatings(null, b.scoreAvg);
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
			Beers.updateCenterBeer(b.beerList.loves[0].list[0], b.maxCount);
		});
		$('.js-beers-images').find('img').click(function (e) {
			S.updateSelection($(this), 'img');
			var val = $(this).data().value.split('-');
			Beers.updateCenterBeer(b.beerList[val[0]][val[1]].list[val[2]], b.maxCount);
		});

		//3--when
		var whenScale = function (length) {
			return S.getChroma(['#fff', '#7c2529'], length);
		}
		S.setVis('when', function (vis) {
			When.drawMatrix(vis, b.byDay, b.byHour, whenScale(10));
		});
		$('.js-when-switch').click(function() {
			var changed = S.changeRadioSelection($(this));
			if (changed) {
				When.updateGraph($(this).data().value);
			}
		});

		//4-where
		Where.createHeatmap(b.locationList);
		Where.drawVenueConnection(b.venues, S.setVisNoSVG('where'));

		//5-when and where
		S.setVis('day', function (vis) {
			WhenWhere.drawDayStats(vis, b.byDay);
		});
		WhenWhere.drawTimeline(b.venueByTime, b.venueByTimeUnit, b.timeRange, S.setVisNoSVG('timeline'));
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

		// //1--average count
		// S.setVis('counts', function (vis) {
		// 	Score.drawCount(vis, m.avgCount);
		// });
		// Styles.drawChord(m.styles);
		// Both.drawBoth(m.beersList, m.distinctive);
		// Time.drawTimeline(m.byDay, m.byHour, m.byDayHour);
		// Venues.init(m.publicCount, m.topVenueTypes);
		// if (!_.isEmpty(m.venues)) {
		// 	Venues.drawCommonVenues(m.venues);
		// }

	};

	return {
		startVis: startVis,
		startVisMatch: startVisMatch
	};
});
