define(['moment', 'single-count', 'single-ratings', 'single-beers', 'single-when', 'single-where',
	'match-score', 'match-style', 'match-time', 'match-venues'],
	function (moment, Count, Ratings, Beers, When, Where, Score, Styles, Time, Venues) {

	var startVis = function(b) {

		//view change
		$('.js-single-svg').empty();


		//1--count
		$('.js-count-sort-' + b.avgUnit).prop('checked', true);
		Count.setUnit = Count.setUnit(b.avgUnit);
		var countFrequnecy = Count.drawFrequency(b.countByPeriod, b.avgCount, b.avgUnit);
		var countCalendar = Count.drawCalendar(b.timeRange, b.countByPeriod, b.avgUnit);
		$('.js-count-period').click(function() {
			console.log(Settings);

			$('.js-count-period').removeClass('selected');
			$(this).addClass('selected');
			Count.transformCount($(this).data().value, b.countByPeriod, b.avgCount, countCalendar, countFrequnecy);
		});

		/*
		//2--ratings chart
		// Ratings.drawScoresStats(b.scoreAvg, b.scoreCount);
		Ratings.drawNetwork(b.network);
		var ratingsKey = 'style';
		var vC = Ratings.drawCategories(b.userinfo.checkinCount, b.ratingsList);
		var vR = Ratings.drawRatings(b.ratingsList);
		Ratings.drawRatingsBar(vR, b.ratingsList[ratingsKey], ratingsKey, b.scoreAvg);
		//select ratings key
		$('.js-ratings-title').mouseover(function() {
			$(this).css('cursor', 'pointer');
		}).click(function() {
			ratingsKey = $(this).data().value;
			var id = $(this).data().id;
			$('.js-ratings-bg').attr('transform', 'translate (' +((id * vC.dim.w/4) + vC.dim.w/8 - vC.r - vC.margin.r) + ', 0)');
			Ratings.drawRatingsBar(vR, b.ratingsList[ratingsKey], ratingsKey, b.scoreAvg);
		});
		//sort bar chart
		$('input[name=sortBy]').click(function() {
			Ratings.transformRatingsBar(b.ratingsList[ratingsKey], vR.baseH);
		});

		//3--beers loved and hated
		var timeRange = _.map(b.timeRange, function (d) {
            return moment(d.slice(0, 9), 'YYYY-MM-DD').startOf('month')._d;
        });
        var monthDiff = moment(timeRange[1]).diff(timeRange[0], 'months');
        if (monthDiff > 0) {
			Beers.drawTrends(b.allBeers, timeRange, monthDiff);
		}
		var vB= Beers.drawFavoritesCenter(b.ratingsList);
		Beers.drawCenterBeer(vB, b.beerList.loves[0].list[0], b.maxCount);
		Beers.putFavorites(b.beerList, b.ratingsList, b.maxCount, vB);

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
