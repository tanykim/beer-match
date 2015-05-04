define(['textures'], function (textures) {

	var colors = E.colors.ratings;
	var canvas = {};
	var checkinCount;
	var data;
	var category;

	//for bars
	var dim, margin, x, xAxis, y;
	var unitH = 20;

	//texture
	var tx;

	var transformRatingsBar = function (option) {

		var dataSort = function (option, a, b) {
			if (option === 'count') {
				return a.id - b.id;
			} else if (option === 'score') {
				return b.score - a.score;
			} else {
				if (category == 'abv') {
					var an = +a.name.slice(0, a.name.length-4);
					var bn = +b.name.slice(0, b.name.length-4);
					return an - bn;
				}
				return d3.ascending(a.name, b.name);
			}
		};

		//resort dataset
		var sorted = data.sort(function (a, b) {
				return dataSort(option, a, b);
			}).map(function (d) { return d.id; });

		//transition
		canvas.bar.selectAll('.js-ratings-bar-wrapper')
	    	.transition().duration(1000)
	        .attr('transform', function (d, i) {
	        	return 'translate(0, ' +
	        		unitH * sorted.indexOf(d.id) + ')'; });
	};

	function showTextures(d, i) {

		if (i < 10) { //for top 10
			d3.select('.js-ratings-arc-' + i).style('fill', tx.url());
			d3.select('.js-ratings-bar-' + i).style('fill', tx.url());
		}
		d3.select('.js-ratings-arc-over-name')
			.text(d.name);
		d3.select('.js-ratings-arc-over-count')
			.text('(' + d.count + ' check-ins, ' +
				Math.round(d.count / checkinCount * 1000) / 10 + '%)');
		d3.select('.js-ratings-text-' + i).style('font-weight', 700);
	}

	function hideTextures(i) {
		if (i < 10) {
			d3.select('.js-ratings-arc-' + i).style('fill', colors[category]);
			d3.select('.js-ratings-bar-' + i).style('fill', colors[category]);
		}
		$('.js-ratings-text-' + i).attr('style', '');
	}

	function showMouseOver(d, i) {
		if (i !== 0) {
			hideTextures(0);
		}
		showTextures(d, i);
	}

	function showMouseOut(d, i) {
		hideTextures(i);
		showTextures(d, 0);
	}

	var arc = function (start, count) {
		var prev = _.reduce(_.pluck(data, 'count').slice(0, start),
			function (memo, num) {
				return memo + num;
			}, 0);

		var sA = Math.PI * 2 / checkinCount * prev;
		var eA = start < 10 ?
			Math.PI * 2 / checkinCount * (prev + count):
			Math.PI * 2;
		return d3.svg.arc()
			.innerRadius(0)
	    	.outerRadius(pieR)
	    	.startAngle(sA)
	    	.endAngle(eA);
	};

	var drawCategories = function (vis, cg, cic, dt) {

		category = cg;
		checkinCount = cic;
		data = dt[category];

		var margin = vis.margin;
		var dim = { w: vis.w, h: vis.w };
		pieR = dim.w/2;
		canvas.pie = vis.draw({dim: dim, margin: margin}, 'categories');

		var xPos = dim.w/2;

		canvas.pie.append('text')
			.attr('y', 0)
			.attr('class',
				'pos-middle size-small js-ratings-arc-over');
		canvas.pie.select('.js-ratings-arc-over').append('tspan')
            .attr('x', xPos)
            .attr('dy', -15)
            .attr('class', 'js-ratings-arc-over-count');
		canvas.pie.select('.js-ratings-arc-over').append('tspan')
            .attr('x', xPos)
            .attr('dy', -20)
            .attr('class', 'weight-700 js-ratings-arc-over-name');

		canvas.pie.append('circle')
			.attr('cx', xPos)
			.attr('cy', dim.h/2)
			.attr('r', pieR)
			.attr('class', 'stroke-tick fill-none');

		_.each(_.range(11), function (i) {
			var d = data[i];
			canvas.pie.append('path')
				.attr('d', arc(i, d? d.count : 0))
				.attr('class', 'stroke-tick js-ratings-arc js-ratings-arc-' + i)
				.style('fill', i < 10 && d ? colors[category] : E.lightGrey)
				.style('opacity', i < 10 && d ? 1 - i/10 : 1)
		    	.attr('transform',
		    		'translate (' + xPos + ', ' + (dim.h/2) + ')')
		    	.on('mouseover', function() {
					if (i < 10 && d) {
						showMouseOver(d, i);
					}
				})
				.on('mouseout', function() {
					if (i < 10 && d) {
						showMouseOut(data[0], i);
					}
				});
		});
	};

	var drawRatings = function(vis, avgScore) {

		$('.js-ratings-elm').remove();
		$('.js-ratings-tooltip').remove();

		if (vis) {
			margin = vis.margin;
			dim = { w: vis.w - margin.left - margin.right, h: _.size(data) * unitH };
			canvas.bar = vis.draw({dim: dim, margin: margin}, 'ratings');
			x = d3.scale.linear().range([0, dim.w]).domain([0, 5]);
			xAxis = d3.svg.axis().scale(x).orient('top').tickSize(-dim.h)
						.tickPadding(E.noTicks.padding)
						.tickFormat(d3.format('d'));
			y = d3.scale.ordinal().rangeBands([0, dim.h])
				.domain(_.pluck(data, 'id'));
		} else {
			$('#vis-ratings').find('svg').attr('height',
				_.size(data) * unitH + margin.top + margin.bottom);
			xAxis.tickSize(_.size(data) * -unitH);

		}

		//g of each director
		canvas.bar.selectAll('.js-ratings-bar-wrapper')
				.data(data)
			.enter().append('g')
				.attr('class', function (d) {
					return 'js-ratings-elm js-ratings-bar-wrapper ' +
						'js-ratings-bar-wrapper-' + d.id;
				})
				.attr('transform', function (d, i) {
					return 'translate(0, ' + unitH * i + ')';
				});

		_.each(data, function (datum) {
			var i = datum.id;
			var director = d3.select('.js-ratings-bar-wrapper-' + i);
			director.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', x(datum.score))
				.attr('height', unitH - 2)
				.attr('class', 'js-ratings-bar-' + i)
				.style('fill', datum.id < 10 ? colors[category] : E.lightGrey)
				.style('opacity', datum.id < 10 ? (10 - datum.id) / 10 : 1)
		    	.on('mouseover', function() {
		    		showMouseOver(data[i], i);
					var yPos = $('.js-ratings-bar-wrapper-' + i)
						.attr('transform').split(',')[1];
					E.setTooltipText([datum.beers + ' distinctive beers',
						'Score: ' + datum.score],
						'ratings', dim.w,
						d3.mouse(this)[0],
						+yPos.slice(0, yPos.length-1) + unitH / 2);
				})
				.on('mouseout', function() {
					showMouseOut(data[0], i);
					$('.js-ratings-tooltip').hide();
				});
			director.append('text')
				.attr('x', -E.noTicks.padding)
				.attr('y', unitH - 4)
				.text(datum.name)
				.attr('class', 'size-small pos-end js-ratings-text-' + i);
		});
		canvas.bar.append('g')
			.attr('class', 'x axis js-ratings-elm')
			.call(xAxis);

		//label
		if (vis) {
			canvas.bar.append('path')
				.attr('d', E.drawStar(8))
				.attr('transform', 'translate( ' + (dim.w / 2 - 18) + ', ' +
					(E.noTicks.lableTop - 4)+ ')')
				.attr('class', 'fill-grey stroke-none')
			canvas.bar.append('text')
				.attr('x', dim.w / 2 + 10)
				.attr('y', E.noTicks.lableTop)
				.text('score')
				.attr('class', 'pos-middle fill-grey size-small')
		}

		//average line
		canvas.bar.append('line')
			.attr('x1', x(avgScore))
			.attr('x2', x(avgScore))
			.attr('y1', -margin.top / 2)
			.attr('y2', dim.h + margin.bottom / 2)
			.attr('class', 'stroke-1 stroke-dashed stroke-darkGrey ja-ratings-elm');

		E.drawTooltip(canvas.bar, 'ratings', 2);
		E.setTooltipText(['Score: ' + data[0].score,
			data[0].beers + ' distinctive beers'],
			'ratings', dim.w, 5, unitH/2);

		//texture
 		$('#vis-ratings').find('def').remove();
		tx = textures.lines().size(6).lighter().stroke(
				category === 'brewery' || category === 'country' ?
				'#777' : '#343434'
			).background(colors[category]);
		canvas.bar.call(tx)
		showTextures(data[0], 0);
	};

	var updateVis = function (dt, cg) {

		data = dt;
		category = cg;

		//data resort by id
		data.sort(function (a, b) { return a.id - b.id; })
			.map(function (d) { return d.id; });

		//update pie
		_.each(_.range(11), function (i) {
			d3.select('.js-ratings-arc-' + i)
				.attr('d', arc(i, data[i] ? data[i].count : 0))
				.style('fill', i < 10 && data[i] ? colors[category] : E.lightGrey)
		    	.on('mouseover', function() {
					if (i < 10 && data[i]) {
						showMouseOver(data[i], i);
					}
				})
				.on('mouseout', function() {
					if (i < 10 && data[i]) {
						showMouseOut(data[0], i);
					}
				});
		});
	}

	var drawScoresStats = function (vis, avg, data) {

		//text
		$('.js-score-avg').html(avg);

		var margin = vis.margin;
		var dim = vis.dim;
		var svg = vis.svg;

		var y = d3.scale.ordinal().rangeBands([0, dim.h])
				.domain([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
		var yAxis = d3.svg.axis().scale(y).orient('left');
		var xTicks = E.getAxisTicks(_.max(data), dim.w);
		var x = d3.scale.linear().range([0, dim.w])
				.domain([0, xTicks.endPoint]);
		var xAxis = d3.svg.axis().scale(x).orient('bottom')
				.tickSize(-dim.h)
				.tickPadding(E.noTicks.padding)
				.ticks(xTicks.count);

		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, ' + dim.h + ')')
			.call(xAxis);
		svg.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		_.each(data, function (val, key) {
			svg.append('rect')
				.attr('y', y(+key) + dim.h/11/4)
				.attr('x', 0)
				.attr('height', dim.h/11/2)
				.attr('width', x(val))
				.style('fill', E.beerColors[4]);
			svg.append('text')
				.attr('x', x(val) + 6)
				.attr('y', y(+key) + dim.h/11/2)
				.attr('dy', dim.h/11/4)
				.style('fill', E.beerColors[4])
				.text(val)
				.attr('class', 'size-tiny')
		});

		E.putAxisLable(svg, dim.w/2, dim.h + E.noTicks.lableBottom,
			'chech-ins', 'x', 'small');
		E.putAxisLable(svg, -dim.h / 2 + 4, -margin.left + 10,
			'score', 'y', 'small');
		svg.append('path')
			.attr('d', E.drawStar(8))
			.attr('transform', 'translate( ' + (-margin.left + 6) + ', ' +
				(dim.h / 2 + 24)+ ')')
			.attr('class', 'fill-grey stroke-none')
	};

	return {
		drawCategories: drawCategories,
		drawRatings: drawRatings,
		updateVis: updateVis,
		transformRatingsBar: transformRatingsBar,
		drawScoresStats: drawScoresStats
	}
});