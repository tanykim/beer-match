define(['vis-settings', 'moment'], function (Settings, moment) {

	var colors = Settings.colors;

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

	var drawTimeline = function (data) {

		var margin = { top: 20, right: 20, bottom: 20, left: 20, middle: 30 };
		var dim = { w: $('.timeline').width() - margin.left - margin.right,
					h: 200 };

		var x = d3.scale.linear().range([0, dim.w]).domain([0, 7 * 24]);
		var xAxis0 = _.object(_.map(['day', 'hour'], function (sort) {
			var val = d3.svg.axis().scale(x).orient('bottom').ticks(7*24);
			if (sort === 'day') {
				val.tickFormat(function (d) {
					var f = '';
					if (d % 24 === 0) {
						f = moment().day(d / 24).format('ddd');
					} else if (d % 6 === 0) {
						f = moment(d % 24, 'hh').format('ha');
					}
					return f;
				});
			} else {
				val.tickFormat(function (d) {
					var f = '';
					if (d % 7 === 0) {
						f = moment(d / 7, 'hh').format('ha');
					}
					return f;
				})
			}
			return [sort, val];
		}));

		var xAxis1 = d3.svg.axis().scale(x).orient('top').ticks(7*24).tickFormat('');

		var maxY = _.map(data, function (d) {
			return _.max(_.map(d, function (day) {
				return _.max(day);
			}));
		});

		var y = _.map(_.range(2), function (d) {
			var range = d === 0 ? [0, dim.h] : [dim.h, 0];
			return _.object(_.map(['absolute', 'relative'], function (sort) {
				var val = d3.scale.linear().range(range);
				var domain = sort === 'absolute' ? val.domain([Math.ceil(_.max(maxY) / 10) * 10, 0]) : val.domain([1, 0]);
				return [sort, domain];
			}));
		});
		var yAxis = _.map(_.range(2), function (d) {
			return d3.svg.axis().scale(y[d].absolute).orient('left').tickSize(-dim.w);
		})

		var svg = d3.select('#vis-timeline').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h * 2 + margin.middle + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

		svg.append('g')
			.attr('class', 'x axis js-timeline-x js-timeline-x0')
			.attr('data-value', -1)
			.attr('transform', 'translate(0, ' + dim.h + ')');
			// .call(xAxis0.day);
		svg.append('g')
			.attr('class', 'x axis js-timeline-x js-timeline-x1')
			.attr('data-value', 1)
			.attr('transform', 'translate(0, ' + (dim.h + margin.middle) + ')')
			.call(xAxis1);
		svg.append('g')
			.attr('class', 'y axis js-timeline-y-0')
			.call(yAxis[0]);
		svg.append('g')
			.attr('class', 'y axis js-timeline-y-1')
			.attr('transform', 'translate(0, ' + (dim.h + margin.middle) + ')')
			.call(yAxis[1]);

		_.each(data, function (user, i) {
			var dataset = _.flatten(_.map(user, function (day, j) {
				return _.map(day, function (d, hour) {
					return {
						x: {
							day: x((24 * j) + +hour),
							hour: x((7 * +hour) + j)
						},
						y: {
							absolute: i === 0 ? y[i].absolute(d) : dim.h + margin.middle,
							relative: i === 0 ? y[i].relative(d/maxY[i]) : dim.h + margin.middle,
						},
						width: dim.w / 24 / 7,
						height: {
							absolute: i === 0 ? dim.h - y[i].absolute(d) : y[i].absolute(d),
							relative: i === 0 ? dim.h - y[i].relative(d/maxY[i]) : y[i].relative(d/maxY[i]),
						}
					};
				});
			}));

			svg.selectAll('.js-timeline-block-' + i)
				.data(dataset)
				.enter().append('rect')
				.attr('x', function (d) { return d.x.day; })
				.attr('y', function (d) { return d.y.absolute; })
				.attr('width', function (d) { return d.width; })
				.attr('height', function (d) { return d.height.absolute; })
				.attr('fill', Settings.users[i])
				.attr('class', 'js-timeline-block js-timeline-block-' + i);
		});

		$('.js-timeline-switch').click(function() {
			$('.js-timeline-switch').removeClass('bold');
			$(this).addClass('bold');

			var selected = $(this).data().value;
			_.each(yAxis, function (d, i) {
				d.scale(y[i][selected]);
				d3.select('.js-timeline-y-' + i).transition().call(d);
			});

			d3.selectAll('.js-timeline-block')
				.transition()
				.attr('y', function (d) { return d.y[selected]; })
				.attr('height', function (d) { return d.height[selected]; });
		});

		function switchTicks(selected) {
			function updateAxis(callback) {
				d3.select('.js-timeline-x0').call(xAxis0[selected]);
				callback();

			}
			updateAxis(function () {
				d3.selectAll('.js-timeline-x line').attr('y2', function(d){
					var slice = selected === 'day' ? 24 : 7;
			        if ( d % slice === 0 )  {
			       	    return $(this).parent().parent().data().value * dim.h;
			        } else if ( selected === 'day' && d % 6 === 0 ) {
		            	return $(this).parent().parent().data().value * -6;
		            } else {
			       		return 0;
			        }
			    });
			});
		}
		switchTicks('day');

		$('.js-timeline-group').click(function() {
			$('.js-timeline-group').removeClass('bold');
			$(this).addClass('bold');

			var selected = $(this).data().value;

			switchTicks(selected);

			d3.selectAll('.js-timeline-block')
				.transition()
				.attr('x', function (d) { return d.x[selected]; });
		});

	};

	return {
		drawWeekend: drawWeekend,
		drawTimeline: drawTimeline
	};
});
