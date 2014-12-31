define(['vis-settings', 'moment'], function (Settings, moment) {

	var colors = Settings.colors;

	var putCount = function (checkin, count, unit) {
		$('.js-avg-checkin').html(checkin);
		$('.js-avg-count').html(count[unit]);
		$('.js-avg-unit').html(unit);	
	};
	
	function drawFreqBlocks(data, vis, maxCount, avgCount) {

		var svg = vis.svg;
		var x = vis.x;
		var y = vis.y;
		var dim = vis.dim;
		var margin = vis.margin;

		var lastKey;
		_.each(data, function (val, key) {
			svg.append('rect')
				.attr('x', x(key))
				.attr('y', y(val))
				.attr('width', dim.w/(_.size(data) -1))
				.attr('height', dim.h - y(val))
				.attr('fill', colors.brewery)
				.attr('fill-opacity', key / maxCount)
				.attr('class', 'freq-block js-freq-block');
			lastKey = key;
			svg.append('text')
				.attr('x', x(key) + dim.w/(_.size(data) -1) / 2)
				.attr('y', y(val))
				.text(val)
				.attr('class', 'freq-label-block js-freq-block')
		});

		//average line
		var xLinear = d3.scale.linear().range([0, dim.w])
			.domain([0, +lastKey]);
		svg.append('line')
			.attr('x1', xLinear(avgCount))
			.attr('x2', xLinear(avgCount))
			.attr('y1', -margin.top/2)
			.attr('y2', dim.h + margin.bottom/2)
			.attr('class', 'freq-line-avg js-freq-block');
		svg.append('text')
			.attr('x', xLinear(avgCount))
			.attr('y', -margin.top/2)
			.text('average')
			.attr('class', 'freq-text-avg js-freq-block')
	}

	function getFreqTicks(val) {
		return val < 4 ? val : 4;
	}

	var transformCount = function (data, avgCount, block, vis) {
		
		var unit = $('input[name=period]:checked').val();
		var frequency = data.frequency[unit];
		var maxCount = data.maxCount[unit];
				
		//html
		$('.js-avg-count').html(avgCount[unit]);
		$('.js-avg-unit').html(unit);	

		//frequency
		//domain
		vis.x.domain(_.keys(frequency));
		vis.y.domain([_.max(frequency), 0]);
		vis.xAxis.scale(vis.x);
		vis.yAxis.scale(vis.y).ticks(getFreqTicks(_.max(frequency)));
		d3.select('.js-freq-axis-x').call(vis.xAxis);
		d3.select('.js-freq-axis-y').call(vis.yAxis);
		$('.js-freq-lable-x').html('beers /' + unit);
		$('.js-freq-lable-y').html('number of ' + unit + 's');
		//blocks
		$('.js-freq-block').remove();
		drawFreqBlocks(frequency, vis, maxCount, avgCount[unit]);

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

	var drawFrequency = function (data, avgCount, unit) {

		var frequency = data.frequency[unit];
		var maxCount = data.maxCount[unit];

		var margin = { top: 20, right: 20, bottom: 40, left: 40 };
		var dim = { w: $('.frequency').width() - margin.left - margin.right,
					h:  140 };

		var x = d3.scale.ordinal().rangePoints([0, dim.w], 0)
			.domain(_.keys(frequency));

		var xAxis = d3.svg.axis().scale(x).orient('bottom').tickSize(-dim.h).ticks(24).ticks(_.size(frequency));
		var y = d3.scale.linear().range([0, dim.h])
				.domain([_.max(frequency), 0]);
		var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-dim.w)
				.ticks(getFreqTicks(_.max(frequency)));

		var svg = d3.select('#vis-frequency').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		
		svg.append('g')
			.attr('class', 'x axis js-freq-axis-x')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'y axis js-freq-axis-y')
			.call(yAxis);

		svg.append('text')
			.attr('x', dim.w)
			.attr('y', dim.h + margin.bottom/2)
			.text('beers /' + unit)
			.attr('class', 'freq-label js-freq-lable-x');
		svg.append('text')
			.attr('x', 0)
			.attr('y', -margin.top/2)
			.text('number of ' + unit + 's')
			.attr('class', 'freq-label js-freq-lable-y')
			.attr('transform', 'rotate(-90)');

		var vis = {
			svg: svg,
			dim: dim,
			margin: margin,
			x: x,
			y: y,
			xAxis: xAxis,
			yAxis: yAxis
		}

		drawFreqBlocks(frequency, vis, maxCount, avgCount[unit]);

		return vis;
	};

	function showTooltip(svg, x, y, date, count) {
		var unit = $('input[name=period]:checked').val();
		var dateStr; 
		if (unit === 'day') {
			dateStr = date.format('D MMM');
		} else if (unit === 'week') {
			var sd = date.clone().startOf('week');
			var ed = sd.clone().add(6, 'days').format('D MMM');
			dateStr = sd.format('D MMM') + ' - ' + ed;
		} else {
			dateStr = date.format('MMMM');
		}

		svg.append('rect')
			.attr('x', x[unit])
			.attr('y', y[unit] - 50)
			.attr('width', 100)
			.attr('height', 50)
			.attr('fill', '#fff')
			.attr('class', 'js-cal-tooltip');
		svg.append('text')
			.attr('y', y[unit])
			.attr('class', 'cal-tooltip js-cal-tooltip js-cal-tooltip-text');
		d3.select('.js-cal-tooltip-text').append('tspan')
				.attr('x', x[unit])
				.attr('dy', -20)
				.text(count[unit]);
		d3.select('.js-cal-tooltip-text').append('tspan')
				.attr('x', x[unit])
				.attr('dy', -20)
				.text(dateStr)
	}

	var drawCalendar = function (rangeStr, data, unit) {
		
		var sT = moment(rangeStr[0]);
		var eT = moment(rangeStr[1]);

		//number of days - start with the first day of the month
		var startDate = sT.clone().startOf('month');
		var endDate = eT.clone().endOf('month'); 
		var daysCount = eT.diff(startDate, 'days');
		var count = endDate.diff(startDate, 'days') + 1;

		// w & h of each day block
		var block = 12;
		var dim = {};
		var margin = { top: 50, bottom: 10, left: 40, right: 30, gap: 60 };
		dim.w = $('.calendar').width() - margin.left - margin.right;
		var rowC = Math.ceil(Math.ceil(count / 7) * 12 / dim.w);
		dim.h = rowC * (margin.gap + block * 7);
		//number of columns
		var colC = Math.ceil(dim.w / block);
		var svg = d3.select('#vis-calendar').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

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
				style.fill = colors.brewery;
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

		return block;
	};

	return {
		putCount: putCount,
		transformCount: transformCount,
		drawFrequency: drawFrequency,
		drawCalendar: drawCalendar
	}
});
