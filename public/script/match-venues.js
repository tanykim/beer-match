define(['moment', 'textures'], function (moment, textures) {

	'user strict';

	var counts, types;

	var maxR;
	var r = [];
	var margin;
	var x = {};
	var xR = {};
	var xAxis = [];
	var tx;
	var firstMatch;
	var xBase = [];

	var arc = function (count, r) {
		return d3.svg.arc()
			.innerRadius(0)
	    	.outerRadius(r)
	    	.startAngle(0)
	    	.endAngle(Math.PI * 2 / count[1] * count[0]);
	};

	var updateGraph = function (selected) {

		var target;
		_.each(_.range(2), function (i) {
			if (r[i] < maxR) {
				target = i;
			}
		});

		//pie change
		d3.select('.js-venues-circle-' + target)
			.transition()
			.attr('r', (selected === 'abs' ? r[target] : maxR));
		d3.select('.js-venues-arc-' + target)
			.transition()
			.attr('d', arc(counts[target],
				selected === 'abs' ? r[target] : maxR));

		//count text
		d3.select('.js-venues-ratio-' + target)
			.attr('y', margin.top + maxR +
				(selected === 'abs' ? r[target] : maxR) + margin.gap / 2);
		_.each(_.range(2), function (i) {
			d3.select('.js-venues-ratio-' + i)
				.text( selected === 'abs' ?
					counts[i][0] + ' / ' + counts[i][1] :
					parseInt(counts[i][0] / counts[i][1] * 1000) / 10 + '%'
				);
		});

		//bar
		xAxis[0].scale(xR[selected]);
		xAxis[1].scale(x[selected]);
		d3.select('.js-venues-axis-x-0').transition().call(xAxis[0]);
		d3.select('.js-venues-axis-x-1').transition().call(xAxis[1]);
		$('.js-venues-lable').text(selected === 'abs' ? 'check-ins' : '% of all check-ins');
		d3.selectAll('.js-venues-bar')
			.transition()
			.attr('x', function (d) { return d.x[selected]; })
			.attr('width', function (d) { return d.width[selected]; });
		d3.selectAll('.js-venues-count')
			.transition()
			.attr('x', function (d) { return d.textX[selected]; })
			.text(function (d) { return d.val[selected]; });
	};

	var drawPublicRatio = function (vis, data, profile) {

		counts = data;

		margin = vis.margin;
		var dim = vis.dim;
		var svg = vis.svg;
		maxR = (dim.h - margin.gap) / 2;

		var maxRCount = _.max(_.flatten(data));

		svg.append('line')
			.attr('x1', dim.w/2)
			.attr('x2', dim.w/2)
			.attr('y1', -margin.top)
			.attr('y2', dim.h + margin.bottom)
			.attr('class', 'stroke-tick');

		_.each(data, function (d, i)  {
			var x = dim.w / 2 + (maxR + margin.center / 2) * (i === 0 ? -1 : 1);

			svg.append('text')
				.attr('x', x)
				.attr('y', margin.top / 2)
				.text(profile[i].username)
				.style('fill', E.users[i])
				.attr('class', 'pos-middle size-small');

			r[i] = Math.sqrt(d[1] * maxR * maxR / maxRCount);
			var y = margin.top + maxR;
			svg.append('circle')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', r[i])
				.attr('class', 'fill-white stroke-tick js-venues-circle-' + i);
			svg.append('path')
				.attr('d', arc(d, r[i]))
				.style('fill', E.users[i])
				.attr('transform', 'translate (' + x + ', ' + y + ')')
				.attr('class', 'js-venues-arc-' + i);
			svg.append('text')
				.attr('x', x)
				.attr('y', y + r[i] + margin.gap / 2)
				.text(d[0] + ' / ' + d[1])
				.attr('class', 'pos-middle js-venues-ratio-' + i);
		});
	};

	function putTexture(svg) {
		tx = _.map(E.users, function (d) {
			return textures.lines().size(6).background(d);
		});
		svg.call(tx[0]);
		svg.call(tx[1]);
	}

	function getCommonType(type, data, user, barH) {
		var id;
		var y;
		for (var i = 0; i < data.length; i++) {
			if (data[i].type === type) {
				id = user + '-' + i;
				y = i * barH + 10 + barH / 4;
				break;
			}
		}
		return {
			id: id,
			x: xBase[user],
			y: y
		};
	}

	function showMouseOver(svg, d, i, j, x1, y1, match) {

		d3.select('.js-venues-bar-' + i + '-' + j).style('fill', tx[i].url());
		if (!_.isUndefined(match.id)) {
			d3.select('.js-venues-bar-' + match.id)
				.style('fill', tx[-i + 1].url());
			svg.append('line')
				.attr('x1', x1)
				.attr('y1', y1)
				.attr('x2', match.x)
				.attr('y2', match.y)
				.attr('class', 'stroke-2 stroke-black js-venues-link');
		}
	}

	function drawEachType(svg, user, i, barH, dimW) {

		var data = _.map(user, function (d) {
			var abs = x.abs(d.count);
			var rel = x.rel(d.count / counts[i][1] * 100);
			return {
				type: d.type,
				base: xBase[i],
				width: {
					abs: abs,
					rel: rel
				},
				x: {
					abs: xBase[i] + (i === 0 ? -abs : 0),
					rel: xBase[i] + (i === 0 ? -rel : 0)
				},
				textX: {
					abs: xBase[i] + (i === 0 ? -abs - 9 : abs + 9),
					rel: xBase[i] + (i === 0 ? -rel - 9 : rel + 9)
				},
				val: {
					abs: d.count,
					rel: Math.floor(d.count / counts[i][1] * 1000) / 10 + '%'
				},
				places: d.venueIds.length + ' place' +
					(d.venueIds.length > 1 ? 's' : '')
			};
		});

		svg.selectAll('.js-venues-bar-' + i)
			.data(data)
				.enter().append('rect')
			.attr('x', function (d) { return d.x.abs; })
			.attr('y', function (d, j) { return barH * j + 10; })
			.attr('width', function (d) { return d.width.abs; })
			.attr('height', barH - 20)
			.style('fill', E.users[i])
			.attr('class', function (d, j) {
				return 'js-venues-bar js-venues-bar-' + i +
					' js-venues-bar-' + i + '-' + j;
			})
			.on('mouseover', function (d, j) {

				//revert initial highlight
				d3.select('.js-venues-bar-0-0').style('fill', E.users[0]);
				if (firstMatch) {
					d3.select('.js-venues-bar-' + firstMatch.id)
						.style('fill', E.users[1]);
				}

				var xPos = d.base;
				var yPos = barH * j + 10 + barH / 4;
				var match = getCommonType(d.type, types[-i + 1], -i + 1, barH);

				showMouseOver(svg, d, i, j, xPos, yPos, match);

				E.setTooltipText([d.places, d.val.abs + ' check-ins', d.type],
					'venues', dimW,
					xPos + (i === 0 ? -d.width.abs : d.width.abs) / 2, yPos);
			})
			.on('mouseout', function (d) {
				var match = getCommonType(d.type, types[-i + 1], -i + 1, barH);
				d3.select(this).style('fill', E.users[i]);
				d3.select('.js-venues-bar-' + match.id)
					.style('fill', E.users[-i + 1]);
				$('.js-venues-link').remove();
				$('.js-venues-tooltip').hide();
			});

		svg.selectAll('.js-venues-count-' + i)
			.data(data)
				.enter().append('text')
			.attr('x', function (d) {
				return d.textX.abs;
			})
			.attr('y', function (d, j) {
				return barH * j + 10 + (barH - 20) / 2;
			})
			.text(function (d) { return d.val.abs; })
			.attr('class', (i === 0 ? 'pos-end' : '') + ' v-middle ' +
				'size-small js-venues-count js-venues-count-' + i);
		//icons
		_.each(user, function (d, j) {
			svg.append('image')
				.attr('x', xBase[i] + (i === 0 ? 10 : - barH))
				.attr('y', barH * j)
				.attr('xlink:href', d.icon)
				.attr('width', barH - 10)
				.attr('height', barH - 10);
		});
	}

	var drawTopTypes = function (vis, data) {

		types = data;

		var margin = vis.margin;
		var dim = { w: vis.w - margin.left - margin.right };
		var barH = 40;
		dim.h = barH * 10;
		var svg = vis.draw({dim: dim, margin: margin}, 'topTypes');

		var maxCount = _.map(data, function (d) {
			return _.max(_.pluck(d, 'count'));
		});
		var maxRatio = _.map(data, function (d, i) {
			return Math.ceil(_.max(_.pluck(d, 'count')) / counts[i][1] * 100);
		});
		var absMax = E.getAxisTicks(_.max(maxCount)).endPoint;
		var relMax = E.getAxisTicks(_.max(maxRatio)).endPoint;
		x.abs = d3.scale.linear().range([0, dim.w / 2 - margin.center * 2])
			.domain([0, absMax]);
		x.rel = d3.scale.linear().range([0, dim.w / 2 - margin.center * 2])
			.domain([0, relMax]);
		xR.abs = d3.scale.linear().range([0, dim.w / 2 - margin.center * 2])
			.domain([absMax, 0]);
		xR.rel = d3.scale.linear().range([0, dim.w / 2 - margin.center * 2])
			.domain([relMax, 0]);

	    putTexture(svg);

	    _.each(data, function (user, i) {
			xBase[i] = dim.w / 2 + margin.center * (i === 0 ? -1 : 1);
			//axis
			xAxis = [
				d3.svg.axis().scale(xR.abs).orient('top')
					.tickPadding(E.noTicks.padding).tickSize(-dim.h),
				d3.svg.axis().scale(x.abs).orient('top')
					.tickPadding(E.noTicks.padding).tickSize(-dim.h)
			];
			svg.append('g')
				.attr('class', 'x axis js-venues-axis-x-' + i)
				.call(xAxis[i])
				.attr('transform', 'translate(' +
					(i === 0 ? xBase[i] - x.abs(absMax) : xBase[i]) + ', 0)');

			drawEachType(svg, user, i, barH, dim.w);
		});

		//lable
		E.putAxisLable(svg, dim.w / 4, -80, 'check-ins', 'x',
			'js-venues-lable');
		E.putAxisLable(svg, dim.w / 4 * 3, -80, 'check-ins', 'x',
			'js-venues-lable');

		//show texture
		var firstData = !_.isEmpty(data[0]) ? data[0][0] : data[1][0];
		firstMatch = getCommonType(firstData.type, types[1], 1, barH);
		showMouseOver(svg, firstData, 0, 0,
			dim.w / 2 + (_.isEmpty(data[0]) ? margin.center : -margin.center),
			barH / 2, firstMatch);

		//tooltip
		E.drawTooltip(svg, 'venues', 3);
		E.setTooltipText([firstData.venueIds.length + ' places',
			firstData.count + ' check-ins', firstData.type], 'venues', dim.w,
			(dim.w / 2 + x.abs(firstData.count) / 2 *
			(_.isEmpty(data[0]) ? 1 : -1)), barH / 2);
	};

	function getTooltipText(d) {
		return [ moment(d.commonDates[0], 'YYYYMMDD').format('MMM D, YYYY') +
				(_.size(d.commonDates) > 1 ? ' ...' : ''),
				_.size(d.commonDates) + ' same dates'];
	}

	var drawCommonVenues = function (vis, data) {

		$('.js-commonVenues-title').html('You both drank ' +
			(_.size(data) === 1 ? 'this place' :
				'these ' + _.size(data) + ' places'));

		var margin = vis.margin;
		var dim = { w: vis.w - margin.left - margin.right };
		var barH = 60;
		dim.h = barH * _.size(data);
		var svg = vis.draw({dim: dim, margin: margin}, 'commonVenues');

		var maxVal = _.max(_.flatten(_.pluck(data, 'counts')));
		var x = d3.scale.linear().range([0, dim.w / 2])
			.domain([0, E.getAxisTicks(maxVal, dim.w / 2).endPoint]);
		var xAxis =	d3.svg.axis().scale(x).orient('top')
					.tickPadding(E.noTicks.padding).tickSize(-dim.h);
		svg.append('g')
			.attr('class', 'x axis')
			.call(xAxis)
			.attr('transform', 'translate(' + dim.w / 2 + ', 0)');
		E.putAxisLable(svg, dim.w / 4 * 3, -80, 'check-ins', 'x');

		_.each(data, function (d, i) {
			svg.append('text')
				.attr('x', dim.w / 2 - E.noTicks.padding)
				.attr('y', barH * i + barH / 3)
				.text(d.name)
				.attr('class', 'size-middle pos-end ' +
					'js-venues-common-name-' + i);
			svg.append('text')
				.attr('x', dim.w / 2 - E.noTicks.padding)
				.attr('y', barH * i + barH / 3 + 16)
				.text(d.city)
				.attr('class', 'size-small pos-end fill-grey ' +
					'js-venues-common-city-' + i);

			if (_.size(d.commonDates) > 0) {

				var xPos = dim.w / 2 - 24 -
					$('.js-venues-common-name-' + i).width();
				var sameDate = svg.append('g')
					.attr('transform', 'translate(' + xPos + ', ' +
						(barH * i + 6) + ')')
					.on('mouseover', function() {
						E.setTooltipText(getTooltipText(d), 'commonVenues',
							dim.w,
							(dim.w / 2 - 24 -
							$('.js-venues-common-name-' + i).width()),
							barH * i);
					})
					.on('mouseout', function() {
						$('.js-commonVenues-tooltip').hide();
					});
				sameDate.append('circle')
					.attr('cx', 0)
					.attr('cy', 0)
					.attr('r', 10)
					.attr('class', 'fill-grey stroke-dashed');
				sameDate.append('text')
					.attr('x', 0)
					.attr('y', 0)
					.text(_.size(d.commonDates))
					.attr('class', 'v-middle pos-middle size-tiny fill-white ' +
						'unselectable');
			}

			_.each(d.counts, function (c, j) {
				svg.append('rect')
					.attr('x', dim.w / 2)
					.attr('y', barH * i + barH / 3 * j + 4)
					.attr('width', x(c))
					.attr('height', barH / 3 - 2)
					.style('fill', E.users[j]);
				svg.append('text')
					.attr('x', dim.w / 2 + x(c) + E.noTicks.padding)
					.attr('y', barH * i + barH / 3 * j + 4 + barH / 6)
					.text(c)
					.attr('class', 'size-small v-middle fill-grey');
			});
		});

		//tooltip
		var sd = _.map(data, function (d) {
			return d.commonDates.length;
		});
		var firstSd;
		for (var i = 0 ; i < sd.length; i++) {
			if (sd[i] > 0) {
				firstSd = i;
				break;
			}
		}
		if (!_.isUndefined(firstSd)) {
			E.drawTooltip(svg, 'commonVenues', 2);
			E.setTooltipText(getTooltipText(data[0]),
				'commonVenues', dim.w,
				(dim.w / 2 - 24 - $('.js-venues-common-name-0').width()), 0);
		}
	};

	return {
		drawPublicRatio: drawPublicRatio,
		drawTopTypes: drawTopTypes,
		updateGraph: updateGraph,
		drawCommonVenues: drawCommonVenues
	};
});
