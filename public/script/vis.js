define(['moment', 'vis-settings', 'single-count', 'single-ratings', 'single-beers', 'single-when', 'single-where',
	'match-score', 'match-style', 'match-time', 'match-venues'],

	function (moment, S, Count, Ratings, Beers, When, Where, Score, Styles, Time, Venues) {

	'use strict';

	function changeRaioSelection(elm, tag) {
		if (!tag) {
			tag = 'span';
		}
		elm.parent().find(tag).removeClass('selected');
		elm.addClass('selected');
	}
	var startVis = function(b) {

		//view change
		$('.js-single-svg').empty();

		//0--count
		Count.setUnit = Count.setUnit(b.avgUnit);
		S.setVis('frequency', function (vis) {
			Count.drawFrequency(vis, b.countByPeriod, b.avgCount, b.avgUnit);
		});
		Count.drawCalendar(S.setVisNoSVG('calendar'), b.timeRange, b.countByPeriod, b.avgUnit);
		$('.js-count-period').click(function() {
			changeRaioSelection($(this));
			Count.transformCount($(this).data().value, b.countByPeriod, b.avgCount);
		});

		//1--ratings
		S.setVis('score', function (vis) {
			Ratings.drawScoresStats(vis, b.scoreAvg, b.scoreCount);
		});
		S.setVisNoSVG('categories', function (vis) {
			_.each(E.categoryList, function (c) {
				Ratings.drawCategories(vis, c, b.userinfo.checkinCount, b.ratingsList[c]);
			});
		});

		var category = 'style';
		var ratingsSortBy = 'count';
		Ratings.drawRatings(b.ratingsList[category], category, ratingsSortBy, b.scoreAvg, S.setVisNoSVG('ratings'));

		//select ratings key
		$('.js-ratings-title').click(function() {
			category = $(this).data().value;
			changeRaioSelection($(this));
			Ratings.drawRatings(b.ratingsList[category], category, ratingsSortBy);
		});

		//sort bar chart
		$('.js-ratings-sortBy').click(function() {
			changeRaioSelection($(this));
			ratingsSortBy = $(this).data().value;
			Ratings.transformRatingsBar(b.ratingsList[category], ratingsSortBy);
		});


		//3--beers loved and hated
		Beers.putBeers(b.beerList);
		S.setVis('beers', function (vis) {
			Beers.drawBeers(vis, b.ratingsList);
			Beers.updateCenterBeer(b.beerList.loves[0].list[0], b.maxCount);
		});
		$('.js-beers-images').click(function (e) {
			var target = $(e.target);
			if (target.prop('tagName') === 'IMG') {
				changeRaioSelection($(target), 'img');
				var val = target.data().value.split('-');
				Beers.updateCenterBeer(b.beerList[val[0]][val[1]].list[val[2]], b.maxCount);
			}
		});

		/*

		//4--when
		When.drawMatrix(b.byDay, b.byHour);
		//by day coxcomb chart
		When.drawDayStats(b.byDay);
		//by hour bar chart
		When.drawHourStats(b.byHour);

		//5--venue
		Where.drawVenueConnection(b.venues);
		Where.createHeatmap(b.locationList);
		var w1 = $('.js-venue-name').width();
		var w2 = $('.js-venue-type').width();
		var w3 = $('.js-venue-city').width();
		Where.putVenues(b.venues, w1, w2, w3);
		Where.drawTimeline(b.venueByTime, b.timeRange);
		*/
		//call interaction
		// callInteraction();

	};

	var startVisMatch = function (m) {

		$('.js-match-svg').empty();

		console.log('---match view');
		Score.putMatch(m.matchScore, m.matchList);
		Score.drawCount(m.avgCount);
		Score.drawBehavior(m.behavior);
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
