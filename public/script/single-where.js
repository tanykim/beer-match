define(function () {

    var colors = {
        circle: E.beerColors[0],
        bar : {
            normal: '#000',
            hover: '#999'
        },
        text: {
            normal: '#fff',
            hover: '#000'
        }
    }

    var map, marker,
        infoBubbles = new nokia.maps.map.component.InfoBubbles();

    var unitH, dim, svg, maxR, maxRVal;

    var createHeatmap = function (data) {

        //FIXME: get credentials
        nokia.Settings.set('app_id', 'FBBffQYZooVO6yztAvLN');
        nokia.Settings.set('app_code', 'Mj6QTZA1rzKGzjs_KWpmzA');
        var mapContainer = document.getElementById('vis-map');
        var center = [+data[0].latitude, +data[0].longitude];
        map = new nokia.maps.map.Display(mapContainer, {
            center: center,
            zoomLevel: 14,
            components: [
                infoBubbles,
                new nokia.maps.map.component.Behavior(),
                new nokia.maps.map.component.ZoomBar()
            ]
        });
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

    function addMarker(data, num) {
        var center = [data.lat, data.lng];
        map.set('center', center);
        map.objects.remove(marker);
        marker = new nokia.maps.map.StandardMarker(center,
            {
            text: '#' + (num + 1),
            textPen: {
                strokeColor: "#000"
            },
            brush: {
                color: colors.circle
            },
            pen: {
                strokeColor: "#000"
            }
        });
        map.objects.add(marker);
        infoBubbles.openBubble(data.name + '<br/><span class="desc">' + data.type + ' | ' + data.city + '</span>', center);
        map.update(-1, 0);

    }

    function drawBubbles(data, sort) {

        var angle = sort === 'type' ? 30 : -30;
        var anchor = sort === 'type' ? 'end' : 'start';
        var xPos = sort === 'type' ? maxR : dim.w - maxR;

        //bubbles
        svg.selectAll('.js-where-' + sort)
            .data(data)
            .enter().append('circle')
            .attr('cx', xPos)
            .attr('cy', function (d, i) {
                return maxR + unitH * i;
            })
            .attr('r', function (d) {
                return Math.sqrt(maxR * maxR * d.count / maxRVal); })
            .style('fill', colors.circle)
            .style('opacity', 0.5)
            .attr('class', function (d, i) {
                return 'js-where-elm js-where-' + sort +
                    ' js-where-' + sort + '-' + i;
            })
            .on('mouseover', function (d, i) {

                //opacity change
                d3.selectAll('.js-where-elm').style('opacity', 0.1);
                d3.select(this).style('opacity', 1);
                d3.select('.js-where-text-' + sort + '-' + i).style('opacity', 1);

                //highlight name link
                _.map(d.venueIds, function (id) {
                    d3.select('.js-where-line-' + sort + '-' + id).style('opacity', 1);
                    d3.select('.js-where-bar-' + id).style('fill', colors.circle);
                    d3.select('.js-where-count-' + id).style('fill', colors.text.hover);
                });
            })
            .on('mouseout', function (d, i) {
                d3.selectAll('.js-where-elm').style('opacity', 0.5);
                d3.selectAll('.js-where-bar').style('fill', colors.bar.normal);
                d3.selectAll('.js-where-count').style('fill', colors.text.normal);
            });

        _.each(data, function (d, i) {

            //highlighted bubble when mouseover on a bar
            svg.append('circle')
                .attr('cx', xPos)
                .attr('cy', maxR + unitH * i)
                .attr('r', 0)
                .style('fill', '#000')
                .style('opacity', 0.5)
                .attr('class', 'js-where-linked-' + sort + '-' + i);

            //center black dot
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
                .attr('class', 'js-where-elm js-where-text-' + sort + '-' + i);
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

    function highlightLinks(city, type, count, id) {

        //circles
        d3.select('.js-where-city-' + city).style('opacity', 1);
        d3.select('.js-where-type-' + type).style('opacity', 1);
        d3.select('.js-where-linked-city-' + city).transition()
            .attr('r', Math.sqrt(maxR * maxR * count / maxRVal));
        d3.select('.js-where-linked-type-' + type).transition()
            .attr('r', Math.sqrt(maxR * maxR * count / maxRVal));

        //text
        d3.select('.js-where-text-city-' + city).style('opacity', 1);
        d3.select('.js-where-text-type-' + type).style('opacity', 1);

        //line
        d3.selectAll('.js-where-line-' + id).style('opacity', 1);
    }

    var drawVenueConnection = function (data, vis) {

        unitH = 50;
        var margin = vis.margin;
        dim = { w: vis.w - margin.left - margin.right, h: unitH * 11 };
        svg = vis.draw({ dim: dim, margin: margin }, 'where');
        maxR = unitH;
        maxRVal = _.max(_.union(_.pluck(data.city, 'count'), _.pluck(data.type, 'count')));

        //draw city and type
        drawBubbles(data.type, 'type');
        drawBubbles(data.city, 'city');

        var x = d3.scale.linear().range([0, dim.w / 2]).domain([0, _.max(_.pluck(data.name, 'count'))])

        //name bars
        svg.selectAll('.js-where-bar')
            .data(data.name)
            .enter().append('rect')
            .attr('x', function (d) { return dim.w / 2 - x(d.count) / 2; })
            .attr('y', function (d, i) { return maxR + i * unitH - 10; })
            .attr('width', function (d) { return x(d.count); })
            .attr('height', 20)
            .style('fill', colors.bar.normal)
            .attr('data-city', function (d) {
                return getLinkedId(data.city, d.city);
            })
            .attr('data-type', function (d) {
                return getLinkedId(data.type, d.type);
            })
            .attr('class', function (d) { return 'link js-where-bar js-where-bar-' + d.id; })
            .on('mouseover', function (d) {

                //bar
                d3.select(this).style('fill', colors.bar.hover);
                d3.select('.js-where-count-' + d.id).style('fill', colors.bar.normal);

                //all circles
                d3.selectAll('.js-where-elm').style('opacity', 0.1);

                highlightLinks($(this).data().city, $(this).data().type, d.count, d.id);
            })
            .on('click', function (d, i) {
                addMarker(d, i);
            })
            .on('mouseout', function (d) {

                //bar
                d3.select(this).style('fill', colors.bar.normal);
                d3.select('.js-where-count-' + d.id).style('fill', '#fff');

                //all -- circles, lines, text
                d3.selectAll('.js-where-elm').style('opacity', 0.5);

                //circles
                d3.select('.js-where-linked-city-' + $(this).data().city).transition().attr('r', 0);
                d3.select('.js-where-linked-type-' + $(this).data().type).transition() .attr('r', 0);

            });

        //text
        _.each(data.name, function (d, i) {
            svg.append('text')
                .attr('x', dim.w / 2)
                .attr('y', maxR + i * unitH - 14)
                .text(d.name)
                .attr('class', 'pos-middle size-normal');
            svg.append('text')
                .attr('x', dim.w / 2)
                .attr('y', maxR + i * unitH + 6)
                .text(d.count)
                .style('fill', colors.text.normal)
                .attr('class', 'size-normal pos-middle unselectable js-where-count js-where-count-' + d.id);
            if (d.type) {
                svg.append('line')
                    .attr('x1', dim.w / 2 - x(d.count) / 2)
                    .attr('y1', maxR + i * unitH)
                    .attr('x2', maxR)
                    .attr('y2', getLinkedId(data.type, d.type) * unitH + maxR)
                    .style('opacity', 0.5)
                    .attr('class', 'stroke-grey js-where-elm js-where-line-' + d.id + ' js-where-line-type-' + d.id);
            }
            if (d.city) {
                svg.append('line')
                    .attr('x1', dim.w / 2 + x(d.count) / 2)
                    .attr('y1', maxR + i * unitH)
                    .attr('x2', dim.w - maxR)
                    .attr('y2', getLinkedId(data.city, d.city) * unitH + maxR)
                    .style('opacity', 0.5)
                    .attr('class', 'stroke-grey js-where-elm js-where-line-' + d.id + ' js-where-line-city-' + d.id);
            }
        });
    };

    return {
        createHeatmap: createHeatmap,
        drawVenueConnection: drawVenueConnection
    }
});