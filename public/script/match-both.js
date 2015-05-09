define(function () {

    var drawDistinctive = function (vis, data) {

        var margin = vis.margin;
        var dim = vis.dim;
        var svg = vis.svg;

        var x = d3.scale.linear().range([0, dim.w/2]).domain([0, _.max(data)]);

        svg.append('rect')
            .attr('x', dim.w / 2 -x(data[0]))
            .attr('y', 0)
            .attr('width', x(data[0]))
            .attr('height', dim.h)
            .style('fill', E.users[0]);
        svg.append('text')
            .attr('x', dim.w / 2 -x(data[0]) - E.noTicks.padding)
            .attr('y', dim.h / 2)
            .text(data[0])
            .style('fill', E.users[0])
            .attr('class', 'pos-end v-middle');
        svg.append('rect')
            .attr('x', dim.w / 2)
            .attr('y', 0)
            .attr('width', x(data[1]))
            .attr('height', dim.h)
            .style('fill', E.users[1]);
        svg.append('text')
            .attr('x', dim.w / 2 + x(data[1]) + E.noTicks.padding)
            .attr('y', dim.h / 2)
            .text(data[1])
            .style('fill', E.users[1])
            .attr('class', 'v-middle');
        svg.append('rect')
            .attr('x', dim.w / 2)
            .attr('y', 0)
            .attr('width', x(data[1]))
            .attr('height', dim.h)
            .style('fill', E.users[1]);
        svg.append('line')
            .attr('x1', dim.w / 2)
            .attr('x2', dim.w / 2)
            .attr('y1', -margin.top)
            .attr('y2', dim.h + margin.bottom)
            .attr('class', 'stroke-tick');
    };

    var putBoth = function (beersList) {
        _.each(_.range(4), function (i) {
            var list = beersList[i];
            if (!_.isEmpty(list)) {
                _.each(list, function (b) {
                    $('.js-both-' + i).append('<img src="' + b.label +
                        '" class="label-image" alt="' + b.name +
                        '" title="' + b.name + '">');
                });
            }
        });
    };

    return {
        drawDistinctive: drawDistinctive,
        putBoth: putBoth
    };
});
