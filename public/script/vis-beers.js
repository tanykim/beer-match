define(['vis-settings'], function (Settings) {

	var colors = Settings.colors;

	function getCenterBeerPositions(key, order, baseR, margin, dim, text) {

		var positions = {
			xPos: dim.w/2,
			yPos: dim.h/2,
			dy: 0,
			textX: dim.w/2 + ( (key === 'abv' || key === 'brewery') ? -dim.h/4 : dim.h/4),
			textY: dim.h/2 + ( (key === 'abv' || key === 'style') ? -dim.h/4 : dim.h/4),
			textA: 'middle',
			nameClass: '--small'
		}
		// if (_.isNull(order)) {
		// 	console.log(positions.textX);
		// }

		if (!_.isNull(order)) {
			var dot = d3.select('.js-rating-' + key + '-' + order);
			var xPos = +dot.attr('cx');
			var yPos = +dot.attr('cy');
			
			// text position
			var dy = -baseR * 4;
			// if line goes down
			if (yPos > dim.h/2) {
				dy = baseR * 4;
			}
			// if text is too long and cut 
			var textX = xPos;
			var textA = 'middle';
			var textW = text.length * 20;
			var outOfLeft = textW / 2 - (margin.left + xPos);
			var outOfRight = textW / 2 - (margin.right + dim.w - xPos);
			if (outOfLeft > 0) {
				textX = 0;
				textA = 'start';
			} else if (outOfRight > 0) {
				textX = dim.w;
				textA = 'end';
			}
			positions = {
				xPos: xPos,
				yPos: yPos,
				dy: dy,
				textX: textX,
				textY: yPos,
				textA: textA,
				nameClass: ''
			};
		}

		return positions;

	};

	function updateCenterBeer(b, maxCount, vis) {

		var baseR = vis.r;
		var dim = vis.dim;
		var margin = vis.margin;

		$('.js-fav-name').html(b.name);
		$('.js-fav-count').html(b.count);
		$('.js-fav-times').html(b.count === 1 ? 'check-in' : 'check-ins');
		$('.js-fav-beer-img').hide().attr('href', b.label).fadeIn('fast');

		_.each(b.categories, function (d, key) {
			var p = getCenterBeerPositions(key, d.order, baseR, margin, dim, d.name);
			
			d3.select('.js-fav-beer-bg-' + key).transition()
				.attr('cx', p.xPos)
				.attr('cy', p.yPos)
				.attr('r', Math.sqrt(d.count/ maxCount[key]) * (margin.oR + margin.top));
			d3.select('.js-fav-beer-line-' + key).transition()
				.attr('x2', p.xPos).attr('y2', p.yPos);
			d3.select('.js-fav-beer-bg-center-' + key).transition()
				.attr('cx', p.xPos)
				.attr('cy', p.yPos);
			d3.select('.js-fav-beer-text-' + key).text('').transition()
				.attr('x', p.textX).attr('y', p.textY).attr('dy', p.dy)
				.attr('text-anchor', p.textA)
				.text(d.name)
				.attr('class', 'fav-beer-text' + (p.nameClass) + ' js-fav-beer-text-' + key);
			d3.select('.js-fav-beer-text-count-' + key).text('').transition()
				.attr('x', p.xPos).attr('y', p.textY).attr('dy', p.dy + 14)
				.text(d.count === 0 ? '' : d.count + ' check-ins');
		});
	}

	var drawCenterBeer = function (vis, b, maxCount) {

		var svg = vis.svg;
		var dim = vis.dim;
		var margin = vis.margin;
		var baseR = vis.r;

		//bg Radius, link line & name
		_.each(b.categories, function (d, key) {
			svg.append('line')
				.attr('x1', dim.w/2)
				.attr('x2', dim.w/2)
				.attr('y1', dim.h/2)
				.attr('y2', dim.h/2)
				.attr('class', 'fav-beer-line js-fav-beer-line-' + key);
			svg.append('circle')
				.attr('cx', dim.w/2)
				.attr('cy', dim.h/2)
				.attr('r', baseR)
				.attr('fill', '#000')
				.attr('opacity', 1)
				.attr('class', 'js-fav-beer-bg-center-' + key);
			svg.append('text')
				.attr('x', dim.w/2)
				.attr('y', dim.h/2)
				.attr('dy', 0)
				.text('')
				.attr('text-anchor', 'middle')
				.attr('class', 'fav-beer-text js-fav-beer-text-' + key);
			svg.append('text')
				.attr('x', dim.w/2)
				.attr('y', dim.h/2)
				.attr('dy', 0)
				.text('')
				.attr('text-anchor', 'middle')
				.attr('class', 'fav-beer-text-count js-fav-beer-text-count-' + key);
		});

		//image background
		svg.append('defs')
	     	.append('pattern')
		        .attr('id', 'beer-label')
		        .attr('viewBox', '0 0 ' + margin.iR + ' ' + margin.iR)
		        .attr('width', '100%')
		        .attr('height', '100%')
	    	.append('image')
		        .attr('xlink:href', '')
		        .attr('preserveAspectRatio', 'xMidYMid slice')
		       	.attr('width', margin.iR)
		        .attr('height', margin.iR)
		        .attr('class', 'js-fav-beer-img');
		svg.append('circle')
			.attr('cx', dim.w/2)
			.attr('cy', dim.h/2)
			.attr('r', margin.iR)
			.attr('fill', 'url(#beer-label)')
			.attr('class', 'fav-beer-img js-fav-beer-img');

		updateCenterBeer(b, maxCount, vis);
	};

	var drawFavoritesCenter = function (ratings) {

		// Math.floor($('.favorites-beer').width())

		var margin = { top: 0, right: 20, bottom: 0, left: 20, oR: 20 , iR: 40};
		var dim = { w: $('.favorites-beer').width(),
					h: _.max([$(window).height()-60-margin.top-margin.bottom-margin.oR, 500])};
		// dim.w = dim.h;
		var maxR = dim.h / 2;

		var svg = d3.select('#vis-favorites').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('translate', 'translate(' + margin.left + ', ' + margin.top + ')');

		//vertical and horitontal lines
		svg.append('line')
			.attr('x1', dim.w/2 - maxR)
			.attr('x2', dim.w/2 + maxR)
			.attr('y1', dim.h/2)
			.attr('y2', dim.h/2)
			.attr('class', 'fav-divide');
		svg.append('line')
			.attr('x1', dim.w/2)
			.attr('x2', dim.w/2)
			.attr('y1', 0)
			.attr('y2', dim.h)
			.attr('class', 'fav-divide');

		//radials
		var gapBase = (maxR - margin.oR - margin.iR) / 11;
		_.each(_.range(11), function (i) {
			svg.append('circle')
				.attr('cx', dim.w/2)
				.attr('cy', dim.h/2)
				.attr('r', margin.iR + gapBase * (i + 1))
				.attr('class', 'fav-radial-' + (i % 2));
			var score = i/2;
			svg.append('text')
				.attr('x', dim.w/2)
				.attr('y', (maxR - margin.iR) - gapBase * (i + 1))
				.attr('text-anchor', 'middle')
				.text(score)
				.attr('class', 'fav-score-text');
		});

		//draw circles
		//10 degrees
		var angleMargin = Math.PI/36;
		var baseAngle = Math.PI/2 - angleMargin * 2;
		var r = 6;
		var i = 0;

		_.each(ratings, function (data, key) {
			//draw center beer big circle
			svg.append('circle')
				.attr('cx', dim.w/2)
				.attr('cy', dim.w/2)
				.attr('r', 0)
				.attr('fill', colors[key])
				.attr('opacity', 0.5)
				.attr('class', 'js-fav-beer-bg-' + key);
			//draw dot
			_.each(data, function (d) {
				var distance = gapBase * (d.rating * 2 + 1) + margin.iR;
				var angle = angleMargin + baseAngle / _.size(data) * d.order.count + Math.PI/2 * (i + 1);
				// var angle = angleMargin + baseAngle / maxVal * d.count + Math.PI/2 * (i + 1);		
				var xPos = distance * Math.sin(angle);
				var yPos = distance * Math.cos(angle);
				svg.append('circle')
					.attr('cx', xPos + dim.w/2)
					.attr('cy', yPos + dim.h/2)
					.attr('r', r)
					.attr('fill', colors[key])
					.attr('opacity', 0.3)
					.attr('class', 'js-rating-dot js-rating-' + key + '-' + d.order.count)
					.on('mouseover', function() {
						// $(this).css('cursor', 'pointer');
						d3.select(this).attr('opacity', 1);
						svg.append('text')
							.attr('x', xPos + dim.w/2)
							.attr('y', yPos + dim.h/2 - 10)
							.text(d.name + ' (' + d.count + ')')
							.attr('fill', colors[key])
							.attr('class', 'fav-beer-dot-text js-fav-beer-dot-text');
						// console.log(d.rating, d.name, d.count);
					})
					.on('mouseout', function() {
						d3.select(this).attr('opacity', 0.3);
						$('.js-fav-beer-dot-text').remove();
					});
			});
			//draw center beer
			i = i + 1;
		});

		return {
			svg: svg,
			dim: dim,
			margin: margin,
			r: r
		};
	};

	var putFavorites = function (beerList, ratings, maxCount, vis) {

		function addBeer(beer, key, i, j) {
			// console.log(beer, key, i, j);
			$('.js-fav-' + key + '-list').find('span').last()
				.append('<img src="' + beer.label + '" width="40"' + 
					'class="label-image link js-fav-beer-' + key + '-' + i + '-' + j +'">');
			$('.js-fav-beer-' + key + '-' + i + '-' + j).click(function() {
				$('.label-image').removeClass('label-image--selected');
				$(this).addClass('label-image--selected');
				var b = beerList[key][i].list[j];
				// console.log(b, maxCount, vis);
				updateCenterBeer(b, maxCount, vis);
				// $('.js-fav-detail').html(b.name + ' (drank ' + b.count + ' times)');
				// $('.js-fav-center-img').attr('href', beer.label);
			});
		}
		_.each(beerList, function (sort, key) {
			_.each(sort, function (list, i) {
				$('.js-fav-' + key + '-list').append('<span>' + list.title + ': </span>');
				_.each(list.list, function (beer, j) {
					addBeer(beer, key, i, j);
				});
			});
		});
	};


	return {
		drawFavoritesCenter: drawFavoritesCenter,
		drawCenterBeer: drawCenterBeer,
		putFavorites: putFavorites
	}
});