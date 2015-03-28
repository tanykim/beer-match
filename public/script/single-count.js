define(['moment'], function (moment) {

	var color = E.beerColors[3];
	var selected;

	var svg, dim, margin, xAxis, yAxis, x, y, //frequency
		block; //calendar

	function drawFreqBlocks(data, maxCount, avgCount) {

		_.each(data.counts, function (val, i) {
			svg.append('rect')
				.attr('x', x(i))
				.attr('y', y(val))
				.attr('width', dim.w/data.counts.length)
				.attr('height', dim.h - y(val))
				.style('fill', color)
				.attr('class', 'freq-block js-freq-block');
			svg.append('text')
				.attr('x', x(i) + dim.w/data.counts.length / 2)
				.attr('y', y(val))
				.attr('dy', -4)
				.text(val)
				.attr('class', 'pos-middle size-normal js-freq-block')
		});

		//average line
		svg.append('line')
			.attr('x1', x(avgCount / data.gap))
			.attr('x2', x(avgCount / data.gap))
			.attr('y1', -margin.top/2)
			.attr('y2', dim.h + margin.bottom/2)
			.attr('class', 'stroke-2 stroke-black js-freq-block');
		svg.append('circle')
			.attr('cx', x(avgCount / data.gap))
			.attr('cy', -margin.top/2)
			.attr('r', margin.top/2.2)
			.attr('class', 'freq-text-avg js-freq-block');
		svg.append('text')
			.attr('x', x(avgCount / data.gap))
			.attr('y', -margin.top/2)
			.attr('dy', -margin.top/8)
			.text('average')
			.style('fill', '#fff')
			.attr('class', 'size-normal pos-middle js-freq-block');
		svg.append('text')
			.attr('x', x(avgCount / data.gap))
			.attr('y', -margin.top/2)
			.attr('dy', margin.top/6)
			.text(avgCount)
			.style('fill', '#fff')
			.attr('class', 'size-huge pos-middle js-freq-block');

	}

	var transformCount = function (unit, data, avgCount) {

		selected = unit;

		var frequency = data.frequency[unit];
		var maxCount = data.maxCount[unit];
		var unitCount = data.unitCounts[unit];

		//frequency
		//domain
		var yTicks = E.getAxisTicks(_.max(frequency.counts), dim.h);
		x.domain([0, frequency.counts.length]);
		y.domain([yTicks.endPoint, 0]);
		xAxis.scale(x);
		yAxis.scale(y).ticks(yTicks.count);
		d3.select('.js-freq-axis-x').call(xAxis);
		d3.select('.js-freq-axis-y').call(yAxis);
		$('.js-freq-lable-x').html('beers / ' + unit);
		$('.js-freq-lable-y').html('number of ' + unit + 's');
		//blocks
		$('.js-freq-block').remove();
		drawFreqBlocks(frequency, maxCount, avgCount[unit]);

		//calendar
		d3.selectAll('.js-cal-block').attr('opacity', function() {
			var val = d3.select(this).attr('data-value').split(':');
			var count;
			if (unit === 'day') {
				count = val[0];
			} else if (unit === 'week') {
				count = val[1];
			} else {
				count = val[2];
			}
			if (count !== '--') {
				return +count/maxCount;
			} else {
				return 1;
			}
		});
		if (unit === 'week') {
			d3.selectAll('.js-cal-block').attr('width', block - 1).attr('height', block);
		} else if (unit === 'month') {
			d3.selectAll('.js-cal-block').attr('width', block).attr('height', block);
		} else {
			d3.selectAll('.js-cal-block').attr('width', block - 1).attr('height', block - 1);
		}
	};

	var drawFrequency = function (vis, data, avgCount, unit) {

		var frequency = data.frequency[unit];
		var maxCount = data.maxCount[unit];

		dim = vis.dim;
		margin = vis.margin;
		svg = vis.svg;

		x = d3.scale.linear().range([0, dim.w]).domain([0, frequency.counts.length]);
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

		svg.append('text')
			.attr('x', dim.w / 2)
			.attr('y', dim.h + 40)
			.text('beers /' + unit)
			.attr('class', 'pos-middle js-freq-lable-x');
		svg.append('text')
			.attr('x', - dim.h / 2)
			.attr('y', -40)
			.text('number of ' + unit + 's')
			.attr('class', 'pos-middle js-freq-lable-y')
			.attr('transform', 'rotate(-90)');

		drawFreqBlocks(frequency, maxCount, avgCount[unit]);
	};

	function showTooltip(svg, x, y, date, count) {
		// var unit = $('input[name=period]:checked').val();

		// var unit = selected;

		var dateStr;
		if (selected === 'day') {
			dateStr = date.format('D MMM');
		} else if (selected === 'week') {
			var sd = date.clone().startOf('week');
			var ed = sd.clone().add(6, 'days').format('D MMM');
			dateStr = sd.format('D MMM') + ' - ' + ed;
		} else {
			dateStr = date.format('MMMM');
		}

		svg.append('rect')
			.attr('x', x[selected])
			.attr('y', y[selected] - 50)
			.attr('width', 100)
			.attr('height', 50)
			.style('fill', '#fff')
			.attr('class', 'js-cal-tooltip');
		svg.append('text')
			.attr('y', y[selected])
			.attr('class', 'cal-tooltip js-cal-tooltip js-cal-tooltip-text');
		d3.select('.js-cal-tooltip-text').append('tspan')
				.attr('x', x[selected])
				.attr('dy', -20)
				.text(count[selected]);
		d3.select('.js-cal-tooltip-text').append('tspan')
				.attr('x', x[selected])
				.attr('dy', -20)
				.text(dateStr)
	}

	var drawCalendar = function (vis, rangeStr, data, unit) {

		//description
		var sober = data.sober[unit];
		var unitCount = data.unitCounts[unit];

		$('.js-count-sober').html(sober + ' ' + unit + 's');
		$('.js-count-total').html(unitCount + ' ' + unit + 's');

		var sT = moment(rangeStr[0]);
		var eT = moment(rangeStr[1]);

		//number of days - start with the first day of the month
		var startDate = sT.clone().startOf('month');
		var endDate = eT.clone().endOf('month');
		var daysCount = eT.diff(startDate, 'days');
		var count = endDate.diff(startDate, 'days') + 1;

		//w & h of each day block
		block = 12;
		var margin = vis.margin;
		var dim = { w: vis.w - margin.left - margin.right };
		margin.gap = 60;
		var rowC = Math.ceil(Math.ceil(count / 7) * 12 / dim.w);
		dim.h = rowC * (margin.gap + block * 7);
		//number of columns
		var colC = Math.ceil(dim.w / block);

		var svg = vis.draw({dim: dim, margin: margin}, 'calendar');

		//y axis day label
		_.each(_.range(rowC), function (i) {
			_.each(['S', 'M', 'T', 'W', 'T', 'F', 'S'], function (d, j) {
				svg.append('text')
					.attr('x', -2)
					.attr('y', margin.gap + i * (margin.gap + block * 7) + j * block)
					.attr('dy', block - 2)
					.text(d)
					.attr('class', 'cal-y-label');
			});
		});

		function putXLabel(date, x, row, colL, period) {
			svg.append('text')
				.attr('x', date.day() === 0 ? x * block : (x + 1) * block + 2)
				.attr('y', row * colL)
				.attr('dy', period === 'month' ? margin.gap - 6 : margin.gap - 20)
				.text(period === 'month' ? date.format('MMM') : date.year())
				.attr('class', 'cal-x-' + period);
		}

		//draw blocks
		_.each(_.range(count), function (i) {

			var day = i + startDate.day();
			var x = Math.floor(day / 7) % colC;
			var y = day % 7;
			var row = Math.floor(Math.floor(day / 7) / colC);
			//one column length
			var colL = margin.gap + 7 * block;

			var date = startDate.clone().add(i, 'days');
			var dataStr = date.format('YYYYMMDD');
			var style = {};
			var value;
			if (i <= sT.date() || i > daysCount) {
				style.opacity = 1;
				style.fill = '#e5e5e5';
				value = '--:--:--';
			} else {
				style.fill = color;
				style.opacity = data.list[dataStr][unit]/data.maxCount[unit];
				value = data.list[dataStr].day + ':' + data.list[dataStr].week + ':' + data.list[dataStr].month;
			}

			var bW = (unit === 'year') ? block : block - 1;
			var bH = (unit === 'day') ? block - 1 : block;

			//day
			var startOfMonth = day - date.date() + 1;
			var ttX = {
				day: x * block,
				week: x * block,
				month: (Math.floor(startOfMonth / 7) % colC + (startOfMonth % 7 === 0 ? 0 : 1)) * block
			};

			var ttY = {
				day: (margin.gap + y * block) + row * colL,
				week: margin.gap + row * colL,
				month: margin.gap + row * colL
			};

			svg.append('rect')
				.attr('x', x * block)
				.attr('y', (margin.gap + y * block) + row * colL)
				.attr('width', bW)
				.attr('height', bH)
				.attr('data-value', value)
				.attr('class', (i <= sT.date() || i > daysCount) ? '' : 'js-cal-block')
				.attr('fill', style.fill)
				.attr('opacity', style.opacity)
				.on('mouseover', function() {
					if (i > sT.date() && i <= daysCount) {
						showTooltip(svg, ttX, ttY, date, data.list[dataStr]);
					}
				})
				.on('mouseout', function() {
					$('.js-cal-tooltip').remove();
				});

			//month label
			if (i === 0 || date.date() === 1) {
				putXLabel(date, x, row, colL, 'month');
			}
			//year label
			if (i === 0 || date.dayOfYear() === 1) {
				putXLabel(date, x, row, colL, 'year');
			}
			//month divide line -- when new month starts
			if (i > 0 && date.date() === 1) {
				svg.append('path')
					.attr('d', 'M ' + (x * block - 1) +
						' ' + (colL * (row + 1) + margin.gap/6) +
						' v ' + -(margin.gap/6 + block * (7 - y) + 1) +
						((y > 0) ? ' h ' + block : '') +
						' v ' + -(y * block + margin.gap/4))
					.attr('class', 'cal-divide');
			}
		});
	};

	var setUnit = function (unit) {
		selected = unit;
		$('.js-count-period').removeClass('selected');
		$('.js-count-period-' + unit).addClass('selected');
	};

	return {
		setUnit: setUnit,
		drawFrequency: drawFrequency,
		drawCalendar: drawCalendar,
		transformCount: transformCount
	}
});
