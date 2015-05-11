define(['moment', 'textures'], function (moment, textures) {

	var unit, colors;
	var svg, dim, margin, xAxis, yAxis, x, y; //frequency
	var block = 12; //calendar

	var setUnit = function (u, c) {
		unit = u;
		colors = c;
	};

	function drawFreqBlocks(data, maxCount, avgCount) {

		_.each(data.counts, function (val, i) {
			svg.append('rect')
				.attr('x', x(i))
				.attr('y', y(val))
				.attr('width', dim.w/data.counts.length)
				.attr('height', dim.h - y(val))
				.style('fill', colors[i])
				.attr('class', 'stroke-tick js-freq-block');
			svg.append('text')
				.attr('x', x(i) + dim.w/data.counts.length / 2)
				.attr('y', y(val))
				.attr('dy', -4)
				.text(val)
				.style('fill', colors[i])
				.attr('class', 'pos-middle size-small js-freq-block');
		});

		//average line
		var xPos = x(avgCount / data.gap);
        svg.append('line')
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', -margin.top / 2)
            .attr('y2', dim.h + margin.bottom/2)
            .attr('class', 'stroke-2 stroke-black js-freq-block');
        svg.append('circle')
            .attr('cx', xPos)
            .attr('cy', -margin.top / 2 - 5)
            .attr('r', margin.top / 2.4)
            .attr('class', 'fill-black js-freq-block');
        svg.append('text')
            .attr('x', xPos)
            .attr('y', -margin.top / 2)
            .attr('dy', -margin.top / 8)
            .text('average')
            .attr('class', 'size-small pos-middle fill-white js-freq-block');
        svg.append('text')
            .attr('x', xPos)
            .attr('y', -margin.top / 2)
            .attr('dy', margin.top / 6)
            .text(avgCount)
            .attr('class', 'size-large pos-middle fill-white js-freq-block');
	}

	function updateSoberCount(data) {
		var sober = data.sober[unit];
		var unitCount = data.unitCounts[unit];
		$('.js-count-sober').html(
			sober === 0 ?
			'<strong>You are never sober!</strong>' :
			'You were sober for <strong>' +
			(sober + ' ' + unit + (sober > 1 ? 's' : '')) +
			'</strong> out of total <strong>' +
			(unitCount + ' ' + unit + (sober > 1 ? 's' : ''))
		);
	}

	var transformCount = function (u, c, data, avgCount) {

		setUnit(u, c);

		var frequency = data.frequency[unit];
		var maxCount = data.maxCount[unit];
		var unitCount = data.unitCounts[unit];

		//frequency
		x.domain([0, frequency.counts.length]);
		xAxis.scale(x).tickFormat(function (d) { return d * frequency.gap; });
		d3.select('.js-freq-axis-x').call(xAxis);
		$('.js-freq-lable-x').html('check-ins / ' + unit);

		var yTicks = E.getAxisTicks(_.max(frequency.counts), dim.h);
		y.domain([yTicks.endPoint, 0]);
		yAxis.scale(y).ticks(yTicks.count);
		d3.select('.js-freq-axis-y').call(yAxis);
		$('.js-freq-lable-y').html('number of ' + unit);

		$('.js-freq-block').remove();
		drawFreqBlocks(frequency, maxCount, avgCount[unit]);

		//calendar
		updateSoberCount(data);
		$('.js-calendar-legend-block').remove();
		E.updateChroma(frequency.counts.length, frequency.gap, 'calendar', colors);
		d3.selectAll('.js-cal-block').style('fill', function (d) {
			var cId = 0;
			for (var i = frequency.counts.length ; i > 0 ; i--) {
				if (d[unit] >= i * frequency.gap) {
					cId = i;
					break;
				}
			}
			return colors[cId];
		}).attr('width', unit === 'month' ? block : block -1)
		.attr('height', unit === 'day' ? block - 1 : block );
	};

	var drawFrequency = function (vis, data, avgCount) {

		var frequency = data.frequency[unit];
		var maxCount = data.maxCount[unit];

		dim = vis.dim;
		margin = vis.margin;
		svg = vis.svg;

		x = d3.scale.linear().range([0, dim.w])
			.domain([0, frequency.counts.length]);
		xAxis = d3.svg.axis().scale(x).orient('bottom')
				.ticks(frequency.counts.length)
				.tickSize(E.noTicks.size)
				.tickPadding(E.noTicks.padding)
				.tickFormat(function (d) {
					return d * frequency.gap;
				});

		var yTicks = E.getAxisTicks(_.max(frequency.counts), dim.h);
		y = d3.scale.linear().range([0, dim.h])
				.domain([yTicks.endPoint, 0]);
		yAxis = d3.svg.axis().scale(y).orient('left')
				.ticks(yTicks.count)
				.tickSize(-dim.w, 0)
				.tickPadding(E.noTicks.padding);

		svg.append('g')
			.attr('class', 'x axis js-freq-axis-x')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'y axis js-freq-axis-y')
			.call(yAxis);

		E.putAxisLable(svg, dim.w / 2 , dim.h,
			'check-ins / ' + unit, 'x', 'js-freq-lable-x');
		E.putAxisLable(svg, -dim.h / 2, 0,
			'number of ' + unit, 'y', 'js-freq-lable-y');

		drawFreqBlocks(frequency, maxCount, avgCount[unit]);
	};

	function getTooltipString(date) {
		var dateStr;
		if (unit === 'day') {
			dateStr = date.format('ddd, MMM D');
		} else if (unit === 'week') {
			var sd = date.clone().startOf('week');
			var ed = sd.clone().add(6, 'days').format('MMM D');
			dateStr = sd.format('MMM D') + ' - ' + ed;
		} else {
			dateStr = date.format('MMMM YYYY');
		}
		return dateStr;
	}

	function putAxisLabels(svg, rowC, gap) {
		_.each(_.range(rowC), function (i) {
			_.each(['S', 'M', 'T', 'W', 'T', 'F', 'S'], function (d, j) {
				svg.append('text')
					.attr('x', -2)
					.attr('y', gap + i * (gap + block * 7) + j * block)
					.attr('dy', block - 2)
					.text(d)
					.attr('class', 'pos-end size-tiny');
			});
		});
	}

	function putXLabel(svg, x, y, dy, str, c) {
		svg.append('text')
			.attr('x', x)
			.attr('y', y)
			.attr('dy', dy)
			.text(str)
			.attr('class', c + ' size-tiny');
	}

	function getColorId(data, d) {
		var cId = 0;
		for (var i = data.frequency[unit].counts.length ; i > 0 ; i--) {
			if (d[unit] >= i * data.frequency[unit].gap) {
				cId = i;
				break;
			}
		}
		return cId;
	}

	function getColor(data, d) {
		return colors[getColorId(data, d)];
	}

	function showTextures(svg, data, d) {
		$('#vis-calendar').find('def').remove();
		var cId = getColorId(data, d);
		var t = textures.lines().size(block/2)
			.stroke(cId > colors.length - 3 ? '#666' : '#343434')
			.lighter().background(colors[cId]);
		svg.call(t);
		d3.selectAll('.js-cal-block').filter(function (b) {
				return b.dateId[unit] === d.dateId[unit];
			}).style('fill', t.url())
			.attr('class', 'js-cal-block js-cal-block-over');
	}

	var drawCalendar = function (vis, rangeStr, data) {

		updateSoberCount(data);

		//number of days - start with the first day of the month
		var sT = moment(rangeStr[0]);
		var eT = moment();

		//draw svg
		var margin = vis.margin;
		var dim = { w: vis.w - margin.left - margin.right };
		var gap = 50;
		var rowC = Math.ceil(Math.ceil((eT.diff(sT, 'days') + 1) / 7) *
			12 / dim.w);
		dim.h = rowC * (gap + block * 7);
		var svg = vis.draw({dim: dim, margin: margin}, 'calendar');

		//draw scale legend
		E.drawChromaLegend(svg, dim.w, -30,
			data.frequency[unit].counts.length,
			data.frequency[unit].gap, 'calendar', colors);

		//y axis day label
		putAxisLabels(svg, rowC, gap);
		var colC = Math.floor(dim.w / block);
		var colL = gap + 7 * block;
		var offset = sT.day();

		function getX(i) {
			return Math.floor((i + offset) / 7) % colC * block;
		}
		function getRow(i) {
			return Math.floor(((i + offset) / 7) / colC);
		}
		function getY(i) {
			var row = getRow(i);
			return (gap + (i + offset) % 7 * block) + row * colL;
		}
		svg.selectAll('.js-cal-block')
				.data(data.list)
			.enter().append('rect')
			.attr('x', function (d, i) { return getX(i); })
			.attr('y', function (d, i) { return getY(i); })
			.attr('width', (unit === 'month') ? block : block - 1)
			.attr('height', (unit === 'day') ? block - 1 : block)
			.style('fill', function (d) { return getColor(data, d); })
			.on('mouseover', function (d, i) {
				showTextures(svg, data, d);
				E.setTooltipText([d[unit] + ' check-ins',
					getTooltipString(moment(d.date, 'YYYYMMDD'))],
					'cal', dim.w, getX(i), getY(i), block / 2);
			})
			.on('mouseout', function (d) {
				d3.selectAll('.js-cal-block-over')
					.style('fill', getColor(data, d))
					.attr('class', 'js-cal-block');
				$('.js-cal-tooltip').hide();
			})
			.attr('class', 'js-cal-block');

		//month, year labels, and divide line
		_.each(data.list, function (d, i) {
			var date = moment(d.date, 'YYYYMMDD');
			var x = getX(i) + (date.day() > 0 ? block : 0) + 4;
			var y = getRow(i) * colL;
			if (date.date() === 1) {
				putXLabel(svg, x, y, gap - 6, date.format('MMM'), 'fill-black');
			}
			if (date.dayOfYear() === 1) {
				putXLabel(svg, x, y, gap - 20, date.year(),
					'fill-black weight-700');
			}
			if (i > 0 && date.date() === 1) {
				svg.append('path')
					.attr('d', 'M ' + getX(i) + ' ' + (y + colL + gap/6) +
						' v  ' + (-gap/6 - block * (7 - date.day())) +
						(date.day() > 0 ? (' h ' + block) : '') +
						' v ' + (-gap/6 - block * date.day()))
					.attr('class', 'fill-none ' +
						(date.dayOfYear() === 1 ?
						'stroke-black stroke-2' :
						'stroke-black stroke-1'));
			}
		});

		//draw tooltip
		E.drawTooltip(svg, 'cal', 2);
		var maxRangeIds = [];
		var maxRange = _.filter(data.list, function (d, i) {
			if (d[unit] === data.maxCount[unit]) {
				maxRangeIds.push(i);
			}
			return d[unit] === data.maxCount[unit];
		});

		showTextures(svg, data, maxRange[0]);
		E.setTooltipText([maxRange[0][unit] + ' check-ins',
			getTooltipString(moment(maxRange[0].date, 'YYYYMMDD'))],
			'cal', dim.w, getX(maxRangeIds[0]), getY(maxRangeIds[0]), block / 2);
	};

	return {
		setUnit: setUnit,
		drawFrequency: drawFrequency,
		drawCalendar: drawCalendar,
		transformCount: transformCount
	};
});
