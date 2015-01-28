define(['moment', 'single-count', 'single-ratings', 'single-beers', 'single-when', 'single-where', 'match-score', 'match-style', 'match-time'], function (moment, Count, Ratings, Beers, When, Where, Score, Styles, Time) {

	function callInteraction() {

		//vis menu show/hide
		$('.js-menu-open').click(function() {
			$('.js-menu-close').show();
			$('.js-menu-open').hide();
			$('.js-vis-menu').fadeIn();
		});
		$('.js-menu-close').click(function() {
			$('.js-menu-close').hide();
			$('.js-menu-open').show();
			$('.js-vis-menu').fadeOut();
		});

		//get vis position
    	var titleStr = [
    		'How much do I drink?',
    		'What matters?',
    		'Beers I love & hate',
    		'When do I drink?',
    		'Where do I drink?'
    	];
    	var prevTitle = 0;
		function changeVisTitle(i) {
			if (i !== prevTitle) {
				$('.js-title-overlaid').fadeOut('fast', function() {
			 		$(this).text(titleStr[i]);
				}).fadeIn('fast');
		        $('.js-slide').removeClass('selected');
				$('.js-vis-menu-' + i).addClass('selected');
				prevTitle = i;
			}
		};
		function getHeightSum (num) {
	        return _.reduce(_.map(_.range(0, num), function(i) {
	                    return $('.js-single-contents-' + i).outerHeight();
	                }), function (memo, num) {
	        			return memo + num;
	        		}, 0);
    	};
		//vis slide
		$('.js-slide').click(function() {
			$('html body').animate({ scrollTop: getHeightSum(+$(this).data().value) });
		});
	    //scroll
	    function positionVisTitle() {
	        for (var i = 1; i < 6; i++) {
	        	var diff = $(window).scrollTop() - getHeightSum(i);
	        	if (diff < -30 ) {
	        		changeVisTitle(i-1);
	        		break;
	        	}
	        }
	    }
	    var scrolled = _.debounce(positionVisTitle, 100);
	    $(window).scroll(scrolled);

	    //add footer height
	    var hDiff = $(window).height() - $('.js-single-contents-4').outerHeight();
	    if (hDiff > 0) {
	    	$('.js-single-contents-dummy').css('height', (hDiff - 100) + 'px');
	    }
	}

	var startVis = function(b) {

		//view change
		$('.js-single-svg').empty();
		var timeRange = _.map(b.timeRange, function (d) {
            return moment(d.slice(0, 9), 'YYYY-MM-DD').startOf('month')._d;
        });
        var monthDiff = moment(timeRange[1]).diff(timeRange[0], 'months');

        if (monthDiff > 0) {
			Beers.drawTrends(b.allBeers, timeRange, monthDiff);
		}

		/*
		//1--count
		$('.js-count-sort-' + b.avgUnit).prop('checked', true);
		Count.putCount(b.userinfo.checkinCount, b.avgCount, b.avgUnit);
		var vF = Count.drawFrequency(b.countByPeriod, b.avgCount, b.avgUnit);
		var calBlock = Count.drawCalendar(b.timeRange, b.countByPeriod, b.avgUnit);
		$('input[name=period]').click(function() {
			Count.transformCount(b.countByPeriod, b.avgCount, calBlock, vF);
		});

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

		//3--beers loved and htated
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
		Where.createHeatmap(b.locationList);
		var venues = b.venues;
		var w1 = $('.js-venue-name').width();
		var w2 = $('.js-venue-type').width();
		var w3 = $('.js-venue-city').width();
		Where.putVenues(venues, w1, w2, w3);

		*/
		//call interaction
		callInteraction();

	};

	var startVisMatch = function (m) {
		console.log('---match view');
		Score.putMatch(m.matchScore, m.matchList);
		Score.drawCount(m.avgCount);
		Score.drawBehavior(m.behavior);
		Styles.drawChord(m.styles);
		Score.drawBoth(m.beersList);
		Time.drawTimeline(m.byDay, m.byHour, m.byDayHour);
	};

	return {
		startVis: startVis,
		startVisMatch: startVisMatch
	};
});
