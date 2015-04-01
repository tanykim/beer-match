define(function() {

	var colors = E.category.colors;

	//for bars
	var dim, margin, sv, x, xAxis, baseH;

	var transformRatingsBar = function (list, sortBy) {
		_.each(list, function (d, i) {
			d3.selectAll('.js-ratings-bar-' + i).attr('y', d.order[sortBy] * baseH);
			d3.selectAll('.js-ratings-text-' + i).attr('y', d.order[sortBy] * baseH + baseH - 4);
		});
	};

	var drawRatings = function(list, category, sortBy, avgScore, vis) {

		$('.js-ratings-elm').remove();

		if (vis) {
			baseH = 20;
			margin = vis.margin;
			dim = { w: vis.w - margin.left - margin.right, h: _.size(list) * baseH };
			svg = vis.draw({dim: dim, margin: margin}, 'ratings');
			x = d3.scale.linear().range([0, dim.w]).domain([0, 5]);
			xAxis = d3.svg.axis().scale(x).orient('top').tickSize(-dim.h)
						.tickPadding(E.noTicks.padding)
						.tickFormat(d3.format('d'));
		}

		_.each(list, function (d, i) {
			var yPos = d.order[sortBy] * baseH;
			var fill = '#efefef';
			var fillOpacity = 1;
			if ( d.order.count < 10 ) {
				fill = colors[category];
				fillOpacity = (10 - d.order.count)/10;
			}
			svg.append('rect')
				.attr('x', 0)
				.attr('y', yPos)
				.attr('width', x(d.rating))
				.attr('height', baseH - 2)
				.style('fill', fill)
				.style('fill-opacity', fillOpacity)
				.attr('class', 'js-ratings-elm js-ratings-bar-' + i)
				.on('mouseover', function () {
					// console.log(d.name, d.count, d.rating, d.beers);
				});
			svg.append('text')
				.attr('x', -E.noTicks.padding)
				.attr('y', yPos + baseH - 4)
				.text(d.name)
				.attr('class', 'pos-end js-ratings-elm js-ratings-text-' + i + ' js-ratings-bar-' + i);
		});

		svg.append('g')
			.attr('class', 'x axis js-ratings-axis js-ratings-elm')
			.call(xAxis);

		if (avgScore) {
			svg.append('line')
				.attr('x1', x(avgScore))
				.attr('x2', x(avgScore))
				.attr('y1', -margin.top)
				.attr('y2', dim.h)
				.attr('class', 'stroke-black stroke-2');
			svg.append('text')
				.attr('x', dim.w)
				.attr('y', -margin.top / 2)
				.text('Rating')
				.attr('class', 'pos-end size-normal')
		}
	};

	var drawCategories = function (vis, category, checkinCount, data) {

		var margin = vis.margin;
		var dim = { w: vis.w, h: vis.w };
		var r = dim.w/2;
		var svg = vis.draw({dim: dim, margin: margin}, 'categories-' + category);

		var arc = function (start, count) {
			var sA = Math.PI * 2 / checkinCount * start;
			var eA = Math.PI * 2 / checkinCount * (start + count);
			return d3.svg.arc()
				.innerRadius(0)
		    	.outerRadius(r)
		    	.startAngle(sA)
		    	.endAngle(eA);
		};

		var xPos = dim.w/2;
		svg.append('text')
			.attr('x', xPos)
			.attr('y', 0)
			.attr('class', 'ratings-arc-over js-ratings-arc-over-' + category);
		_.each(data, function(d) {
			svg.append('path')
				.attr('d', arc(d.accCount.count, d.count))
				.attr('data-value', category)
				.attr('fill', colors[category])
				.attr('stroke', '#000')
				.attr('stroke-width', 1)
				.attr('opacity', 1 - d.order.count/10)
		    	.attr('transform', 'translate (' + xPos + ', ' + (dim.h/2) + ')')
		    	.on('mouseover', function() {
		    		d3.select('.js-ratings-arc-over-' + $(this).data().value).text(d.name + '(' + d.count + ')')
				})
				.on('mouseout', function() {
		    		d3.select('.js-ratings-arc-over-' + $(this).data().value).text('');
				});
		});
		svg.append('circle')
			.attr('cx', xPos)
			.attr('cy', dim.h/2)
			.attr('r', r)
			.attr('fill', 'none')
			.attr('stroke', '#000');
	};

	var drawScoresStats = function (vis, avg, data) {

		//text
		$('.js-score-avg').html(avg);

		var margin = vis.margin;
		var dim = vis.dim;
		var svg = vis.svg;

		var x = d3.scale.ordinal().rangeBands([0, dim.w])
				.domain([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
		var xAxis = d3.svg.axis().scale(x).orient('bottom');

		var yTicks = E.getAxisTicks(_.max(data), dim.h);
		var y = d3.scale.linear().range([0, dim.h])
				.domain([yTicks.endPoint, 0]);
		var yAxis = d3.svg.axis().scale(y).orient('left')
					.tickSize(-dim.w)
					.tickPadding(E.noTicks.padding)
					.ticks(yTicks.count);

		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		_.each(data, function (val, key) {
			svg.append('rect')
				.attr('x', x(+key) + dim.w/11/4)
				.attr('y', y(val))
				.attr('width', dim.w/11/2)
				.attr('height', dim.h - y(val))
				.style('fill', E.beerColors[2]);
			svg.append('text')
				.attr('x', x(+key) + dim.w/11/2)
				.attr('y', y(val))
				.attr('dy', -4)
				.text(val)
				.attr('class', 'pos-middle size-normal')
		});
	};

	return {
		transformRatingsBar: transformRatingsBar,
		drawRatings: drawRatings,
		drawCategories: drawCategories,
		drawScoresStats: drawScoresStats
	}
});