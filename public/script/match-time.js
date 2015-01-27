define(['vis-settings', 'moment'], function (Settings, moment) {

	var colors = Settings.colors;

	var status = {
		value: 'absolute',
		group: 'day',
		type: 'bars'
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

	function getDayHourDataset(byDay, byHour, byDayHour, x, y, maxY, dim, margin) {

		var maxRVal = _.map(_.range(2), function (user) {
			return _.max(_.map([byDay[user], byHour[user]], function (sort) {
				return _.max(sort);
			}));			
		});

		var maxR = Math.min(dim.w/48 + margin.right, dim.h/2);

		return _.map(byDayHour, function (user, i) {
			return _.flatten(_.map(user, function (day, j) {
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
						baseY: i === 0 ? dim.h : dim.h + margin.middle,
						width: dim.w / 24 / 7,
						height: {
							absolute: i === 0 ? dim.h - y[i].absolute(d) : y[i].absolute(d),
							relative: i === 0 ? dim.h - y[i].relative(d/maxY[i]) : y[i].relative(d/maxY[i]),
						},
						cx: {
							day: x((24 * j) + 12),
							hour: x((7 * +hour) + 3.5)
						},
						cy: i === 0 ? (dim.h / 2) : (dim.h + margin.middle + dim.h / 2),
						r: {
							absolute_day: Math.sqrt(byDay[i][j] * maxR * maxR / _.max(maxRVal)),
							relative_day: Math.sqrt(byDay[i][j] / maxRVal[i] * maxR * maxR),
							absolute_hour: Math.sqrt(byHour[i][hour] * maxR * maxR / _.max(maxRVal)),
							relative_hour: Math.sqrt(byHour[i][hour] / maxRVal[i] * maxR * maxR)
						},
						opacity: {
							day: 0.05,
							hour: 0.14
						}
					};
				});
			}));
		});
	}

	function switchTicks(selected, xAxis0, dim) {
		function updateAxis(callback) {
			d3.select('.js-timeline-x0').call(xAxis0[selected]);
			callback();

		}
		updateAxis(function () {
			d3.selectAll('.js-timeline-x line').attr('y2', function(d){
				var slice = selected === 'day' ? 24 : 7;
		        if ( d % slice === 0 )  {
		       	    return $(this).parent().parent().data().value * dim.h;
		        } else if ( selected === 'day' && status.type === 'bars' && d % 6 === 0 ) {
	            	return $(this).parent().parent().data().value * -6;
	            } else {
		       		return 0;
		        }
		    });
		    d3.selectAll('.js-timeline-x0 text').style('display', function(d){
		    	if (status.group === 'day' && status.type === 'bubble' && d % 24 !== 0 && d % 6 === 0) {
		        	return 'none';
		        } else {
		        	return 'block';
		        }
		    });
		    d3.selectAll('.js-timeline-x0 text').attr('transform', function(d) {
		    	if (status.group === 'day' && status.type === 'bubble' && d % 24 == 0) {
		    		return 'translate(' + dim.w/14 + ', 0)';
		    	} else {
		    		return '';
		    	}
		    });

		});
	}

	function callInteraction(xAxis0, yAxis, y, x, dim) {

		function updateGraph(type, selected) {
			if (type === 'value') {
				_.each(yAxis, function (d, i) {
					d.scale(y[i][selected]);
					d3.select('.js-timeline-y-' + i).transition().call(d);
				});
				d3.selectAll('.js-timeline-bar')
					.transition()
					.attr('y', function (d) { return d.y[selected]; })
					.attr('height', function (d) { return d.height[selected]; });
				d3.selectAll('.js-timeline-bubble')
					.transition()
					.attr('r', function (d) { return d.r[selected + '_' + status.group]; })
					.style('opacity', function (d) { return d.opacity[status.group]; });

			} else if (type === 'group') {
				d3.selectAll('.js-timeline-bar-bg').transition().attr('x', function() {
					var vals = $(this).data().value.split('-');
					return (selected === 'day') ? x(+vals[0] * 24 + +vals[1]) : x(+vals[1] * 7 + +vals[0]);
				});
				switchTicks(selected, xAxis0, dim);
				d3.selectAll('.js-timeline-bar')
					.transition()
					.attr('x', function (d) { return d.x[selected]; });
				d3.selectAll('.js-timeline-bubble')
					.transition()
					.attr('cx', function (d) { return d.cx[selected]; })
					.attr('r', function (d) { return d.r[status.value + '_' + selected]; })
					.style('opacity', function (d) { return d.opacity[status.group]; });
			} else {
				$('.js-timeline-elm').toggle();
				$('.js-timeline-bar-bg').toggle();
				$('#vis-timeline').find('.y').toggle();
				switchTicks(status.group, xAxis0, dim);
			}
		}

		$('.js-timeline-switch').click(function() {
			var type = $(this).data().type;
			if (!$(this).hasClass('bold')) {
				$('.js-timeline-' + type).removeClass('bold');
				$(this).addClass('bold');
				var selected = $(this).data().value;
				status[type] = selected;
				updateGraph(type, selected);				
			}
		});
	}

	var drawTimeline = function (byDay, byHour, byDayHour) {

		var margin = { top: 20, right: 20, bottom: 20, left: 20, middle: 30 };
		var dim = { w: $('.timeline').width() - margin.left - margin.right,
					h: 200 };

		var x = d3.scale.linear().range([0, dim.w]).domain([0, 7 * 24]);
		var xAxis0 = _.object(_.map(['day', 'hour'], function (sort) {
			var val = d3.svg.axis().scale(x).orient('bottom').ticks(7*24).tickFormat(function (d) {
				var f = '';
				if (sort === 'day') {
					if (d % 24 === 0) {
						f = moment().day(d / 24).format('ddd');
					} else if (d % 6 === 0) {
						f = moment(d % 24, 'hh').format('ha');
					}
				} else {
					var f = '';
					if (d % 7 === 0) {
						f = moment(d / 7, 'hh').format('ha');
					}
				}
				return f;
			});
			return [sort, val];
		}));
		var xAxis1 = d3.svg.axis().scale(x).orient('top').ticks(7*24).tickFormat('');

		var maxY = _.map(byDayHour, function (d) {
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

		_.each(_.range(2), function (i) {
			_.each(_.range(7), function (j) {
				_.each(_.range(24), function (hour) {
					if (j === 0 || j > 4) {
						svg.append('rect')
							.attr('x', x(j * 24 + hour))
							.attr('y', i === 0 ? 0 : dim.h + margin.middle)
							.attr('width', dim.w / 24 / 7)
							.attr('height', dim.h)
							.attr('fill', '#efefef')
							.attr('data-value', j + '-' + hour)
							.attr('class', 'js-timeline-bar-bg');
					}
				})
			});
		});

		svg.append('g')
			.attr('class', 'x axis js-timeline-x js-timeline-x0')
			.attr('data-value', -1)
			.attr('transform', 'translate(0, ' + dim.h + ')');
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

		switchTicks('day', xAxis0, dim);

		//new one-level array dataset
		var dataset = getDayHourDataset(byDay, byHour, byDayHour, x, y, maxY, dim, margin);
			
		// console.log(dataset);

		//draw circle by Hour and bars
		_.each(byDayHour, function (user, i) {

			svg.selectAll('.js-timeline-bubble-' + i)
				.data(dataset[i])
				.enter().append('circle')
				.attr('cx', function (d) { return d.cx.day; })
				.attr('cy', function (d) { return d.cy; })
				.attr('r', function (d) { return d.r.absolute_day; })
				.attr('fill', Settings.users[i])
				.style('opacity', 1/24)
				.attr('class', 'js-timeline-elm js-timeline-bubble js-timeline-bubble-' + i)
				.style('display', 'none');

			svg.selectAll('.js-timeline-bar-' + i)
				.data(dataset[i])
				.enter().append('rect')
				.attr('x', function (d) { return d.x.day; })
				.attr('y', function (d) { return d.y.absolute; })
				.attr('width', function (d) { return d.width; })
				.attr('height', function (d) { return d.height.absolute; })
				.attr('fill', Settings.users[i])
				.attr('class', 'js-timeline-elm js-timeline-bar js-timeline-bar-' + i);


		});

		callInteraction(xAxis0, yAxis, y, x, dim);
	};

	return {
		drawWeekend: drawWeekend,
		drawTimeline: drawTimeline
	};
});
