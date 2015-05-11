define(['textures'], function (textures) {

    var map, cluster, m; //marker for the selected location
    var locations;

    var unitH, dim, svg, maxR, maxRVal, txb;
    var txc = {};

    function getMapTooltip(d) {
        return '<div class="selected"><div class="name">' +
            '<img src="' + d.icon + '"> ' + d.name + '</div>' +
            '<div class="location"><span class="type">' + d.type + '</span> ' +
            (d.city ? '/ <span class="city">' + d.city + '</span></div>' : '') +
            '<div class="count">' + d.count + ' check-ins / visited ' +
            d.dates.length + ' day' + (d.dates.length > 1 ? 's' : '') +
            '</div></div>';
    }

    var createHeatmap = function (data) {

        locations = data;
        var center = locations[0].location;

        //FIXME: the token should be hidden
        if (_.isUndefined(map)) {
            L.mapbox.accessToken = 'pk.eyJ1IjoidGFueWtpbSIsImEiOiJXNEJUOGhNIn0.pnUsTT-Zhecb67vCemuMSQ';
            map = L.mapbox.map('vis-map', 'examples.map-20v6611k')
                .setView(center, 12);
        } else {
            map.setView(center, 12);
            map.removeLayer(m);
            map.removeLayer(cluster);
            m = undefined;
            cluster = undefined;
        }

        cluster = new L.MarkerClusterGroup();
        _.each(locations, function (d, i) {
            var marker = L.marker(new L.LatLng(d.location[0], d.location[1]), {
                icon: L.mapbox.marker.icon(
                    {
                        'marker-color': '#666',
                        'icon-size': 'small'
                    }
                )
            }).bindPopup(d.name + ': ' + d.count + ' check-ins');
            cluster.addLayer(marker);
        });
        map.addLayer(cluster);

        m = L.marker(new L.LatLng(center[0], center[1]), {
            icon: L.mapbox.marker.icon(
                {
                    'marker-symbol': '1',
                    'marker-color': '#000',
                    'marker-size': 'large'
                }
            )
        });
        m.bindPopup(getMapTooltip(locations[0])).addTo(map);
        m.openPopup();
    };

    function drawBubbles(data, sort) {

        var angle = sort === 'type' ? 30 : -30;
        var anchor = sort === 'type' ? 'end' : 'start';
        var xPos = sort === 'type' ? maxR : dim.w - maxR;

        svg.append('text')
            .attr('x', xPos)
            .attr('y', -6)
            .text(sort === 'type' ? 'Venue Type' : 'City')
            .style('fill', E.colors.where[sort])
            .attr('class', 'size-small ' +
                (sort === 'type' ? 'pos-end' : 'pos-start'));

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
            .style('fill', E.colors.where[sort])
            .style('opacity', 0.5)
            .attr('class', function (d, i) {
                return 'js-where-elm js-where-' + sort +
                    ' js-where-' + sort + '-' + i;
            })
            .on('mouseover', function (d, i) {

                //opacity change
                d3.selectAll('.js-where-elm').style('opacity', 0.1);
                d3.select(this).style('fill', txc[sort].url()).style('opacity', 1);
                d3.select('.js-where-text-' + sort + '-' + i)
                    .style('opacity', 1);

                //highlight name link
                _.map(d.venueIds, function (id) {
                    d3.select('.js-where-line-' + sort + '-' + id)
                        .style('opacity', 1);
                    d3.select('.js-where-bar-' + id)
                        .style('fill', E.colors.where[sort]);
                    d3.select('.js-where-count-' + id)
                        .style('fill', '#000');
                });
            })
            .on('mouseout', function (d, i) {
                d3.select(this).style('fill', E.colors.where[sort]);
                d3.selectAll('.js-where-elm').style('opacity', 0.5);
                d3.selectAll('.js-where-bar').style('fill', '#000');
                d3.selectAll('.js-where-count').style('fill', '#ccc');
            });

        _.each(data, function (d, i) {

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
                .attr('transform', 'rotate(' + angle + ', ' +
                    xPos + ', ' + (i * unitH + maxR - 14) + ')')
                .attr('class', 'js-where-elm js-where-text-' + sort + '-' + i);
        });

        //highlighted bubble when mouseover on a bar
        svg.append('circle')
            .attr('cx', xPos)
            .attr('cy', 0)
            .attr('r', 0)
            .style('fill', '#000')
            .style('opacity', 0.5)
            .attr('class', 'js-where-linked-' + sort);
    }

    function callMouseIx(elm, d, lid, show) {

        //bar
        $(elm).css('fill', show ? txb.url() : '#000');
        d3.select('.js-where-count-' + d.id)
            .style('fill', show ? '#000' : '#fff');

        //all circles
        d3.selectAll('.js-where-elm').style('opacity', show ? 0.1 : 0.5);

        if (show) {
            //circles
            d3.select('.js-where-city-' + lid.city).style('opacity', 1);
            d3.select('.js-where-type-' + lid.type).style('opacity', 1);
            if (lid.city > -1) {
                d3.select('.js-where-linked-city')
                    .attr('cy', maxR + unitH * lid.city)
                    .transition()
                    .attr('r', Math.sqrt(maxR * maxR * d.count / maxRVal));
            }
            if (lid.type > -1) {
                d3.select('.js-where-linked-type')
                    .attr('cy', maxR + unitH * lid.type)
                    .transition()
                    .attr('r', Math.sqrt(maxR * maxR * d.count / maxRVal));
            }

            //text
            d3.select('.js-where-text-city-' + lid.city).style('opacity', 1);
            d3.select('.js-where-text-type-' + lid.type).style('opacity', 1);

            //line
            d3.selectAll('.js-where-line-' + d.id).style('opacity', 1);
        } else {
            d3.select('.js-where-linked-city').transition().attr('r', 0);
            d3.select('.js-where-linked-type').transition().attr('r', 0);
        }
    }

    function showMapTooltip(i) {
        var loc = locations[i].location;
        map.setView(loc, 14);
        m.setLatLng(L.latLng(loc[0], loc[1]));
        m.setIcon(L.mapbox.marker.icon(
            {
                'marker-symbol': (i + 1),
                'marker-color': '#000000',
                'marker-size': 'large'
            }
        ));
        m.bindPopup(getMapTooltip(locations[i])).addTo(map);
        m.openPopup();
    }

    function drawLocationVals(data, x, lids) {
        _.each(data.name, function (d, i) {
            svg.append('text')
                .attr('x', dim.w / 2)
                .attr('y', maxR + i * unitH - 14)
                .text(d.name)
                .attr('class', 'link pos-middle size-small')
                .on('mouseover', function () {
                    callMouseIx($('.js-where-bar-' + d.id), d, lids[i], true);
                })
                .on('click', function() {
                    showMapTooltip(i);
                })
                .on('mouseout', function () {
                    callMouseIx($('.js-where-bar-' + d.id),d, lids[i], false);
                });
            svg.append('text')
                .attr('x', dim.w / 2)
                .attr('y', maxR + i * unitH + 6)
                .text(d.count)
                .style('fill', i === 0 ? '#000' : '#fff')
                .attr('class', 'size-small pos-middle link ' +
                    'js-where-count js-where-count-' + d.id)
                .on('mouseover', function () {
                    if (i > 0) {
                        d3.select('.js-where-count-0').style('fill', '#fff');
                    }
                    callMouseIx($('.js-where-bar-' + d.id), d, lids[i], true);
                })
                .on('click', function() {
                    showMapTooltip(i);
                })
                .on('mouseout', function () {
                    callMouseIx($('.js-where-bar-' + d.id),d, lids[i], false);
                });
            if (d.type) {
                svg.append('line')
                    .attr('x1', dim.w / 2 - x(d.count) / 2)
                    .attr('y1', maxR + i * unitH)
                    .attr('x2', maxR)
                    .attr('y2', lids[i].type * unitH + maxR)
                    .style('opacity', 0.5)
                    .attr('class', 'stroke-grey js-where-elm js-where-line-' +
                        d.id + ' js-where-line-type-' + d.id);
            }
            if (d.city) {
                svg.append('line')
                    .attr('x1', dim.w / 2 + x(d.count) / 2)
                    .attr('y1', maxR + i * unitH)
                    .attr('x2', dim.w - maxR)
                    .attr('y2', lids[i].city * unitH + maxR)
                    .style('opacity', 0.5)
                    .attr('class', 'stroke-grey js-where-elm js-where-line-' +
                        d.id + ' js-where-line-city-' + d.id);
            }
        });
    }

    var drawVenueConnection = function (data, vis) {

        unitH = 50;
        var margin = vis.margin;
        dim = { w: vis.w - margin.left - margin.right, h: unitH * 11 };
        svg = vis.draw({ dim: dim, margin: margin }, 'where');
        maxR = unitH;
        maxRVal = _.max(_.union(_.pluck(data.city, 'count'),
            _.pluck(data.type, 'count')));

        //chroma
        txb = textures.lines().size(6).lighter().stroke('#999').background('#ccc');
        txc.type = textures.lines().size(6).lighter().stroke('#fff')
            .background(E.colors.where.type);
        txc.city = textures.lines().size(6).lighter().stroke('#fff')
            .background(E.colors.where.city);
        svg.call(txb);
        svg.call(txc.type);
        svg.call(txc.city);

        //draw city and type
        drawBubbles(data.type, 'type');
        drawBubbles(data.city, 'city');

        var x = d3.scale.linear().range([0, dim.w / 2])
            .domain([0, _.max(_.pluck(data.name, 'count'))]);

        //get linked ids
        var lids = _.map(data.name, function (place) {
            return _.object(_.map(['type', 'city'], function (sort) {
                var id = -1;
                _.each(data[sort], function (d, i) {
                    if (d.name === place[sort]) {
                        id = i;
                    }
                });
                return [sort, id];
            }));
        });

        //name bars
        svg.selectAll('.js-where-bar')
            .data(data.name)
                .enter().append('rect')
            .attr('x', function (d) { return dim.w / 2 - x(d.count) / 2; })
            .attr('y', function (d, i) { return maxR + i * unitH - 10; })
            .attr('width', function (d) { return x(d.count); })
            .attr('height', 20)
            .style('fill', function (d, i) { return i === 0 ? txb.url() : '#000'; })
            .attr('class', function (d) {
                return 'link js-where-bar js-where-bar-' + d.id;
            })
            .on('mouseover', function (d, i) {
                if (i > i) {
                    d3.select('.js-where-bar-0').attr('fill', '#000');
                }
                callMouseIx(this, d, lids[i], true);
            })
            .on('click', function (d, i) {
                showMapTooltip(i);
            })
            .on('mouseout', function (d, i) {
                callMouseIx(this, d, lids[i], false);
            });

        //text
        drawLocationVals(data, x, lids);
    };

    return {
        createHeatmap: createHeatmap,
        drawVenueConnection: drawVenueConnection
    };
});