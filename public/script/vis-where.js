define(['vis-settings'], function (Settings) {

	var colors = Settings.colors;
	var map;
	var marker;

	var createHeatmap = function (data) {
		// console.log('----put heatmap');
		nokia.Settings.set('app_id', 'FBBffQYZooVO6yztAvLN'); 
		nokia.Settings.set('app_code', 'Mj6QTZA1rzKGzjs_KWpmzA');
		var mapContainer = document.getElementById('vis-venue-map');
		var center = [+data[0].latitude, +data[0].longitude];
		map = new nokia.maps.map.Display(mapContainer, {
			center: center,
			zoomLevel: 14,
			components: [
				new nokia.maps.map.component.Behavior()
			]
		});
		// marker = new nokia.maps.map.Marker(center);
		var heatmapProvider;
		var colorizeAPI = {
			stops: {
				'0': '#E8680C',
				'0.25': '#F5A400',
				'0.5': '#FF9000',
				'0.75': '#FF4600',
				'1': '#F51F00'
			},
			interpolate: true
		};
		try {
			heatmapProvider = new nokia.maps.heatmap.Overlay({
				// colors: colorizeAPI,
				max: 20,
				opacity: 1,
				type: 'density',
				coarseness: 2
			});
		} catch (e) {
			alert(typeof e == 'string' ? e : e.message);
		}
		if (heatmapProvider) {
			map.addListener('displayready', function () {
				heatmapProvider.addData(data);
				map.overlays.add(heatmapProvider);
			}, false);
		}
	};

	function addMarker(id, num) {
		console.log(num);
		map.set('center', [id.lat, id.lng]);
		map.objects.remove(marker);
		map.update(-1, 0);
		marker = new nokia.maps.map.StandardMarker([id.lat, id.lng],
				{
				text: '#' + (num + 1),
				textPen: {
					strokeColor: "#333"
				},
				brush: {
					color: "#FFF"
				},
				pen: {
					strokeColor: "#333"
				}
			});
		map.objects.add(marker);
	}

	function updateVis(d, i) {
		$('.js-venue-title-name').html(d.name);
		$('.js-venue-title-score').html(d.score);
		$('.js-venue-title-type').html(d.type);
		$('.js-venue-title-city').html(d.city);
		$('.js-venue-bar').attr('fill', '#000');
		$('.js-venue-bar-' + i).attr('fill', '#999');
	}
	//put venue
	function drawVenueNames(data, w) {

		var unitH = 50;

		var margin = { top: 20, right: 30, bottom: 0, left: 20 };
		var dim = { w: w - margin.left - margin.right,
					h:  unitH * data.length };
		var maxCount = _.max(_.pluck(data, 'count'));
		var x = d3.scale.linear().range([0, dim.w]).domain([0, maxCount])
		var xAxis = d3.svg.axis().scale(x).orient('top').tickSize(-dim.h).ticks(2);

		var svg = d3.select('#vis-venue-name').append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		svg.append('g')
			.attr('class', 'x axis')
			.call(xAxis);

		_.each(data, function (d, i) {
			var y = i * unitH + 30;
			svg.append('text')
				.attr('x', 0)
				.attr('y', y - 5)
				.text(d.name)
				.attr('font-size', '12px');
			svg.append('rect')
				.attr('x', 0)
				.attr('y', y)
				.attr('data-type', d.typeId)
				.attr('data-city', d.cityId)
				.attr('data-value', d.count)
				.attr('data-id', i)
				.attr('width', x(d.count))
				.attr('height', 20)
				.attr('class', 'js-venue-bar js-venue-bar-' + i);
			svg.append('text')
				.attr('x', x(d.count) + 2)
				.attr('y', y + 14)
				.text(d.count)
				.attr('font-size', '12px');
		});

		updateVis(data[0], 0);
		addMarker(data[0], 0);
	}

	function drawVenueDetail(sort, data, w) {

		var unitH = 30;

		var margin = { top: 20, right: 30, bottom: 0, left: 100 };
		var dim = { w: w - margin.left - margin.right,
					h:  unitH * _.size(data) };
		var maxCount = _.max(_.pluck(data, 'count'));
		var x = d3.scale.linear().range([0, dim.w]).domain([0, maxCount])
		var xAxis = d3.svg.axis().scale(x).orient('top').tickSize(-dim.h).ticks(2);

		var svg = d3.select('#vis-venue-' + sort).append('svg')
			.attr('width', dim.w + margin.left + margin.right)
			.attr('height', dim.h + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
		svg.append('g')
			.attr('class', 'x axis')
			.call(xAxis);

		var count = 0;
		_.each(data, function (d, key) {
			var y = count * unitH;
			svg.append('text')
				.attr('x', 0)
				.attr('y', y + 12)
				.text(key)
				.attr('text-anchor', 'end')
				.attr('font-size', '12px');
			svg.append('rect')
				.attr('x', 0)
				.attr('y', y)
				.attr('width', x(d.count))
				.attr('height', 20)
				.attr('class', 'js-venue-' + sort + ' js-venue-' + sort + count);
			svg.append('text')
				.attr('x', x(d.count) + 2)
				.attr('y', y + 14)
				.text(d.count)
				.attr('font-size', '12px');
			svg.append('rect')
				.attr('x', 0)
				.attr('y', y)
				.attr('width', 0)
				.attr('height', 20)
				.attr('fill', '#999')
				.attr('class', 'js-venue-bar-over js-venue-' + sort + '-' + count);	
			count = count + 1;
		});

		return x;
	}

	var putVenues = function (data, w1, w2, w3) {
		drawVenueNames(data.name, w1);
		var tX = drawVenueDetail('type', data.type, w2);
		var cX = drawVenueDetail('city', data.city, w3);

		$('.js-venue-bar').click(function() {
			var id = +$(this).data().id;
			updateVis(data.name[id], id);
			addMarker(data.name[id], id);

			var typeId = $(this).data().type;
			var cityId = $(this).data().city;
			var val = $(this).data().value;
			var typeW = tX(val);
			var cityW = cX(val);
			d3.selectAll('.js-venue-bar-over').attr('width', 0);
			d3.select('.js-venue-type-' + typeId).transition().attr('width', typeW);
			d3.select('.js-venue-city-' + cityId).transition().attr('width', cityW);

		});

	};

	return {
		putVenues: putVenues,
		createHeatmap: createHeatmap
	}
});