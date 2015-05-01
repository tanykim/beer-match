var E = {

    //text for UI
    msgs: {
        intro: {
            init: 'Explore your beers and see a match with a friend!' +
                '<br/> Enter your UNTAPPD user name',
            diffName: 'Try a different user name',
            userIdCheck: 'Checking user name...',
            tooShort: 'Should be at least 3 characters',
            friends: 'Or enter an Untapped user name',
            noFriends: 'No friends found, enter an UNTAPPD user name',
            back: 'Welcome back!'
        },
        share: {
            facebook: 'https://www.facebook.com/sharer/' +
                'sharer.php?u=http%3A%2F%2Fbeer.tany.kim',
            twitter: 'https://twitter.com/intent/tweet?' +
                'text=Check this cool visualization of beer! ' +
                'See your beer taste and the match with your friends at ' +
                'http%3A%2F%2Fbeer.tany.kim',
            google: 'https://plus.google.com/share?' +
                    'url=http%3A%2F%2Fbeer.tany.com'
        },
        titles: {
            single: [
                '1. How much do I drink?',
                '2. What matters?',
                '3. love & hate',
                '4. When do I drink?',
                '5. Where do I drink?',
                '6. When & Where'
            ],
            match: [
                '1. Match scores',
                '2. Who drinks more?',
                '3. Beers (dis/)agreed',
                '4. Shared styles',
                '5. When do we drink?',
                '6. Where do we drink?'
            ]
        }
    },

    //colors
    colors: {
        count: '#f99b0c',
        ratings: {
            style: '#ffc61e', abv: '#d86018',
            brewery: '#7c2529', country: '#3f2021'
        },
        when: '#7c2529'
    },
    lightGrey: '#e5e5e5',
    beerColors: ['#e8dd21', '#ffc61e', '#f99b0c', '#d38235', '#d86018',
        '#7c2529', '#643335', '#3f2021', '#25282a'],
    users: ['#801E47', '#3A5F4E'],

    //vis
	noTicks: { size: 0, padding: 9, lableTop: -26, lableBottom: 40 }, //ticks size

	getAxisTicks: function (maxVal, len) {
		//gap: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
        var gap = Math.pow(10, maxVal.toString().length - 1);
        if (maxVal / gap < 2) {
            gap = gap / 5;
        } else if (maxVal / gap < 5) {
            gap = gap / 2;
        }
        var slicesCount = Math.ceil((maxVal + 1) / gap);
        var count = Math.min(10, slicesCount);
        if (len) {
            count = len / slicesCount < 20 ? 5 : count;

        }
        return {
        	endPoint: slicesCount * gap,
        	count: count,
            step: slicesCount * gap / count
        }
	},

    ttP: 14, //tooltip Padding
    ttL: 22, //tooltip line height

    drawTooltip: function (svg, name, count) {

        svg.append('g')
            .attr('class', 'js-' + name + '-tooltip');

        d3.select('.js-' + name + '-tooltip').append('path')
            .attr('class', 'fill-dark js-' + name + '-tooltip-bg');

        d3.select('.js-' + name + '-tooltip').append('text')
            .attr('y', 0)
            .attr('class', 'js-' + name + '-tooltip-text');
        _.each(_.range(count), function (i) {
            d3.select('.js-' + name + '-tooltip-text').append('tspan')
                    .attr('x', 0)
                    .attr('dy', -E.ttL)
                    .attr('class', 'fill-white size-tiny js-' + name +
                        '-tooltip-text-' + i);
        });
    },

    getTooltipPath: function (dir, width, height) {
        return 'M 0 0 ' +
                ' v ' + (-height - 10) +
                ' h ' + width * dir +
                ' v ' + height +
                ' h ' + -dir * (width - 10) + ' z';
    },

    setTooltipText: function (strArray, name, dimW, x, y) {

        var dir = x < dimW / 2 ? 1 : -1;

        _.each(strArray, function (d, i) {
            d3.select('.js-' + name + '-tooltip-text-' + i)
                .text(d)
                .attr('x', dir * E.ttP)
                .attr('class', 'fill-white size-tiny js-' + name +
                    '-tooltip-text-' + i + ' ' +
                    (dir === 1 ? 'pos-start' : 'pos-end'));
        });
        $('.js-' + name + '-tooltip-bg')
            .attr('d',
                E.getTooltipPath(dir,
                    $('.js-' + name + '-tooltip-text').width() +
                    E.ttP * 2, (E.ttL * 2 + E.ttP - 4) ));
        $('.js-' + name + '-tooltip').attr('transform',
            'translate(' + (x + E.ttP / 2) + ', ' +
                y + ')');
    },

    drawStar: function (k) {
        var c1 = Math.cos(0.2 * Math.PI);
        var c2 = Math.cos(0.4 * Math.PI);
        var s1 = Math.sin(0.2 * Math.PI);
        var s2 = Math.sin(0.4 * Math.PI);
        var r = 1;
        var hr = r / 1.5;
        var r1 = 1.5 * r * c2/c1;
        var star = [[0,-r], [r1*s1,-r1*c1], [r*s2,-r*c2], [r1*s2,r1*c2],
                [r*s1,r*c1], [0,r1], [-r*s1,r*c1], [-r1*s2,r1*c2],
                [-r*s2,-r*c2],[-r1*s1,-r1*c1],[0,-r]];
        var line = d3.svg.line()
                .x(function (d) { return d[0] * k;})
                .y(function (d) { return d[1] * k;});
        return line(star) + 'Z';
    },

    legendW: 200,
    legendH: 20,

    updateChroma: function (step, gap, c, colors) {
        var unitW = E.legendW / step;
        _.each(_.range(step), function (i) {
            d3.select('.js-' + c + '-legend').append('rect')
                .attr('x', 20 + unitW * i)
                .attr('y', 0)
                .attr('width', unitW)
                .attr('height', E.legendH)
                .style('fill', colors[i])
                .style('opacity', 1)
                .attr('class', 'stroke-tick ' + 'js-' + c + '-legend-block');
        });
        d3.select('.js-' + c + '-legend-max').text(step * gap);
    },

    drawChromaLegend: function (svg, dimW, step, gap, c, colors) {
        svg.append('g')
            .attr('transform', 'translate(' + (dimW - E.legendW - 40) +
                ', -40)')
            .attr('class', 'js-' + c + '-legend');
        d3.select('.js-' + c + '-legend').append('text')
            .attr('x', 5)
            .attr('y', E.legendH - 5)
            .text('0')
            .attr('class', 'size-small');
        d3.select('.js-' + c + '-legend').append('text')
            .attr('x', -5)
            .attr('y', E.legendH - 5)
            .text('check-ins')
            .attr('class', 'pos-end fill-grey size-small');
        d3.select('.js-' + c + '-legend').append('text')
            .attr('x', E.legendW + 25)
            .attr('y', E.legendH - 5)
            .attr('class', 'size-small js-' + c + '-legend-max');
        E.updateChroma(step, gap, c, colors);
    },

    putAxisLable: function (svg, x, y, str, axis, size, jsc) {
        svg.append('text')
            .attr('x', x)
            .attr('y', y)
            .text(str)
            .attr('transform', axis === 'y' ? 'rotate(-90)' : '')
            .attr('class', 'pos-middle fill-grey size-' + size +
                (jsc ? ' ' + jsc : ''));
    }

}