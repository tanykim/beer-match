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
                '3. Beers I love & hate',
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

    //categories
    category: {
    	list: ['style', 'abv', 'brewery', 'country'],
    	colors: {
    		style: '#ffc61e', abv: '#d86018',
			brewery: '#7c2529', country: '#3f2021'
    	}
    },

    //colors
	beerColors: ['#e8dd21', '#ffc61e', '#f99b0c', '#d38235', '#d86018',
        '#7c2529', '#643335', '#3f2021', '#25282a'],
    colors: {
        count: '#f99b0c'
    },
	users: ['#801E47', '#3A5F4E'],

	//vis
	noTicks: { size: 0, padding: 9 }, //ticks size

	getAxisTicks: function (maxVal, len) {
		//gap: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
        var gap = Math.pow(10, maxVal.toString().length - 1);
        if (maxVal / gap < 2) {
            gap = gap / 5;
        } else if (maxVal / gap < 5) {
            gap = gap / 2;
        }
        var slicesCount = Math.ceil((maxVal + 1) / gap);

        return {
        	endPoint: slicesCount * gap,
        	count: len / slicesCount < 16 ? 5 : Math.min(10, slicesCount)
        }
	},

    ttP: 12, //tooltip Padding
    ttL: 20, //tooltip line height

    drawTooltip: function (svg, name, count) {

        svg.append('g')
            .attr('class', 'js-' + name + '-tooltip');

        d3.select('.js-' + name + '-tooltip').append('path')
            .attr('class', 'fill-dark js-' + name + '-tooltip-bg');

        d3.select('.js-' + name + '-tooltip').append('text')
            .attr('y', 0)
            .attr('class', 'js-' + name + '-tooltip-text');
        _.each(_.range(count), function (i) {
            d3.select('.js-cal-tooltip-text').append('tspan')
                    .attr('x', 0)
                    .attr('dy', -E.ttL)
                    .attr('class', 'fill-white size-tiny js-' + name +
                        '-tooltip-text-' + i);
        });
    },

    setTooltipText: function (strArray, name, dir) {
        _.each(strArray, function (d, i) {
            d3.select('.js-' + name + '-tooltip-text-' + i)
                .text(d)
                .attr('x', dir * E.ttP)
                .attr('class', 'fill-white size-tiny js-' + name +
                    '-tooltip-text-' + i + ' ' +
                    (dir === 1 ? 'pos-start' : 'pos-end'));
        });
    },

    getTooltipPath: function (dir, width, height) {
        return 'M 0 0 ' +
                ' v ' + (-height - 10) +
                ' h ' + width * dir +
                ' v ' + height +
                ' h ' + -dir * (width - 10) + ' z';
    }
}