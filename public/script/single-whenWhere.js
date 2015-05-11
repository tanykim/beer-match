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
        var axisVals = E.getAxisTicks(_.max(_.pluck(data, 'total')), cY);
        var maxVal = axisVals.endPoint;
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
        };
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
                .attr('class', 'js-day-arc')
                .on('mouseover', function () {
                    var ttp = tooltipPos(i, d.venue / 2);
                    d3.selectAll('.js-day-arc').style('fill', E.colors.day);
                    d3.select(this).style('fill', tx.url());
                    E.setTooltipText(
                        [d.venue + ' out of ' + d.total, d.day], 'day',
                        dim.w, ttp[0], ttp[1]
                    );
                })
                .on('mouseout', function () {
                    d3.select(this).style('fill', E.colors.day);
                    $('.js-day-tooltip').hide();
                });
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
        var axis = d3.svg.axis().scale(y).orient('left').ticks(axisVals.count);
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

    function drawLegends(svg, w, top, maxR, count, maxVal) {

        //FIXME: make max 5, check rlyn
        var yPos = -(top - maxR * 2);

        //get diameter of the cicle in a reverse order
        var dia = _.map(_.range(count), function (i) {
            return  Math.sqrt(maxR * maxR *
                (maxVal - maxVal / count * i) / maxVal) * 2;
        });
        var xPos = function (i) {
            var sum = _.reduce(dia.slice(0, i), function (num, memo) {
                return memo + num;
            }, 0);
            return sum + maxR + 60;
        };

        _.each(_.range(count), function (i) {
            svg.append('circle')
                .attr('cx', w - xPos(i))
                .attr('cy', yPos)
                .attr('r', dia[i] / 2)
                .attr('fill', E.beerColors[0])
                .attr('opacity', 0.8);
            svg.append('text')
                .attr('x', w - xPos(i))
                .attr('y', yPos)
                .text(maxVal - maxVal / count * i)
                .attr('class', 'pos-middle size-tiny v-middle');
        });
        svg.append('text')
            .attr('x', w)
            .attr('y', yPos)
            .text('check-ins')
            .attr('class', 'pos-end fill-grey size-tiny v-middle');
        svg.append('text')
            .attr('x', w - xPos(count))
            .attr('y', yPos)
            .text('Bubble Size:')
            .attr('class', 'pos-end fill-grey size-tiny v-middle');
    }

    function getX(x, key, period, bgW) {
        return x(moment(key, period === 'month' ? 'YYYY-M' : 'YYYY-W')) + bgW;
    }

    function highlightTimelineCity(data, period, svg, dim, x, bgW) {
        _.each(data.by, function (d, key) {
            svg.append('line')
                .attr('x1', getX(x, key, period, bgW))
                .attr('y1', 0)
                .attr('x2', getX(x, key, period, bgW))
                .attr('y2', dim.h)
                .style('stroke-width', bgW)
                .attr('class', 'stroke-tick js-timeline-bg');
        });
    }

    function getTimeStr(key, period, val) {
        var timeStr = period === 'month' ?
            moment(key, 'YYYY-M').format('MMM, YYYY') :
            'Week ' + moment(key, 'YYYY-W').format('W, YYYY');
        return [val + ' check-ins', timeStr];
    }
    var drawTimeline = function (data, period, timeRange, vis) {

        var unitH = 40;
        var margin = vis.margin;
        var dim = {
            w: vis.w - margin.left - margin.right,
            h: unitH * _.size(data)
        };
        var svg = vis.draw({ dim: dim, margin: margin }, 'timeline');

        var x = d3.time.scale().range([0, dim.w])
                .domain([moment(timeRange[0]).startOf(period),
                    moment(timeRange[1]).endOf(period)]);
        var periodCount = moment(timeRange[1]).diff(timeRange[0], period);
        var xAxis = d3.svg.axis().scale(x).orient('top')
                    .ticks(Math.min(Math.floor(dim.w / 100), periodCount));
        svg.append('g')
            .attr('class', 'x axis')
            .call(xAxis);
        E.putAxisLable(svg, dim.w / 2, -70, period.toUpperCase(), 'x');

        var maxVal = _.max(_.map(_.pluck(data, 'by'), function (d) {
            return _.max(d);
        }));
        var axisVals = E.getAxisTicks(maxVal);
        var maxRVal = axisVals.endPoint;
        var maxR = unitH / 2;
        var bgW = dim.w / periodCount / 2;

        drawLegends(svg, dim.w, margin.top, maxR, axisVals.count, maxRVal);

        var tx = _.map(_.range(Math.min(_.size(data), 4)), function (i) {
            return textures.lines().size(6).lighter()
                .background(E.beerColors[i * 2]);
        });
        _.each(tx, function (d) {
            return svg.call(d);
        });

        var maxCx, maxCy;
        var maxRow = 0;
        var maxKey;

        _.each(data, function (d, i) {

            var yPos = i * unitH;
            svg.append('text')
                .attr('x', -E.noTicks.padding)
                .attr('y', yPos + unitH / 2)
                .text(d.city)
                .style('font-weight', i === 0 ? '700' : '')
                .attr('class', 'link-text pos-end v-middle size-tiny' +
                    (i === 0 ? ' js-timeline-city-0' : ''))
                .on('mouseover', function () {
                    if (i > 0) {
                        $('.js-timeline-city-0').css('font-weight', '');
                    }
                    E.setTooltipText([_.size(d.by) + ' / ' + periodCount + ' ' +
                        period + 's', 'Total ' + d.total + ' check-ins'],
                        'timeline', dim.w, -E.noTicks.padding,
                        yPos + unitH / 2 - 10);
                    $(this).css('font-weight', 700);
                    highlightTimelineCity(data[i], period, svg, dim, x, bgW);
                    d3.selectAll('.js-timeline-c').style('opacity', 0.1);
                    d3.selectAll('.js-timeline-c-'+ i).style('opacity', 0.8);
                })
                .on('mouseout', function () {
                    $(this).css('font-weight', '');
                    $('.js-timeline-tooltip').hide();
                    d3.selectAll('.js-timeline-c').style('opacity', 0.5);
                    $('.js-timeline-bg').remove();
                });
            svg.append('line')
                .attr('x1', 0)
                .attr('x2', dim.w)
                .attr('y1', yPos)
                .attr('y2', yPos)
                .attr('class', 'stroke-tick');

            var fill = E.beerColors[i % 4 * 2];
            _.each(d.by, function (val, key) {
                var cx = getX(x, key, period, bgW);
                var cy = yPos + unitH / 2;
                if (val === maxVal) {
                    maxCx = cx;
                    maxCy = cy;
                    maxRow = i % 4 * 2;
                    maxKey = key;
                }
                var r = Math.sqrt(maxR * maxR * val / maxRVal);
                svg.append('circle')
                    .attr('cx', cx)
                    .attr('cy', cy)
                    .attr('r', r)
                    .style('fill', val === maxVal ? tx[i % 4].url() : fill)
                    .style('opacity', val === maxVal ? 1 : 0.5)
                    .attr('class', 'js-timeline-c js-timeline-c-' + i +
                        (val === maxVal ? ' js-timeline-c-max' : ''))
                    .on('mouseover', function () {
                        if (val !== maxVal) {
                            d3.select('.js-timeline-c-max')
                                .style('fill', E.beerColors[maxRow])
                                .style('opacity', 0.5);
                        }
                        d3.select(this).style('fill', tx[i % 4].url())
                            .style('opacity', 1);
                        E.setTooltipText(getTimeStr(key, period, val),
                            'timeline-c', dim.w, cx, cy - r);
                    })
                    .on('mouseout', function () {
                        d3.select(this).style('fill', fill)
                            .style('opacity', 0.5);
                        $('.js-timeline-c-tooltip').hide();
                    });
            });
        });

        E.drawTooltip(svg, 'timeline', 2);
        E.setTooltipText([_.size(data[0].by) + ' / ' + periodCount + ' ' +
            period + 's', 'Total ' + data[0].total + ' check-ins'],
            'timeline', dim.w, -E.noTicks.padding, unitH / 2 - 10);
        E.drawTooltip(svg, 'timeline-c', 2);
        E.setTooltipText(getTimeStr(maxKey, period, maxVal),
            'timeline-c', dim.w, maxCx, maxCy - maxR);
    };

    return {
        drawDayStats: drawDayStats,
        drawTimeline: drawTimeline
    };
});