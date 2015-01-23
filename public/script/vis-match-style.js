define(['vis-settings', 'moment'], function (Settings, moment) {

    var colors = Settings.colors;

    var drawChord = function (data) {

        var matrix = data.matrix;

        var chord = d3.layout.chord()
            .padding(.02)
            .sortSubgroups(d3.descending)
            .matrix(matrix);

        var width = $('.styles').width(),
            height = 500,
            innerRadius = Math.min(width, height) * .41,
            outerRadius = innerRadius * 1.1;

        var svg = d3.select('#vis-styles').append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        svg.append('g').selectAll('path')
            .data(chord.groups)
            .enter().append('path')
            .style('fill', function(d) { 
                return (d.index < data.divide ? Settings.users[0] : Settings.users[1]);
            })
            .attr('d', d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
            .on('mouseover', fade(.1))
            .on('mouseout', fade(1));

        var ticks = svg.append('g').selectAll('g')
            .data(chord.groups)
            .enter().append('g').selectAll('g')
            .data(groupTicks)
            .enter().append('g')
            .attr('transform', function(d) {
              return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')'
                  + 'translate(' + outerRadius + ',0)';
            });

        ticks.append('text')
            .attr('x', 8)
            .attr('dy', '.35em')
            .attr('transform', function(d) { return d.angle > Math.PI ? 'rotate(180)translate(-16)' : null; })
            .style('text-anchor', function(d) { return d.angle > Math.PI ? 'end' : null; })
            .text(function(d) { return d.label + '-' + d.name; });

        svg.append('g')
            .attr('class', 'chord')
            .selectAll('.js-styles-path')
            .data(chord.chords)
            .enter().append('path')
            .attr('d', d3.svg.chord().radius(innerRadius))
            .attr('class', function (d) {
                return d.source.index == d.target.index ? 'styles-dummy' : 'styles-linked js-styles-path'; 
            })

        // Returns an array of tick angles and labels, given a group.
        function groupTicks(d) {
            return [{
                angle: d.startAngle + (d.endAngle - d.startAngle) / 2,
                label: Math.round(d.value),
                name: data.names[d.index]
            }];
        }

        // Returns an event handler for fading a given chord group.
        function fade(opacity) {
          return function(g, i) {
            svg.selectAll('.js-styles-path')
                .filter(function(d) { return d.source.index != i && d.target.index != i; })
                .transition()
                .style('opacity', opacity);
          };
        }

    };

    return {
        drawChord: drawChord
    };
});
