define(['vis-settings'], function (Settings) {

	var colors = Settings.colors;

	var transformRatingsBar = function (list, baseH) {	
		var sortBy = $('input[name=sortBy]:checked').val();
		_.each(list, function (d, i) {
			d3.selectAll('.js-ratings-bar-' + i).attr('y', d.order[sortBy] * baseH);
			d3.selectAll('.js-ratings-bar-' + i).attr('height', baseH - 2);
			d3.selectAll('.js-ratings-text-' + i).attr('dy', baseH / 2);
		});	
	};

	var drawRatingsBar = function(v, list, key, avgScore) {

		var svg = v.svg;
		var x = v.x;
		var margin = v.margin;
		var baseH = v.baseH;

		$('.js-ratings-elm').remove();
		
		var height = _.size(list) * baseH;
	 	$('#vis-ratings').find('svg').attr('height', height + margin.top + margin.bottom)

	 	var sortBy = $('input[name=sortBy]:checked').val();

		_.each(list, function (d, i) {
			var yPos = d.order[sortBy] * baseH;
			var fill = '#efefef';
			var fillOpacity = 1;
			if ( d.order.count < 10 ) {
				fill = colors[key];
				fillOpacity = (10 - d.order.count)/10;
			}
			svg.append('rect')
				.attr('x', 0)
				.attr('y', yPos)
				.attr('width', x(d.rating))
				.attr('height', baseH - 2)
				.attr('fill', fill)
				.attr('fill-opacity', fillOpacity)
				.attr('stroke', '#efeff')
				.attr('class', 'js-ratings-elm js-ratings-bar-' + i)
				.on('mouseover', function () {
					// console.log(d.name, d.count, d.rating, d.beers);
				});
			svg.append('text')
				.attr('x', -10)
				.attr('y', yPos)
				.attr('dy', baseH / 2)
				.text(d.name)
				.attr('text-anchor', 'end')
				.attr('class', 'js-ratings-elm js-ratings-text-' + i + ' js-ratings-bar-' + i);
		});

		var xAxis = d3.svg.axis().scale(x).orient('top').tickSize(-height);
		svg.append('g')
			.attr('class', 'x axis js-ratings-axis js-ratings-elm')
			.call(xAxis);
		svg.append('line')
			.attr('x1', x(avgScore))
			.attr('x2', x(avgScore))
			.attr('y1', -margin.top)
			.attr('y2', height)
			.attr('class', 'ratings-avg js-ratings-avg');
	};

	var drawRatings = function(ratings, avgScore) {

		var baseH = 20;

		var margin = { top: 30, right: 40, bottom: 20, left: 300 };
		var dim = { w: $('.ratings').width() - margin.left - margin.right,
					h: 100 };
		var x = d3.scale.linear().range([0, dim.w]).domain([0, 5]);

		var svg = d3.select('#vis-ratings').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		
		return {
			svg: svg,
			dim: dim,
			margin: margin,
			x: x,
			baseH: baseH
		};
	};

	var drawCategories = function (checkinCount, ratings) {

		var margin = { top: 40, right: 30, bottom: 60, left: 30, r: 20 };
		var dim = { w: Math.floor($('.categories').width()),
					h: null};
		var r = Math.min(dim.w/4/2, 80);
		dim.h = r * 2;

		var svg = d3.select('#vis-categories').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('translate', 'translate(' + margin.left + ', ' + margin.top + ')');

		svg.append('path')
			.attr('d', 'M 0 0 h ' + (r * 2 + margin.r * 2) + ' v ' + (r * 2 + margin.bottom/2 + margin.top) +
				' h ' + (-r) +
				' l ' + (-margin.r) + ', ' + (margin.bottom/2) +
				' l ' + (-margin.r) + ', ' + (-margin.bottom/2) +
				' h ' + (-r) +
				' v ' + (-r * 2 - margin.top)
				)
			.attr('fill', '#efefef')
			.attr('class', 'js-ratings-bg')
			.attr('transform', 'translate (' + ((0 * dim.w/4) + dim.w/8 - r - margin.r) + ',0)');

		var arc = function (start, count) {
			var sA = Math.PI * 2 / checkinCount * start;
			var eA = Math.PI * 2 / checkinCount * (start + count);
			return d3.svg.arc()
				.innerRadius(0)
		    	.outerRadius(r)
		    	.startAngle(sA)
		    	.endAngle(eA);
		};

		var i = 0;
		_.each(ratings, function (data, key) {
			var xPos = i * dim.w/4 + dim.w/8;
			svg.append('text')
				.attr('x', xPos)
				.attr('y', margin.top)
				.attr('dy', -15)
				.attr('data-value', key)
				.attr('data-id', i)
				.text(key.toUpperCase())
				.attr('text-anchor', 'middle')
				.attr('class', 'js-ratings-title');
			svg.append('text')
				.attr('x', xPos)
				.attr('y', margin.top)
				.attr('class', 'ratings-arc-over js-ratings-arc-over-' + i);
			_.each(data, function(d) {
				svg.append('path')
					.attr('d', arc(d.accCount.count, d.count, i))
					.attr('data-id', i)
					.attr('fill', colors[key])
					.attr('stroke', '#000')
					.attr('stroke-width', 1)
					.attr('opacity', 1 - d.order.count/10)
			    	.attr('transform', 'translate (' + xPos + ', ' + (dim.h/2 + margin.top) + ')')
			    	.on('mouseover', function() {
			    		d3.select('.js-ratings-arc-over-' + $(this).data().id).text(d.name + '(' + d.count + ')')
					})
					.on('mouseout', function() {
			    		d3.select('.js-ratings-arc-over-' + $(this).data().id).text('');
					});
			});
			svg.append('circle')
				.attr('cx', xPos)
				.attr('cy', dim.h/2 + margin.top)
				.attr('r', r)
				.attr('fill', 'none')
				.attr('stroke', '#000');
			i = i + 1;
		});

		return {
			dim: dim,
			margin: margin,
			r: r
		}
	};

	var drawScoresStats = function (avg, data) {

		$('.js-score-avg').html(avg);

		var margin = { top: 10, right: 40, bottom: 20, left: 40 };
		var dim = { w: $('.score').width() - margin.left - margin.right,
					h: 100 };
		var x = d3.scale.ordinal().rangeBands([0, dim.w])
				.domain([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
		var xAxis = d3.svg.axis().scale(x).orient('bottom').tickSize(-dim.h);
		var y = d3.scale.linear().range([0, dim.h])
				.domain([Math.ceil(_.max(_.values(data)) / 10) * 10, 0]);
		var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-dim.w);

		var svg = d3.select('#vis-score').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		
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
				.attr('width', 50)
				.attr('height', dim.h - y(val));
		});
	};

	var drawNetwork = function (data) {

		var width = 500;
		var height = 500;

		var color = d3.scale.category20();

		var force = d3.layout.force()
		    .charge(-120)
		    .linkDistance(2)
		    .size([width, height]);

		var svg = d3.select('#vis-network').append('svg')
		    .attr('width', width)
		    .attr('height', height);

		force
		    .nodes(data.nodes)
		    .links(data.links)
		    .start();

		var link = svg.selectAll('.link')
		    .data(data.links)
		  .enter().append('line')
		    .attr('class', 'link')
		    .style('stroke-width', function(d) { return Math.sqrt(d.value); });

		var node = svg.selectAll('.node')
			.data(data.nodes)
	      .enter().append('circle')
			.attr('class', 'node')
			.attr('r', 5)
			.style('fill', function(d) { return Settings.colors[d.group]; })
			.call(force.drag);

		node.append('title')
		  .text(function(d) { return d.name; });

		force.on('tick', function() {
		link.attr('x1', function(d) { return d.source.x; })
		    .attr('y1', function(d) { return d.source.y; })
		    .attr('x2', function(d) { return d.target.x; })
		    .attr('y2', function(d) { return d.target.y; });

		node.attr('cx', function(d) { return d.x; })
		    .attr('cy', function(d) { return d.y; });
		});

	};

	return {
		transformRatingsBar: transformRatingsBar,
		drawRatingsBar: drawRatingsBar,
		drawRatings: drawRatings,
		drawCategories: drawCategories,
		drawScoresStats: drawScoresStats,
		drawNetwork: drawNetwork
	}
});