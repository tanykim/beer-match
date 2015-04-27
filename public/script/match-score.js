define(['moment'], function (moment) {

	var colors = E.colors;

	var putScore = function (score, list) {

		$('.js-match-score').html(score);
		_.each(list, function (d, key) {
			$('.js-match-score-' + key).html(d);
		});
	};

	var drawBehavior = function (vis, behavior) {

		var margin = vis.margin;
		var dim = vis.dim;
		var svg = vis.svg;

		var lables = [
			['Heavy Drinker', 'Light Drinker'],
			['Explorer', 'Loyal Patron'],
			['Weekend', '7 Days'],
			['Drinking Out', 'Recluse'],
			['Daytime', 'After Sunset']
		];

		var y = d3.scale.linear().range([0, dim.h]).domain([1, -1]);

		_.each(behavior, function (val, i) {
			var xPos = dim.w / 5 * i + dim.w / 10;
			svg.append('line')
				.attr('x1', xPos)
				.attr('x2', xPos)
				.attr('y1', 0)
				.attr('y2', dim.h)
				.attr('class', 'stroke-1, stroke-grey')
			svg.append('text')
				.attr('x', xPos)
				.attr('y', 0 - E.noTicks.padding)
				.text(lables[i][0])
				.attr('class', 'size-normal, pos-middle');
			svg.append('text')
				.attr('x', xPos)
				.attr('y', dim.h + E.noTicks.padding)
				.attr('dy', '0.71em')
				.text(lables[i][1])
				.attr('class', 'size-normal, pos-middle');

			_.each(_.range(2), function (user) {
				svg.append('circle')
					.style('fill', E.users[user])
					.attr('cx', function (d) { return xPos; })
					.attr('cy', function (d) { return y(val[user]); })
					.attr('r', 5);
			});
		});
		svg.append('line')
			.attr('class', 'stroke-1, stroke-grey stroke-dashed')
			.attr('x1', 0)
			.attr('x2', dim.w)
			.attr('y1', dim.h/2)
			.attr('y2', dim.h/2);
	};

	var drawCount = function (vis, count) {

		var dim = vis.dim;
		var svg = vis.svg;

		var avgUnit = 'week';
		if (count[0][avgUnit] + count[1][avgUnit] < 2) {
			avgUnit = 'month';
		} else if (count[0][avgUnit] + count[1][avgUnit] > 40) {
			avgUnit = 'day';
		}
		var avgCount = _.pluck(count, avgUnit);

		var gap = 20;
		_.each(avgCount, function (d, i)  {
			var x = dim.w / 2 + (dim.h / 2 + gap / 2) * (i === 0 ? -1 : 1);
			var r =  Math.sqrt(d * (dim.h / 2) * (dim.h / 2) / _.max(avgCount));
			svg.append('circle')
				.attr('cx', x)
				.attr('cy', dim.h / 2)
				.attr('r', r)
				.style('fill', E.users[i]);
			svg.append('text')
				.attr('x', x)
				.attr('y', dim.h/2 + 8)
				.text(d)
				.attr('class', 'size-huge pos-middle');
		});
		$('.js-counts').html(avgUnit.toUpperCase());
	};

	var drawBoth = function (beersList, distinctive) {

		//FIX ME: change it to vis
		$('#vis-distinctive').html(distinctive[0] + '---' + distinctive[1]);

		var labels = ['Both you love', 'Both you hate', 'Love - Hate', 'Hate - Love'];
		_.each(_.range(4), function (i) {
			var list = beersList[i];
			// console.log(i);
			if (!_.isEmpty(list)) {
				$('.js-both-' + i).append(labels[i] + '<br/>');
				_.each(list, function (b) {
					$('.js-both-' + i).append('<img src="' + b.label + '" width="40" class="label-image">');
				});
			}
		});
	};

	return {
		putScore: putScore,
		drawBehavior: drawBehavior,
		drawCount: drawCount,
		drawBoth: drawBoth,
	};
});
