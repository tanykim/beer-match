define(['moment', 'textures'], function (moment, textures) {

	'use strict';

	var selected = 'matrix';
	var colors;
	var dim, x, y, xAxis, yAxis;
	var tx;
	var mb;

	function resetMaxTexture() {
		d3.select('.js-matrix-block-' + mb).style('fill', E.colors.when);
	}

	var updateGraph = function (option) {

		selected = option;

		if (selected === 'matrix') {
	 		d3.selectAll('.js-matrix-block')
					.transition().duration(750)
				.style('fill-opacity', function (d) { return d.opacity[option]; })
				.attr('class', 'stroke-tick js-matrix-block')
				.each('end', function (d) {
					d3.select(this).transition().delay(500)
						.attr('x', function (d) { return d.x[option]; })
						.attr('y', function (d) { return d.y[option]; })
						.attr('width', function (d) { return d.width[option]; })
						.attr('height', function (d) { return d.height[option]; });
				});
			$('.js-matrix-legend').show();
			$('.js-matrix-y').find('.tick').find('line')
				.attr('transform', 'translate(0, ' + dim.h/7/2 + ')');
			$('.js-matrix-vals-hour').hide();
			$('.js-matrix-vals-day').hide();
			$('.js-matrix-lable-x').hide();
			$('.js-matrix-lable-y').hide();
		} else {
			resetMaxTexture();
	 		d3.selectAll('.js-matrix-block')
					.transition().duration(750)
				.attr('x', function (d) { return d.x[option]; })
				.attr('y', function (d) { return d.y[option]; })
				.attr('width', function (d) { return d.width[option]; })
				.attr('height', function (d) { return d.height[option]; })
				.each('end', function (d, i) {
					d3.select(this).transition().delay(500)
						.style('fill-opacity', function (d) {
							return d.opacity[option];
						})
						.attr('class', 'stroke-when js-matrix-block');
					if (i === 24 * 7 - 1) {
						if (selected === 'day') {
							$('.js-matrix-vals-day').show();
						} else {
							$('.js-matrix-vals-hour').show();
						}
					}
				});
			if (selected === 'day') {
				$('.js-matrix-vals-hour').hide();
				$('.js-matrix-lable-x').show();
				$('.js-matrix-lable-y').hide();
			} else {
				$('.js-matrix-vals-day').hide();
				$('.js-matrix-lable-x').hide();
				$('.js-matrix-lable-y').show();
			}
			$('.js-matrix-y').find('.tick').find('line').removeAttr('transform');
			$('.js-matrix-legend').hide();
			$('.js-matrix-tooltip').hide();
		}

		d3.select('.js-matrix-x').transition().call(xAxis[option]);
		d3.select('.js-matrix-y').transition().call(yAxis[option]);
	};

	function getSum(arr, i) {
		return _.reduce(arr.slice(0, i), function (memo, num) {
			return memo + num;
		}, 0);
	}

	function createMatrixDataset (byHour, byDay, maxVal) {

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
						hour: x.hour(i) + 1
					},
					y: {
						matrix: y.matrix(day),
						day: y.day(day) + 1,
						hour: y.hour(getSum(hour.byDay, day + 1)),
					},
					width: {
						matrix: dim.w / 24,
						day: x.day(d),
						hour: dim.w / 24 - 2
					},
					height: {
						matrix: dim.h / 7,
						day: dim.h / 7 - 2,
						hour: dim.h - y.hour(d)
					},
					opacity: {
						matrix: d / Math.max(maxVal, 10),
						day: 1,
						hour: 1
					},
					val: d,
					str: moment(day, 'e').format('dddd') + ' & ' +
							moment(i, 'H').format('ha') + ' - ' +
							moment(i, 'H').add(1, 'hours').format('ha'),
					order: i * 7 + day
				};
			});
		}));
	}

	function setTextures(svg, opacity) {
		$('#vis-matrix').find('def').remove();
		tx = textures.lines().size(6).lighter()
			.background('rgba(124, 37, 41, ' + opacity +')');
		svg.call(tx);
	}

	function drawBlocks(svg, dim, dataset, maxVal) {
		svg.selectAll('.js-matrix-block')
			.data(dataset)
				.enter().append('rect')
			.attr('x', function (d) { return d.x.matrix; })
			.attr('y', function (d) { return d.y.matrix; })
			.attr('width', function (d) { return d.width.matrix; })
			.attr('height', function (d) { return d.height.matrix; })
			.style('fill', E.colors.when)
			.style('fill-opacity', function (d) { return d.opacity.matrix; })
			.attr('class', function (d, i) {
				return 'stroke-1 stroke-tick js-matrix-block ' +
					'js-matrix-block-' + i;
			})
			.on('mouseover', function (d, i) {
				resetMaxTexture();
				if (selected === 'matrix') {
					E.setTooltipText([d.str, d.val + ' check-ins'],
						'matrix', dim.w, d.x.matrix + d.width.matrix / 2,
						d.y.matrix);
					setTextures(svg, d.val/maxVal);
					d3.select(this).style('fill', tx.url())
						.style('fill-opacity', 1);
				}
			})
			.on('mouseout', function (d) {
				$('.js-matrix-tooltip').hide();
				d3.select(this).style('fill', E.colors.when);
				if (selected === 'matrix') {
					d3.select(this).style('fill-opacity', d.opacity.matrix);
				}
			});
	}

	function drawValues(svg, dim, byHour, byDay) {
		svg.selectAll('.js-matrix-vals-hour')
			.data(_.pluck(byHour, 'total'))
				.enter().append('text')
			.attr('x', function (d, i) { return dim.w / 48 * (i * 2 + 1); })
			.attr('y', function (d) { return y.hour(d) - 6; })
			.text(function (d) { return d; })
			.style('fill', E.colors.when)
			.attr('class', 'size-middle pos-middle ' +
				'js-matrix-vals-hour')
		svg.selectAll('.js-matrix-vals-day')
			.data(_.pluck(byDay, 'total'))
				.enter().append('text')
			.attr('x', function (d) { return x.day(d) + 6; })
			.attr('y', function (d, i) { return dim.h / 14 * (i * 2 + 1); })
			.text(function (d) { return d; })
			.style('fill', E.colors.when)
			.attr('class', 'size-middle v-middle js-matrix-vals-day')
		$('.js-matrix-vals-hour').hide();
		$('.js-matrix-vals-day').hide();
	}

	var drawMatrix = function (vis, byDay, byHour, c) {

		colors = c;
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
			day: d3.scale.linear().range([0, dim.w])
				.domain([0, dayTicks.endPoint]),
			hour: xBase
		};
		xAxis = {
			matrix: d3.svg.axis().orient('bottom').scale(xBase).tickSize(0)
					.tickPadding(E.noTicks.padding)
					.tickFormat(function (d) {
						return moment(d, 'hh').format('ha');
					}),
			day: d3.svg.axis().orient('bottom').scale(x.day).tickSize(-dim.h)
					.tickPadding(E.noTicks.padding).ticks(dayTicks.count),
			hour: d3.svg.axis().orient('bottom').scale(xBase)
					.tickFormat(function (d) {
						return moment(d, 'hh').format('ha');
					})
		};

		var hourTicks = E.getAxisTicks(maxVals.hour, dim.h);
		var yBase = d3.scale.ordinal().rangeBands([0, dim.h])
			.domain([0, 1, 2, 3, 4, 5, 6]);
		y = {
			matrix: yBase,
			day: yBase,
			hour: d3.scale.linear().range([0, dim.h])
				.domain([hourTicks.endPoint, 0])
		};
		yAxis = {
			matrix: d3.svg.axis().orient('left').scale(y.matrix).tickSize(0)
					.tickPadding(E.noTicks.padding)
					.tickFormat(function (d) {
						return moment(d, 'd').format('ddd');
					}),
			day: d3.svg.axis().orient('left').scale(y.matrix)
					.tickFormat(function (d) {
						return moment(d, 'd').format('ddd');
					}),
			hour: d3.svg.axis().orient('left').scale(y.hour).tickSize(-dim.w)
					.tickPadding(E.noTicks.padding).ticks(hourTicks.count)
		};

		//legends
		var chromaVals = E.getAxisTicks(maxVals.matrix);
		E.drawChromaLegend(svg, dim.w, -40, 10,
			(maxVals.matrix > 10 ? chromaVals.endPoint : 10) / 10,
			'matrix', colors);
		E.putAxisLable(svg, dim.w / 2, dim.h,
			'check-ins', 'x', 'js-matrix-lable-x');
		E.putAxisLable(svg, -dim.h / 2, 0,
			'check-ins', 'y', 'js-matrix-lable-y');
		$('.js-matrix-lable-x').hide();
		$('.js-matrix-lable-y').hide();

		//white bg
		svg.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', dim.w)
			.attr('height', dim.h)
			.attr('class', 'fill-white');

		//matrix dataset
		var dataset = createMatrixDataset(byHour, byDay, maxVals.matrix);
		drawBlocks(svg, dim, dataset, maxVals.matrix);
		drawValues(svg, dim, byHour, byDay);

		svg.append('g')
			.attr('class', 'x axis js-matrix-x')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis.matrix);
		svg.append('g')
			.attr('class', 'y axis js-matrix-y')
			.call(yAxis.matrix);

		//tooltip at the max day position
		E.drawTooltip(svg, 'matrix', 2);
		var maxBlock = _.max(dataset, function (d) { return d.val; });
		E.setTooltipText([maxBlock.str, maxBlock.val + ' check-ins'],
			'matrix', dim.w, maxBlock.x.matrix + maxBlock.width.matrix / 2,
			maxBlock.y.matrix);
		setTextures (svg, 1);
		mb = maxBlock.order;
		d3.select('.js-matrix-block-' + mb).style('fill', tx.url());
	};

	return {
		drawMatrix: drawMatrix,
		updateGraph: updateGraph
	}
});