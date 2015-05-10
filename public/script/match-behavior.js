define(['textures'], function (textures) {

	var selected = 0;
	var data, count;
	var unitH;
	var svg, y0, y, yAxis, h, avgUnit;

	var lables = [
		['Heavy Drinker', 'Light Drinker'],
		['Explorer', 'Loyal Patron'],
		['Weekend', '7 Days'],
		['Drinking Out', 'Recluse'],
		['Daytime', 'After Sunset']
	];

	function updateGraph(i) {

		var title = ['', 'Distinctive Beers', 'Friday, Saturday & Sunday',
			'With Location', 'Before 5PM'];

		$('.js-detail-title').html(title[i]);
		$('.js-detail-sub').removeClass('hide');

		$('.js-behavior-y').attr('class', 'y axis js-behavior-y')

		$('.js-detail-bg').attr('class', 'fill-lightGrey js-detail-bg');
		_.each(_.range(2), function (user) {
			d3.select('.js-detail-bar-' + user).attr('y', y(data[i][user]))
				.attr('height', h - y(data[i][user]));
			d3.select('.js-detail-text-' + user)
				.attr('y', y(data[i][user]))
				.style('fill', E.users[user])
				.text(parseInt(data[i][user] * 1000) / 10 + '%');
		});
	}

	function updateGraphCount() {

		$('.js-detail-title').html('Check-ins / ' + avgUnit);
		$('.js-detail-sub').addClass('hide');

		$('.js-behavior-y').attr('class', 'y axis hide js-behavior-y');

		$('.js-detail-bg').attr('class', 'fill-lightGrey hide js-detail-bg');
		_.each(_.range(2), function (user) {
			d3.select('.js-detail-bar-' + user)
				.attr('y', y0(count[user][avgUnit]))
				.attr('height', h - y0(count[user][avgUnit]));
			d3.select('.js-detail-text-' + user)
				.attr('y', y0(count[user][avgUnit]) + 30)
				.style('fill', '#fff')
				.text(count[user][avgUnit]);
		});

	}

	function updateDetail(i) {
		d3.selectAll('.js-behavior-bar').style('stroke', '#e5e5e5');
		d3.select('.js-bahavior-bg').transition()
			.attr('transform', 'translate(0 ,' + unitH * i + ')')
			.each('end', function() {
				d3.select('.js-behavior-bar-' + i).style('stroke', '#999999');
				if (i === 0) {
					updateGraphCount();
				} else {
					updateGraph(i);
				}
			});
	}

	var drawBehavior = function (vis, d, avatars) {

		data = d;
		var margin = vis.margin;
		var dim = vis.dim;
		var svg = vis.svg;
		unitH = dim.h / 5;

		//background
		var tx = textures.lines().size(6).stroke('#e5e5e5');
		svg.call(tx);
		svg.append('path')
			.attr('d', 'M ' + -margin.left + ' 0 h ' +
				(dim.w + margin.left + margin.right - 14) +
				' v ' + (dim.h / 10 - 10) +
				' l 14 10 l -14 10 v ' + (dim.h / 10 - 10) +
				' h ' + -(dim.w + margin.left + margin.right - 14) + ' z')
			.attr('fill', tx.url())
			.attr('class', 'js-bahavior-bg');

		var x = d3.scale.linear().range([0, dim.w]).domain([0, 1]);

		//center line
		svg.append('line')
			.attr('class', 'stroke-lightGrey')
			.attr('x1', dim.w / 2)
			.attr('x2', dim.w / 2)
			.attr('y1', -margin.top)
			.attr('y2', dim.h + margin.bottom);

		//connecting lines
		var line = d3.svg.line()
		    .x(function (d) { return x(d); })
		    .y(function (d, i) { return dim.h / 5 * i + dim.h / 10; });
		_.each(_.range(2), function (user) {
			svg.append('path')
				.datum(_.map(data, function (d) { return d[user]; }))
				.attr('d', function (d, i) { return line(d, i); })
				.style('stroke', E.users[user])
				.attr('class', 'fill-none stroke-1 stroke-dashed');
		});

		_.each(data, function (d, i) {

			var yPos = dim.h / 5 * i + dim.h / 10;

			svg.append('line')
				.attr('x1', 0)
				.attr('x2', dim.w)
				.attr('y1', yPos)
				.attr('y2', yPos)
				.style('stroke-width', 10)
				.style('stroke-linecap', 'round')
				.style('stroke', (i === 0 ? '#999999' : '#e5e5e5'))
				.attr('class', 'js-behavior-bar js-behavior-bar-' + i)
			svg.append('text')
				.attr('x', -20)
				.attr('y', yPos)
				.text(lables[i][1])
				.attr('class', 'pos-end v-middle');
			svg.append('text')
				.attr('x', dim.w + 20)
				.attr('y', yPos)
				.text(lables[i][0])
				.attr('class', 'v-middle');

			_.each(_.range(2), function (user) {
				svg.append('circle')
					.style('fill', '#fff')
					.style('stroke', E.users[user])
					.style('stroke-width', 3)
					.attr('cx', x(d[user]))
					.attr('cy', yPos)
					.attr('r', 7);
			});

			//transparent link
			svg.append('rect')
				.attr('x', -margin.left)
				.attr('y', yPos - dim.h / 10)
				.attr('width', dim.w + margin.left + margin.right)
				.attr('height', dim.h / 5)
				.style('opacity', 0)
				.attr('class', 'link')
				.on('click', function () {
					if (selected !== i) {
						updateDetail(i);
						selected = i;
					}
				});
		});
	};

	var drawDetail = function (vis, c) {

		count = c;
		var margin = vis.margin;
		var dim = vis.dim;
		svg = vis.svg;
		h = dim.h;

		avgUnit = 'week';
		if (count[0][avgUnit] + count[1][avgUnit] < 2) {
			avgUnit = 'month';
		} else if (count[0][avgUnit] + count[1][avgUnit] > 40) {
			avgUnit = 'day';
		}

		$('.js-detail-title').html('Check-ins / ' + avgUnit);

		var x = d3.scale.ordinal().rangeBands([0, dim.w])
			.domain(_.pluck(count, 'username'));
		y0 = d3.scale.linear().range([dim.h, 0])
			.domain([0, _.max(_.pluck(count, avgUnit))]);
		y = d3.scale.linear().range([dim.h, 0]).domain([0, 1]);
		var xAxis = d3.svg.axis().scale(x).orient('bottom');
		yAxis = d3.svg.axis().scale(y).tickSize(-dim.w).orient('left')
			.ticks(2).tickFormat('');

		//bar bg
		_.each(count, function (d, i) {
			svg.append('rect')
				.attr('x', x(d.username) + dim.w / 8)
				.attr('y', 0)
				.attr('width', dim.w / 4)
				.attr('height', dim.h)
				.attr('class', 'fill-lightGrey hide js-detail-bg')
		});

		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'y axis hide js-behavior-y')
			.call(yAxis);

		_.each(count, function (d, i) {
			svg.append('rect')
				.attr('x', x(d.username) + dim.w / 8)
				.attr('y', y0(d[avgUnit]))
				.attr('width', dim.w / 4)
				.attr('height', dim.h - y0(d[avgUnit]))
				.style('fill', E.users[i])
				.attr('class', 'js-detail-bar-' + i)
			svg.append('text')
				.attr('x', x(d.username) + dim.w / 4)
				.attr('y', y0(d[avgUnit]) + 30)
				.attr('dy', -6)
				.text(d[avgUnit])
				.style('fill', '#fff')
				.attr('class', 'pos-middle size-middle js-detail-text-' + i);
		});
	};

	return {
		drawBehavior: drawBehavior,
		drawDetail: drawDetail
	};
});
