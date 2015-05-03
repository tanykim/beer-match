define(['moment'], function (moment) {

    // var dim, margin, svg;
    var drawDayStats = function (vis, data) {

        var margin = vis.margin;
        var dim = vis.dim;
        var svg = vis.svg;
        var maxR = dim.w/2;
        var maxVal = _.max(_.pluck(data, 'total'));
        var baseA = Math.PI * 2 / 7;
        var arc = function (val, i) {
            var r = maxR * Math.sqrt(val / maxVal);
            return d3.svg.arc()
                .innerRadius(0)
                .outerRadius(r)
                .startAngle(baseA * i)
                .endAngle(baseA * (i + 1));
        };

        //FIXME: add legend

        _.each(data, function (d, i) {
            svg.append('path') //arc of total checkins
                .attr('d', arc(d.total, i))
                .attr('fill', '#000')
                .attr('transform', 'translate(' + dim.w/2 + ', ' + dim.h/2 + ')');
            svg.append('path') //arc of at public venue
                .attr('d', arc(d.venue, i))
                .attr('fill', '#ccc')
                .attr('transform', 'translate(' + dim.w/2 + ', ' + dim.h/2 + ')');
            svg.append('line') //day divide line
                .attr('x1', dim.w/2)
                .attr('x2', Math.cos(i * Math.PI * 2 / 7 - Math.PI/2) * dim.w/2 + dim.w/2)
                .attr('y1', dim.h/2)
                .attr('y2', Math.sin(i * Math.PI * 2 / 7 - Math.PI/2) * dim.h/2 + dim.h/2)
                .attr('stroke', '#cc0000');
            svg.append('text') //day divide line
                .attr('x', dim.w - 40)
                .attr('y', dim.h/2)
                .text(moment().day(i).format('ddd'))
                .attr('transform', 'rotate(' + (360/7 * (i+1) - 90) + ', ' + dim.w/2 + ', ' + dim.h/2 + ')')
                .attr('data-day', i)
                .attr('class', 'link js-day-text');
        });
    };

    function highlightTimelineCity(data, period, svg, dim, x, bgW) {
        _.each(data[1][period], function (d, key) {
            console.log(key);
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