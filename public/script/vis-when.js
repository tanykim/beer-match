define(['moment', 'vis-settings'], function (moment, Settings) {

	var colors = Settings.colors;

	var drawDayStats = function (data) {

		var dim = { w: $('.day').width(), h: $('.day').width() };
		var svg = d3.select('#vis-day').append('svg')
			.attr('width', dim.w)
			.attr('height', dim.h)
			.append('g');

		var maxR = dim.w/2 - 40;
		var maxVal = _.max(_.pluck(data, 'total'));
		var baseA = Math.PI * 2 / 7;
		var arc = function (val, i) {
			var r = maxR * Math.sqrt(val / maxVal);
			return d3.svg.arc()
				.innerRadius(0)
		    	.outerRadius(r)
		    	.startAngle(baseA * i)
		    	.endAngle(baseA * (i + 1));
		};
		_.each(data, function (d, i) {
			//arc of total checkins
		    svg.append('path')
		    	.attr('d', arc(d.total, i))
		    	.attr('fill', '#000')
		    	.attr('transform', 'translate(' + dim.w/2 + ', ' + dim.h/2 + ')');
		    //arc of at public venue
		    svg.append('path')
		    	.attr('d', arc(d.venue, i))
		    	.attr('fill', '#ccc')
		    	.attr('transform', 'translate(' + dim.w/2 + ', ' + dim.h/2 + ')');
		    //day divide line
		    svg.append('line')
		    	.attr('x1', dim.w/2)
		    	.attr('x2', Math.cos(i * Math.PI * 2 / 7 - Math.PI/2) * dim.w/2 + dim.w/2)
		    	.attr('y1', dim.h/2)
		    	.attr('y2', Math.sin(i * Math.PI * 2 / 7 - Math.PI/2) * dim.h/2 + dim.h/2)
		    	.attr('stroke', '#cc0000');
		    //day divide line
		    svg.append('text')
		    	.attr('x', dim.w - 40)
		    	.attr('y', dim.h/2)
		    	.text(moment().day(i).format('ddd'))
		    	.attr('transform', 'rotate(' + (360/7 * (i+1) - 90) + ', ' + dim.w/2 + ', ' + dim.h/2 + ')')
		    	.attr('data-day', i)
		    	.attr('class', 'link js-day-text');
		});
	};

	var drawHourStats = function (data) {
		var margin = { top: 10, right: 20, bottom: 20, left: 40 };
		var dim = { w: $('.hour').width() - margin.left - margin.right,
					h: $('.day').width() - margin.top - margin.bottom };
		var x = d3.scale.linear().range([0, dim.w])
				.domain([0, 24]);
		var xAxis = d3.svg.axis().scale(x).orient('bottom').tickSize(-dim.h).ticks(24);
		var y = d3.scale.linear().range([0, dim.h])
				.domain([Math.ceil(_.max(_.values(_.pluck(data, 'total'))) / 10) * 10, 0]);
		var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-dim.w);

		var svg = d3.select('#vis-hour').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		
		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		function getSum (arr, i) {
			// console.log(arr);
			return _.reduce(arr.slice(0, i + 1), function (memo, num) {
					return memo + num;
				}, 0);
		}
		_.each(data, function (val, key) {
			svg.append('rect')
				.attr('x', x(+key))
				.attr('y', y(val.total))
				.attr('width', dim.w/24)
				.attr('height', dim.h - y(val.total))
				.attr('class', 'hour-block-total');
			_.each(val.byDay, function (day, i) {			
				var accCount = getSum(val.byDay, i);
				svg.append('rect')
					.attr('x', x(+key))
					.attr('y', y(accCount))
					.attr('width', dim.w/24)
					.attr('fill', '#999')
					.attr('height', dim.h - y(day))
					.attr('class', 'hour-block-seg js-hour-block js-hour-byDay-' + i)
					.attr('display', 'none');
			});
		});
		//interaction
		$('.js-day-text').click(function() {
			$('.js-hour-block').hide();
			$('.js-hour-byDay-' + $(this).data().day).fadeIn();
		});
	};

	return {
		drawDayStats: drawDayStats,
		drawHourStats: drawHourStats
	}
});