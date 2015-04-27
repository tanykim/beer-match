define(['moment', 'vis-settings', 'single-count', 'single-ratings', 'single-beers', 'single-when', 'single-where',
	'single-whenWhere', 'match-score', 'match-style', 'match-time', 'match-venues'],

	function (moment, S, Count, Ratings, Beers, When, Where, WhenWhere, Score, Styles, Time, Venues) {

	'use strict';

	function changeRadioSelection(elm, tag) {
		if (elm.hasClass('selected')) {
			return false;
		} else {
			if (!tag) {
				tag = 'span';
			}
			elm.parent().find(tag).removeClass('selected');
			elm.addClass('selected');
			return true;
		}
	}
	var startVis = function(b) {

		//view change
		$('.js-single-svg').empty();


		//0--count
		Count.setUnit(b.avgUnit);
		S.setVis('frequency', function (vis) {
			Count.drawFrequency(vis, b.countByPeriod, b.avgCount, b.avgUnit);
		});
		Count.drawCalendar(S.setVisNoSVG('calendar'), b.timeRange, b.countByPeriod, b.avgUnit);
		$('.js-count-period').click(function() {
			var changed = changeRadioSelection($(this));
			if (changed) {
				Count.transformCount($(this).data().value, b.countByPeriod, b.avgCount);
			}
		});

		//1--ratings
		S.setVis('score', function (vis) {
			Ratings.drawScoresStats(vis, b.scoreAvg, b.scoreCount);
		});
		S.setVisNoSVG('categories', function (vis) {
			_.each(E.category.list, function (c) {
				Ratings.drawCategories(vis, c, b.userinfo.checkinCount, b.ratingsList[c]);
			});
		});

		var category = 'style';
		var ratingsSortBy = 'count';
		Ratings.drawRatings(b.ratingsList[category], category, ratingsSortBy, b.scoreAvg, S.setVisNoSVG('ratings'));

		//select ratings key
		$('.js-ratings-title').click(function() {
			category = $(this).data().value;
			var changed = changeRadioSelection($(this));
			if (changed) {
				Ratings.drawRatings(b.ratingsList[category], category, ratingsSortBy);
			}
		});

		//sort bar chart
		$('.js-ratings-sortBy').click(function() {
			var changed = changeRadioSelection($(this));
			if (changed) {
				ratingsSortBy = $(this).data().value;
				Ratings.transformRatingsBar(b.ratingsList[category], ratingsSortBy);
			}
		});

		//2--beers loved and hated
		Beers.putBeers(b.beerList);
		S.setVis('beers', function (vis) {
			Beers.drawBeers(vis, b.ratingsList);
			Beers.updateCenterBeer(b.beerList.loves[0].list[0], b.maxCount);
		});
		$('.js-beers-images').click(function (e) {
			var target = $(e.target);
			if (target.prop('tagName') === 'IMG') {
				changeRadioSelection($(target), 'img');
				var val = target.data().value.split('-');
				Beers.updateCenterBeer(b.beerList[val[0]][val[1]].list[val[2]], b.maxCount);
			}
		});

		//3--when
		S.setVis('when', function (vis) {
			When.drawMatrix(vis, b.byDay, b.byHour);
		});
		$('.js-when-switch').click(function() {
			var changed = changeRadioSelection($(this));
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
		WhenWhere.drawTimeline(b.venueByTime, b.timeRange, S.setVisNoSVG('timeline'));

	};

	var startVisMatch = function (m) {

		$('.js-match-svg').empty();

		console.log('---match view');

		//0--match scores
		Score.putScore(m.matchScore, m.matchList);
		S.setVis('behavior', function (vis) {
			Score.drawBehavior(vis, m.behavior);
		});

		//1--average count
		S.setVis('counts', function (vis) {
			Score.drawCount(vis, m.avgCount);
		});
		Styles.drawChord(m.styles);
		Score.drawBoth(m.beersList, m.distinctive);
		Time.drawTimeline(m.byDay, m.byHour, m.byDayHour);
		Venues.init(m.publicCount, m.topVenueTypes);
		if (!_.isEmpty(m.venues)) {
			Venues.drawCommonVenues(m.venues);
		}

	};

	return {
		startVis: startVis,
		startVisMatch: startVisMatch
	};
});
