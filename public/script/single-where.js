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
                    h: unitH * data.length };
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

    function drawBubbles(data, sort, dim, maxR, unitH, maxRVal, svg, links) {

        var angle = sort === 'city' ? 30 : -30;
        var anchor = sort === 'city' ? 'end' : 'start';
        var xPos = sort === 'city' ? maxR : dim.w - maxR;

        svg.selectAll('.js-connection-circle-' + sort)
            .data(data)
            .enter().append('circle')
            .attr('cx', xPos)
            .attr('cy', function (d, i) {
                return maxR + unitH * i;
            })
            .attr('r', function (d) {
                return Math.sqrt(maxR * maxR * d.count / maxRVal); })
            .style('fill', Settings.arr[0])
            .style('opacity', 0.5)
            .attr('class', function (d, i) {
                return 'js-connection-category js-connection-circle-' + sort + ' js-connection-circle-' + sort + '-' + i;
            })
            .on('mouseover', function (d, i) {

                d3.selectAll('.js-connection-category').style('opacity', 0.1);

                $(this).css('cursor', 'pointer');
                d3.select(this).style('opacity', 1);
                d3.select('.js-connection-text-' + sort + '-' + i).style('opacity', 1);

                _.map(links[sort][d.name], function (link) {
                    d3.select('.js-connection-line-city-' + link).style('opacity', 1);
                    d3.select('.js-connection-venue-' + link).style('fill', Settings.arr[0]);
                    d3.select('.js-connection-count-' + link).style('fill', '#000');
                });
            })
            .on('mouseout', function (d, i) {
                d3.selectAll('.js-connection-category').style('opacity', 0.5);
                d3.selectAll('.js-connection-venue').style('fill', '#000');
                d3.selectAll('.js-connection-count').style('fill', '#fff');
            });

        _.each(data, function (d, i) {
            svg.append('circle')
                .attr('cx', xPos)
                .attr('cy', maxR + unitH * i)
                .attr('r', 0)
                .style('fill', '#000')
                .style('opacity', 0.5)
                .attr('class', 'js-connection-' + sort + '-' + i);
            svg.append('circle')
                .attr('cx', xPos)
                .attr('cy', maxR + unitH * i)
                .attr('r', 2)
                .style('fill', '#000');
            svg.append('text')
                .attr('x', xPos)
                .attr('y', maxR + unitH * i)
                .text(d.name)
                .style('text-anchor', anchor)
                .style('font-size', '0.8em')
                .style('opacity', 0.5)
                .attr('transform', 'rotate(' + angle + ', ' + xPos + ', ' + (i * unitH + maxR - 14) + ')')
                .attr('class', 'js-connection-category js-connection-text-' + sort + '-' + i);
        });
    }

    function getLinkedId(data, name) {
        var id = '';
        _.each(data, function (d, i) {
            if (d.name === name) {
                id = i;
            }
        });
        return id;
    }

    var drawVenueConnection = function (data) {

        var unitH = 50;

        var margin = { top: 20, right: 200, bottom: 0, left: 200 };
        var dim = { w: $('.venue-connection').width() - margin.left - margin.right,
                    h: unitH * 11 };
        var svg = d3.select('#vis-venue-connection').append('svg')
            .attr('width', dim.w + margin.left + margin.right)
            .attr('height', dim.h + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        var maxR = unitH;
        var maxRVal = _.max(_.union(_.pluck(data.city, 'count'), _.pluck(data.type, 'count')));

        //name
        var x = d3.scale.linear().range([0, dim.w / 2]).domain([0, _.max(_.pluck(data.name, 'count'))])
        var links = { city: {}, type: {} };

        drawBubbles(data.city, 'city', dim, maxR, unitH, maxRVal, svg, links);
        drawBubbles(data.type, 'type', dim, maxR, unitH, maxRVal, svg, links);

        svg.selectAll('.js-connection-venue')
            .data(data.name)
            .enter().append('rect')
            .attr('x', function (d) { return dim.w / 2 - x(d.count) / 2; })
            .attr('y', function (d, i) { return maxR + i * unitH - 10; })
            .attr('width', function (d) { return x(d.count); })
            .attr('height', 20)
            .style('fill', '#000')
            .attr('class', function (d, i) { return 'js-connection-venue js-connection-venue-' + i; })
            .on('mouseover', function (d, i) {

                //bar
                $(this).css('cursor', 'pointer');
                d3.select(this).style('fill', Settings.arr[0]);
                d3.select('.js-connection-count-' + i).style('fill', '#000');

                //all
                d3.selectAll('.js-connection-category').style('opacity', 0.1);

                //circles
                var cityId = getLinkedId('city', d.city);
                var typeId = getLinkedId('type', d.type);

                d3.select('.js-connection-circle-city-' + cityId).style('opacity', 1);
                d3.select('.js-connection-circle-type-' + typeId).style('opacity', 1);
                d3.selectAll('.js-connection-city-' + cityId).transition()
                    .attr('r', Math.sqrt(maxR * maxR * d.count / maxRVal));
                d3.selectAll('.js-connection-type-' + typeId).transition()
                    .attr('r', Math.sqrt(maxR * maxR * d.count / maxRVal));

                //text
                d3.select('.js-connection-text-city-' + cityId).style('opacity', 1);
                d3.select('.js-connection-text-type-' + typeId).style('opacity', 1);

                //line
                d3.selectAll('.js-connection-line-' + i).style('opacity', 1);
            }).on('mouseout', function (d, i) {

                //bar
                d3.select(this).style('fill', '#000');
                d3.select('.js-connection-count-' + i).style('fill', '#fff');

                //circles
                var cityId = getLinkedId('city', d.city);
                var typeId = getLinkedId('type', d.type);

                //circle
                d3.selectAll('.js-connection-city-' + cityId).transition()
                    .attr('r', 0);
                d3.selectAll('.js-connection-type-' + typeId).transition()
                    .attr('r', 0);

                //all -- circles, lines, text
                d3.selectAll('.js-connection-category').style('opacity', 0.5);
            });


        _.each(data.name, function (d, i) {
            svg.append('text')
                .attr('x', dim.w / 2)
                .attr('y', maxR + i * unitH - 14)
                .text(d.name)
                .style('text-anchor', 'middle')
            svg.append('text')
                .attr('x', dim.w / 2)
                .attr('y', maxR + i * unitH + 6)
                .text(d.count)
                .style('text-anchor', 'middle')
                .style('fill', '#fff')
                .attr('class', 'js-connection-count js-connection-count-' + i)
            if (d.city) {
                if (links.city[d.city]) {
                    links.city[d.city].push(i);
                } else {
                    links.city[d.city] = [i];
                }
                var linkedId = getLinkedId(data.city, d.city);
                svg.append('line')
                    .attr('x1', dim.w / 2 - x(d.count) / 2)
                    .attr('y1', maxR + i * unitH)
                    .attr('x2', 0 + maxR)
                    .attr('y2', linkedId * unitH + maxR)
                    .style('stroke', '#999')
                    .style('opacity', 0.5)
                    .attr('class', 'js-connection-category js-connection-line-' + i + ' js-connection-line-city-' + i);
            }
            if (d.type) {
                if (links.type[d.type]) {
                    links.type[d.type].push(i);
                } else {
                    links.type[d.type] = [i];
                }
                var linkedId = getLinkedId(data.type, d.type);
                svg.append('line')
                    .attr('x1', dim.w / 2 + x(d.count) / 2)
                    .attr('y1', maxR + i * unitH)
                    .attr('x2', dim.w - maxR)
                    .attr('y2', linkedId * unitH + maxR)
                    .style('stroke', '#999')
                    .style('opacity', 0.5)
                    .attr('class', 'js-connection-category js-connection-line-' + i + ' js-connection-line-type-' + i);
            }
        });
    };

    return {
        putVenues: putVenues,
        createHeatmap: createHeatmap,
        drawVenueConnection: drawVenueConnection
    }
});