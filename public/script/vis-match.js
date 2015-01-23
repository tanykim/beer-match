define(['vis-settings', 'moment'], function (Settings, moment) {

	var colors = Settings.colors;

	var putMatch = function (score, list) {
		
		//taste score
		$('.js-match-score').html(score + '%');
		_.each(list, function (d, key) {
			$('.js-match-score-' + key).html(d + '%');
		});
	};

	var drawBehavior = function (behavior) {

		var margin = { top: 40, right: 40, bottom: 40, left: 40 };
		var dim = { w: $('.behavior').width() - margin.left - margin.right,
					h: 200 };
		var x = d3.scale.ordinal().rangeBands([0, dim.w]).domain(_.keys(behavior));
		var y = d3.scale.linear().range([0, dim.h]).domain([1, -1]);

		var svg = d3.select('#vis-behavior').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		
		var lables = {
			count: ['Heavy Drinker', 'Light Drinker'], 
			explorer: ['Explorer', 'Loyal Patron'],
			weekend: ['Weekend', '7 Days'],
			social: ['Drinking Out', 'Recluse'],
			daytime: ['Daytime', 'After Sunset']
		};		
		var xAxis = d3.svg.axis().scale(x).orient('top').tickSize(-dim.h).tickPadding(10)
				.tickFormat( function (d) { return lables[d][0]; });
		var xAxisB = d3.svg.axis().scale(x).orient('bottom').tickSize(0).tickPadding(10)
				.tickFormat( function (d) { return lables[d][1]; });
		var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-dim.w).tickFormat('');
		
		svg.append('g')
			.attr('class', 'x axis')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxisB);
		svg.append('g')
			.attr('class', 'y axis')
			.call(yAxis);
		svg.append('line')
			.attr('class', 'behavior-line-center')
			.attr('x1', 0)
			.attr('x2', dim.w)
			.attr('y1', dim.h/2)
			.attr('y2', dim.h/2);

		var line = d3.svg.line()
			.x(function (d) { return x(d[0]) + dim.w / _.size(behavior) / 2; })
			.y(function (d) { return y(d[1]); });

		_.each(_.range(2), function (user) {
			var data = _.map(behavior, function (d, key) {
				return [key, d[user]];
			});
			svg.append('path')
				.datum(data)
				.attr('class', 'behavior-line-' + user)
				.attr('d', line);
			svg.selectAll('js-behavior-circle-' + user)
				.data(data)
				.enter().append('circle')
				.attr('class', 'behavior-circle-' + user + ' js-behavior-circle-' + user)
				.attr('cx', function (d) { return x(d[0]) + dim.w / _.size(behavior) / 2; })
				.attr('cy', function (d) { return y(d[1]); })
				.attr('r', 5);
		});	
	};

	var drawCount = function (count) {
		var avgUnit = 'week';
		if (count[0][avgUnit] + count[1][avgUnit] < 2) {
			avgUnit = 'month';
		} else if (count[0][avgUnit] + count[1][avgUnit] > 40) {
			avgUnit = 'day';
		}
		var avgCount = _.pluck(count, avgUnit);

		var dim = { w: $('.counts').width(), h: 200 };
		var svg = d3.select('#vis-counts').append('svg')
			.attr('width', dim.w)
			.attr('height', dim.h)
			.append('g');

		var maxR = dim.h / 2;

		var gap = 20;
		_.each(avgCount, function (d, i)  {
			var x = dim.w / 2 + (dim.h / 2 + gap / 2) * (i === 0 ? -1 : 1);
			var r =  Math.sqrt(d * (dim.h / 2) * (dim.h / 2) / _.max(avgCount));
			svg.append('circle')
				.attr('cx', x)
				.attr('cy', dim.h / 2)
				.attr('r', r)
				.attr('class', 'counts-circle');
			svg.append('text')
				.attr('x', x)
				.attr('y', dim.h/2 + 8)
				.text(d)
				.attr('class', 'counts-text')
		});
		$('.js-counts').html(avgUnit.toUpperCase());

	};

	var drawBoth = function (beersList) {
		var labels = ['Both you love', 'Both you hate', 'Love - Hate', 'Hate - Love'];
		_.each(_.range(4), function (i) {
			var list = beersList[i];
			// console.log(i);
			if (!_.isEmpty(list)) {
				$('.js-both-' + i).append(labels[i] + '<br/>');
				_.each(list, function (b) {
					$('.js-both-' + i).append('<img src="' + b.label + '" width="40" class="label-image">');	
				});
			}
		});
	};

	var drawWeekend = function (days) {
		var margin = { top: 20, right: 20, bottom: 20, left: 20 };
		var dim = { w: $('.weekend').width() - margin.left - margin.right,
					h: 200 };
		var svg = d3.select('#vis-weekend').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

		var r = Math.min(dim.w/2/2, 80);
			
		var total = _.map(days, function (d) {
			return _.reduce(d, function (memo, num) {
				return memo + num;
			}, 0);
		});
		var arc = function (start, count, i) {
			var sA = Math.PI * 2 / total[i] * start;
			var eA = Math.PI * 2 / total[i] * (start + count);
			return d3.svg.arc()
				.innerRadius(0)
		    	.outerRadius(r)
		    	.startAngle(sA)
		    	.endAngle(eA);
		};
		_.each(_.range(2), function (i) {
			var xPos = i * dim.w/4 + dim.w/4;
			var prevVal = 0				
			_.each(days[i], function (d, key) {
				svg.append('path')
					.attr('d', arc(prevVal, d, i))
					.attr('fill', '#fff')
					.attr('stroke', '#000')
					.attr('stroke-width', 1)
					.attr('transform', 'translate (' + xPos + ', ' + (dim.h/2 + margin.top) + ')')
				prevVal = prevVal + d;
			});
			svg.append('circle')
				.attr('cx', xPos)
				.attr('cy', dim.h/2 + margin.top)
				.attr('r', r)
				.attr('fill', 'none')
				.attr('stroke', '#000');
		})
	};

	return {
		putMatch: putMatch,
		drawBehavior: drawBehavior,
		drawCount: drawCount,
		drawBoth: drawBoth,
		drawWeekend: drawWeekend
	};
});
