define(['moment'], function (moment) {

	'use strict';

	var colors = E.colors;
	var dim, x, y, xAxis, yAxis;

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

		if (val === 'matrix') {
			$('.js-matrix-addedTick').show();
			$('.js-matrix-y').find('.tick').find('line')
				.attr('transform', 'translate(0, ' + dim.h/7/2 + ')');
		} else {
			$('.js-matrix-addedTick').hide();
			$('.js-matrix-y').find('.tick').find('line').removeAttr('transform');
		}

	}

	function getSum(arr, i) {
		return _.reduce(arr.slice(0, i), function (memo, num) {
			return memo + num;
		}, 0);
	}

	function createMatrixDataset (byHour, maxVals) {

		var hourly = _.map(_.range(7), function (d) {
			return _.map(_.range(24), function (h) {
				return byHour[h] ? byHour[h].byDay[d] : 0;
			});
		});
		return _.flatten(_.map(byHour, function (hour, i) {
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
						matrix: dim.w / 24,
						day: x.day(d),
						hour: dim.w / 24
					},
					height: {
						matrix: dim.h / 7,
						day: dim.h / 7,
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
	}

	var drawMatrix = function (vis, byDay, byHour) {

		var margin = vis.margin;
		dim = vis.dim;
		var svg = vis.svg;

		//max vals
		var maxVals = {
			matrix: _.max(_.map(byHour, function (hour) {
					return _.max(hour.byDay);
				})),
			day : _.max(_.pluck(byDay, 'total')),
			hour: _.max(_.pluck(byHour, 'total'))
		}

		var dayTicks = E.getAxisTicks(maxVals.day, dim.w);
		var xBase = d3.scale.linear().range([0, dim.w]).domain([0, 24]);
		x = {
			matrix: xBase,
			day: d3.scale.linear().range([0, dim.w]).domain([0, dayTicks.endPoint]),
			hour: xBase
		};
		xAxis = {
			matrix: d3.svg.axis().orient('bottom').scale(x.matrix)
					.tickSize(-dim.h)
					.tickPadding(E.noTicks.padding)
					.ticks(24).tickFormat(function (d) {
						return moment(d, 'hh').format('ha');
					}),
			day: d3.svg.axis().orient('bottom').scale(x.day)
					.tickSize(-dim.h)
					.tickPadding(E.noTicks.padding)
					.ticks(dayTicks.count),
			hour: d3.svg.axis().orient('bottom').scale(x.hour)
					.ticks(24).tickFormat(function (d) {
						return moment(d, 'hh').format('ha');
					})
		};

		var hourTicks = E.getAxisTicks(maxVals.hour, dim.h);
		var yBase = d3.scale.ordinal().rangeBands([0, dim.h]).domain([0, 1, 2, 3, 4, 5, 6]);
		y = {
			matrix: yBase,
			day: yBase,
			hour: d3.scale.linear().range([0, dim.h]).domain([hourTicks.endPoint, 0])
		};
		yAxis = {
			matrix: d3.svg.axis().orient('left').scale(y.matrix)
					.tickSize(-dim.w)
					.tickPadding(E.noTicks.padding)
					.tickFormat(function (d) {
						return moment(d, 'd').format('ddd');
					}),
			day: d3.svg.axis().orient('left').scale(y.matrix)
					.tickFormat(function (d) {
						return moment(d, 'd').format('ddd');
					}),
			hour: d3.svg.axis().orient('left').scale(y.hour)
					.tickSize(-dim.w)
					.tickPadding(E.noTicks.padding)
					.ticks(hourTicks.count)
		};

		//matrix dataset
		var dataset = createMatrixDataset(byHour, maxVals);
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

		svg.append('g')
			.attr('class', 'x axis js-matrix-x')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis.matrix);

		svg.append('g')
			.attr('class', 'y axis js-matrix-y')
			.call(yAxis.matrix);

		//move tick lines
		$('.js-matrix-y').find('.tick').find('line')
			.attr('transform', 'translate(0, ' + dim.h/7/2 + ')');
		svg.append('line')
			.attr('x2', dim.w)
			.attr('y2', 0)
			.attr('class', 'stroke-tick js-matrix-addedTick');

		//FIXME: add legends, add label on axis
	};

	return {
		updateGraph: updateGraph,
		drawMatrix: drawMatrix
	}
});