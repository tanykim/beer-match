define(['textures'], function (textures) {

    'use strict';

    var matrix, divide, names, checkins, tx;
    var init = false;

    function getConnected(arr) {
        var connected;
        for (var j = 0 ; j < arr.length ; j++) {
            if (arr[j] > 0) {
                connected = j;
                break;
            }
        }
        return connected;
    }

    function highlightSelected(opacity, i) {

        if (opacity === 1) {
            $('.js-styles-name').html(names[i]);
            $('.js-styles-user0').html(checkins[i][0]);
            $('.js-styles-user1').html(checkins[i][1]);
            $('.js-styles-checkins').show();
        } else {
            $('.js-styles-name').html('See which styles you share!');
            $('.js-styles-user0').html('');
            $('.js-styles-user1').html('');
            $('.js-styles-checkins').hide();
        }
        d3.select('.js-styles-arc-' + i).style('fill',
            opacity === 1 ?
            tx[i < divide ? 1 : 0].url() :
            E.users[i < divide ? 1 : 0]
        );
        var c = getConnected(matrix[i]);
        if (c) {
            d3.select('.js-styles-arc-' + c).style('fill',
                opacity === 1 ?
                tx[c < divide ? 1 : 0].url() :
                E.users[c < divide ? 1 : 0]
            );
        }
    }

    // Returns an event handler for fading a given chord group.
    function fade(opacity) {
        return function(g, i) {
            if (!init && opacity === 1) {
                highlightSelected(0.1, 0);
                d3.selectAll('.js-styles-path')
                    .filter(function(d) {
                        return d.source.index === 0 || d.target.index === 0;
                    })
                    .transition()
                    .style('opacity', 0.1);
                init = true;
            }
            highlightSelected(opacity, i);
            d3.selectAll('.js-styles-path')
                .filter(function(d) {
                    return d.source.index === i || d.target.index === i;
                })
                .transition()
                .style('opacity', opacity);
        };
    }

    var drawChord = function (data) {

        matrix = data.matrix;
        names = data.names;
        divide = data.divide;

        $('.js-styles-count').html('You two share ' +
            (data.common === 0 ? 'no' : data.common) +
            ' style' + (data.common !== 1 ? 's!' : '!'));

        checkins = _.map(matrix, function (d, i) {
            var c = getConnected(d);
            return [ c !== i ? matrix[c][i] : 0, d[c]];
        });

        var chord = d3.layout.chord()
            .padding(0.01)
            .sortSubgroups(d3.descending)
            .matrix(matrix);

        var width = $('.styles').width(),
            height = 500;
        var innerRadius = Math.min(width, height) * 0.40;
        var outerRadius = innerRadius * 1.2;

        var svg = d3.select('#vis-styles').append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + width / 2 +
                ',' + height / 2 + ')');

        //textures
        tx = _.map(E.users, function (color) {
            return textures.lines().size(6).background(color);
        });
        svg.call(tx[0]);
        svg.call(tx[1]);

        //arc
        svg.append('g').selectAll('path')
            .data(chord.groups)
            .enter().append('path')
            .style('fill', function (d) {
                return E.users[d.index < data.divide ? 1 : 0];
            })
            .style('opacity', function (d, i) {
                return _.contains(checkins[i], 0) ? 0.5 : 1;
            })
            .attr('d', d3.svg.arc().innerRadius(innerRadius)
                .outerRadius(outerRadius))
            .on('mouseover', fade(1))
            .on('mouseout', fade(0.1))
            .attr('class', function (d, i) { return 'js-styles-arc-' + i; });

        //linked path
        svg.append('g')
            .selectAll('.js-styles-path')
            .data(chord.chords)
            .enter().append('path')
            .attr('d', d3.svg.chord().radius(innerRadius))
            .attr('opacity', function (d, i) {
                return i === 0 ? 1 : 0.1;
            })
            .attr('class', 'fill-grey js-styles-path');

        //style name
        svg.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .attr('class', 'pos-middle size-large weight-700 js-styles-name');
        svg.append('text')
            .attr('x', 0)
            .attr('y', 16)
            .text('check-ins')
            .attr('class', 'pos-middle js-styles-checkins');
        svg.append('text')
            .attr('x', -40)
            .attr('y', 16)
            .style('fill', E.users[0])
            .attr('class', 'pos-end weight-700 js-styles-user0');
        svg.append('text')
            .attr('x', 40)
            .attr('y', 16)
            .style('fill', E.users[1])
            .attr('class', 'weight-700 js-styles-user1');

        highlightSelected(1, 0);
    };

    return {
        drawChord: drawChord
    };
});
