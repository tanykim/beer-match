define(['moment', 'textures'], function (moment, textures) {

    var drawDayStats = function (vis, data) {

        var dim = vis.dim;
        var margin = vis.margin;
        var svg = vis.svg;

        //texture
        var tx = textures.lines().size(6).lighter().background(E.colors.day);
        svg.call(tx);
        var maxVenue = _.max(data, function (d) {
            return d.venue;
        });

        var cX = dim.w / 2;
        var cY = dim.h / 2;
        var maxR = Math.min(cX, cY);
        var maxVal = E.getAxisTicks(_.max(_.pluck(data, 'total'))).endPoint;
        var r = d3.scale.sqrt().range([0, maxR]).domain([0, maxVal]);
        var baseA = Math.PI * 2 * 0.95 / 7;
        var arc = function (val, i) {
            return d3.svg.arc()
                .innerRadius(0)
                .outerRadius(r(val))
                .startAngle(baseA * i)
                .endAngle(baseA * (i + 1));
        };
        var tooltipPos = function (i, dis) {
            return [
                Math.cos((i + 0.5) * baseA - Math.PI / 2) * r(dis) + cX,
                Math.sin((i + 0.5)* baseA - Math.PI / 2) * r(dis) + cY
            ];
        }
        _.each(data, function (d, i) {
            svg.append('path') //arc of total checkins
                .attr('d', arc(d.total, i))
                .attr('transform', 'translate(' + cX + ', ' + cY + ')')
                .attr('class', 'fill-darkGrey');
            svg.append('path') //arc of at public venue
                .attr('d', arc(d.venue, i))
                .attr('fill',
                    d.venue === maxVenue.venue ? tx.url() : E.colors.day)
                .attr('transform', 'translate(' + cX + ', ' + cY + ')')
                .on('mouseover', function() {
                    var ttp = tooltipPos(i, d.venue / 2);
                    d3.selectAll('.js-day-arc').style('fill', E.colors.day);
                    d3.select(this).style('fill', tx.url());
                    E.setTooltipText(
                        [d.venue + ' out of ' + d.total, d.day], 'day',
                        dim.w, ttp[0], ttp[1]
                    );
                }).
                attr('class', 'js-day-arc');
            svg.append('line') //day divide line
                .attr('x1', cX)
                .attr('x2', Math.cos((i + 1) * baseA - Math.PI / 2) * maxR + cX)
                .attr('y1', cY)
                .attr('y2', Math.sin((i + 1) * baseA - Math.PI / 2) * maxR + cY)
                .attr('class', 'stroke-lightGrey');
            svg.append('text') //day divide line
                .attr('x', maxR * 2)
                .attr('y', cY)
                .attr('dy', -5)
                .text(moment().day(i).format('ddd').toUpperCase())
                .attr('transform', 'rotate(' +
                    (360 / 7 * 0.95 * (i + 1) - 90) + ', ' +
                    cX + ', ' + cY + ')')
                .attr('class', 'size-small fill-darkGrey js-day-text');
        });

        //axis line
        var y = d3.scale.sqrt().range([0, maxR]).domain([maxVal, 0]);
        var axis = d3.svg.axis().scale(y).orient('left');
        svg.append('g')
            .attr('transform',
                'translate(' + cX + ', ' + (dim.h / 2 - maxR) + ')')
            .call(axis)
            .attr('class', 'y axis');

        //tooltip
        E.drawTooltip(svg, 'day', 2);
        var dttp = tooltipPos(maxVenue.id, maxVenue.venue / 2);
        E.setTooltipText(
            [maxVenue.venue + ' out of ' + maxVenue.total, maxVenue.day],
            'day', dim.w, dttp[0], dttp[1]
        );
    };

    function highlightTimelineCity(data, period, svg, dim, x, bgW) {
        _.each(data[1][period], function (d, key) {
            svg.append('line')
                .attr('x1', x(moment(key, period === 'month' ? 'YYYY-M' : 'YYYY-W')) + bgW)
                .attr('y1', 0)
                .attr('x2', x(moment(key, period === 'month' ? 'YYYY-M' : 'YYYY-W')) + bgW)
                .attr('y2', dim.h)
                .style('stroke', '#000')
                .style('stroke-width', bgW)
                .style('opacity', .1)
                .attr('class', 'stoke-black, js-timeline-bg');
        });
    }

    var drawTimeline = function (data, timeRange, vis) {

        var unitH = 50;
        var margin = vis.margin;
        var dim = {
            w: vis.w - margin.left - margin.right,
            h: unitH * _.size(data) - margin.top - margin.bottom
        };
        var svg = vis.draw({ dim: dim, margin: margin }, 'timeline');

        var period = moment(timeRange[1]).diff(timeRange[0], 'month') > 3 ? 'month' : 'week';
        var periodCount = moment(timeRange[1]).diff(timeRange[0], period);

        var x = d3.time.scale().range([0, dim.w])
                .domain([moment(timeRange[0]).startOf(period), moment(timeRange[1]).startOf(period)]);
        var xAxis = d3.svg.axis().scale(x).orient('top');

        svg.append('g')
            .attr('class', 'x axis')
            .call(xAxis);

        var maxR = unitH / 2 - 6;
        var bgW = dim.w / periodCount / 2;

        var maxRVal = _.max(_.map(data, function (city) {
            return _.max(city[1][period]);
        }));

        _.each(data.length, function (d, i) {
            $('#vis-timeline .y:nth-child(' + i + ')').find('text')
                .mouseover(function () {
                    console.log(d[1], i);
                });
        });
        _.each(data, function (d, i) {
            var yPos = i * dim.h / _.size(data);
            var fill = E.beerColors[i % 4 * 2];

            _.each(d[1][period], function (val, label) {

                var cx = x(moment(label, period === 'month' ? 'YYYY-M' : 'YYYY-W')) + bgW;
                var cy = yPos + unitH / 2;
                svg.append('circle')
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', Math.sqrt(maxR * maxR * val / maxRVal))
                    .style('fill', fill)
                    .style('opacity', 0.5)
                    .attr('class', 'js-timeline-circle js-timeline-circle-' + i);
            });

            svg.append('text')
                .attr('x', -E.noTicks.padding)
                .attr('y', yPos + maxR)
                .attr('data-value', i)
                .text(d[0])
                .attr('class', 'link size-normal pos-end')
                .on('mouseover', function() {
                    $('.js-timeline-bg').remove();
                    $(this).attr('class', 'link size-normal pos-end bold');

                    var id = $(this).data().value;

                    highlightTimelineCity(data[id], period, svg, dim, x, bgW);

                    d3.selectAll('.js-timeline-circle').style('opacity', 0);
                    d3.selectAll('.js-timeline-circle-'+ id).style('opacity', 0.5);
                    d3.select('.js-timeline-over')
                        .attr('y', yPos)
                        .style('fill', fill)
                        .text(d[1].total + ' checkins:  ' + _.size(d[1][period]) + '/' + periodCount + ' ' + period + 's' );
                })
                .on('mouseout', function() {
                    $(this).attr('class', 'link size-normal pos-end');
                    $('.js-timeline-bg').remove();
                    d3.selectAll('.js-timeline-circle').style('opacity', 0.5);
                    d3.selectAll('.js-timeline-number').style('opacity', 0);
                    d3.select('.js-timeline-over').text('');
                });

            svg.append('line')
                .attr('x1', 0)
                .attr('x2', dim.w)
                .attr('y1', yPos)
                .attr('y2', yPos)
                .attr('class', 'stroke-tick');
        });

        //last line
        svg.append('line')
            .attr('x1', 0)
            .attr('x2', dim.w)
            .attr('y1', dim.h)
            .attr('y2', dim.h)
            .attr('class', 'stroke-tick');

        //mouse over
        svg.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text('')
            .attr('class', 'pos-end js-timeline-over');
    };

    return {
        drawDayStats: drawDayStats,
        drawTimeline: drawTimeline
    }
});