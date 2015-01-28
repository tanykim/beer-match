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

	function callInteraction(dataset, xAxis, yAxis) {

		function updateGraph(val) {
			d3.selectAll('.js-matrix-block')
				.transition()
				.attr('x', function (d) { return d.x[val]; })
				.attr('y', function (d) { return d.y[val]; })
				.attr('width', function (d) { return d.width[val]; })
				.attr('height', function (d) { return d.height[val]; })
				.style('opacity', function (d) { return d.opacity[val]; });

			d3.select('.js-matrix-x').transition().call(xAxis[val]);
			d3.select('.js-matrix-y').transition().call(yAxis[val]);

		}

		$('.js-dayHour-switch').click(function() {
			var val = $(this).data().value;
			if (!$(this).hasClass('bold')) {
				$('.js-dayHour-switch').removeClass('bold');
				$(this).addClass('bold');
				updateGraph(val);			
			}

		});
	}

	function getSum(arr, i) {
		return _.reduce(arr.slice(0, i), function (memo, num) {
			return memo + num;
		}, 0);
	}

	var drawMatrix = function (byDay, byHour) {

		//max vals
		var maxVals = {
			matrix: _.max(_.map(byHour, function (hour) {
					return _.max(hour.byDay);
				})),
			day : _.max(_.pluck(byDay, 'total')),
			hour: _.max(_.pluck(byHour, 'total'))
		} 

		var margin = { top: 10, right: 20, bottom: 20, left: 40 };
		var dim = { w: $('.dayHour').width() - margin.left - margin.right,
					h: 300 - margin.top - margin.bottom };
		
		var x = {
			matrix: d3.scale.linear().range([0, dim.w]).domain([0, 24]),
			day: d3.scale.linear().range([0, dim.w]).domain([0, Math.ceil(maxVals.day / 10) * 10]),
			hour: d3.scale.linear().range([0, dim.w]).domain([0, 24])
		};
		var xAxisBase = d3.svg.axis().orient('bottom').scale(x.matrix).ticks(24).tickFormat(function (d) {
				return moment(d, 'hh').format('ha');
			});
		var xAxis = {
			matrix: xAxisBase,
			day: d3.svg.axis().orient('bottom').scale(x.day),
			hour: xAxisBase
		};

		var y = {
			matrix: d3.scale.ordinal().rangeBands([0, dim.h]).domain([0, 1, 2, 3, 4, 5, 6]),
			day: d3.scale.ordinal().rangeBands([0, dim.h]).domain([0, 1, 2, 3, 4, 5, 6]),
			hour: d3.scale.linear().range([0, dim.h]).domain([Math.ceil(maxVals.hour / 10) * 10, 0])
		};
		var yAxisBase = d3.svg.axis().orient('left').scale(y.matrix).tickFormat(function (d) {
				return moment(d, 'd').format('ddd');
			});
		var yAxis = {
			matrix: yAxisBase,
			day: yAxisBase,
			hour: d3.svg.axis().orient('left').scale(y.hour)
		};

		var svg = d3.select('#vis-dayHour').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		
		svg.append('g')
			.attr('class', 'x axis js-matrix-x')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis.matrix);
		svg.append('g')
			.attr('class', 'y axis js-matrix-y')
			.call(yAxis.matrix);
		
		//matrix dataset
		var hourly = _.map(_.range(7), function (d) {
			return _.map(_.range(24), function (h) {
				return byHour[h] ? byHour[h].byDay[d] : 0; 
			});
		});
		var dataset = _.flatten(_.map(byHour, function (hour, i) {
			return _.map(hour.byDay, function (d, day) {
				return {
					x: {
						matrix: x.matrix(i),
						day: x.day(getSum(hourly[day], i)),
						hour: x.hour(i)
					},
					y: {
						matrix: y.matrix(day),
						day: y.day(day),
						hour: y.hour(getSum(hour.byDay, day + 1)),
					},
					width: {
						matrix: dim.w / 24 - 1,
						day: x.day(d),
						hour: dim.w / 24 - 1
					},
					height: {
						matrix: dim.h / 7 - 1,
						day: dim.h / 7 - 1,
						hour: dim.h - y.hour(d)
					},
					opacity: {
						matrix: d / maxVals.matrix,
						day: 1,
						hour: 1
					}
				};
			});
		}));
		svg.selectAll('.js-matrix-block')
			.data(dataset)
			.enter().append('rect')
			.attr('x', function (d) { return d.x.matrix; })
			.attr('y', function (d) { return d.y.matrix; })
			.attr('width', function (d) { return d.width.matrix; })
			.attr('height', function (d) { return d.height.matrix; })
			.style('fill', '#000')
			.style('opacity', function (d) { return d.opacity.matrix; })
			.attr('class', 'js-matrix-block');

		callInteraction(dataset, xAxis, yAxis);

	};

	return {
		drawDayStats: drawDayStats,
		drawHourStats: drawHourStats,
		drawMatrix: drawMatrix
	}
});