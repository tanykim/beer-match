define(['moment'], function (moment) {

    'use strict';

    var colors = E.colors.ratings;
    var dim, margin, svg, r;

    function getCenterBeerPositions(category, order, text) {

        var positions = {
            xPos: dim.w/2,
            yPos: dim.h/2,
            dy: 0,
            textX: dim.w/2 + ( category === 'abv' || category === 'brewery' ?
                -dim.h/4 : dim.h/4),
            textY: dim.h/2 + ( category === 'abv' || category === 'style' ?
                -dim.h/4 : dim.h/4),
            anchor: 'pos-middle',
            size: 'size-small',
            fill: 'fill-grey'
        };

        if (!_.isNull(order)) {
            var dot = d3.select('.js-beers-' + category + '-' + order);
            var xPos = +dot.attr('cx');
            var yPos = +dot.attr('cy');

            // text position
            var dy = -r * 4;
            // if line goes down
            if (yPos > dim.h/2) {
                dy = r * 4;
            }
            // if text is too long and cut
            var textX = xPos;
            var anchor = 'pos-middle';
            var textW = text.length * 20;
            var outOfLeft = textW / 2 - (margin.left + xPos);
            var outOfRight = textW / 2 - (margin.right + dim.w - xPos);
            if (outOfLeft > 0) {
                textX = 0;
                anchor = '';
            } else if (outOfRight > 0) {
                textX = dim.w;
                anchor = 'pos-end';
            }
            positions = {
                xPos: xPos,
                yPos: yPos,
                dy: dy,
                textX: textX,
                textY: yPos,
                anchor: anchor,
                size: 'size-large',
                fill: ''
            };
        }
        return positions;
    }

    function updateCenterBeer(b, maxCount) {

        //html update
        $('.js-beers-name').html(b.name);
        if (b.score === 0) {
            $('.js-beers-score').html('No Ratings');
        } else {
            $('.js-beers-score').html('');
            _.each(_.range(parseInt(b.score)), function (i) {
               $('.js-beers-score').append('<i class="fa fa-star"></i>');
            });
            if (b.score * 10 % 10 !== 0) {
               $('.js-beers-score').append('<i class="fa fa-star-half-o"></i>');
            }
        }

        //FIXME: fix trmming issue in BeerMatch-user.js
        $('.js-beers-style').html(b.categories.style.name.trim());
        $('.js-beers-abv').html(b.abv + '%');
        $('.js-beers-brewery').html(b.categories.brewery.name.trim());
        $('.js-beers-country').html(b.categories.country.name.trim());
        $('.js-beers-count').html(b.count);
        $('.js-beers-times').html('check-in' + (b.count > 1 ? 's' : ''));

        //center beer image transition
        $('.js-beers-beer-img').hide().attr('href', b.label).fadeIn('fast');

        _.each(b.categories, function (d, category) {

            var p = getCenterBeerPositions(category, d.order, d.name);

            //selected circle and lines
            d3.select('.js-beers-beer-bg-' + category)
                    .transition()
                .attr('cx', p.xPos)
                .attr('cy', p.yPos)
                .attr('r', Math.sqrt(d.count/ maxCount[category]) *
                    (margin.oR + margin.top));
            d3.select('.js-beers-beer-line-' + category)
                    .transition()
                .attr('x2', p.xPos).attr('y2', p.yPos);

            //reset all dots
            d3.selectAll('.js-beers-dot-' + category)
                .style('fill', colors[category])
                .style('opacity', 0.3);

            //blacken the selected dot
            d3.select('.js-beers-' + category + '-' + d.order)
                    .transition()
                .style('fill', '')
                .style('opacity', 1);

            //update text
            d3.select('.js-beers-beer-text-' + category).text('')
                    .transition()
                .attr('x', p.textX).attr('y', p.textY).attr('dy', p.dy)
                .text(d.name)
                .attr('class', 'unselectable ' + p.size + ' ' + p.anchor +
                    ' ' + p.fill + ' js-beers-beer-text-' + category);
            d3.select('.js-beers-beer-text-count-' + category).text('')
                    .transition()
                .attr('x', p.xPos).attr('y', p.textY).attr('dy', p.dy + 14)
                .text(d.count > 0 ?
                    d.count + ' check-in' + (d.count > 1 ? 's' : '') : '');
        });
    }

    var drawCenterBeer = function () {

        //bg Radius, link line & name
        _.each(['style', 'abv', 'brewery', 'country'], function (category) {
            svg.append('line')
                .attr('x1', dim.w/2)
                .attr('x2', dim.w/2)
                .attr('y1', dim.h/2)
                .attr('y2', dim.h/2)
                .attr('class', 'stroke-black stroke-2 ' +
                    'js-beers-beer-line-' + category);
            svg.append('text')
                .attr('x', dim.w/2)
                .attr('y', dim.h/2)
                .attr('dy', 0)
                .text('')
                .attr('class', 'size-large pos-middle unselectable ' +
                    'js-beers-beer-text-' + category);
            svg.append('text')
                .attr('x', dim.w/2)
                .attr('y', dim.h/2)
                .attr('dy', 0)
                .text('')
                .attr('class', 'size-small pos-middle fill-darkGrey unselectable ' +
                    'js-beers-beer-text-count-' + category);
        });

        //image background
        svg.append('defs')
            .append('pattern')
                .attr('id', 'beer-label')
                .attr('viewBox', '0 0 ' + margin.iR + ' ' + margin.iR)
                .attr('width', '100%')
                .attr('height', '100%')
            .append('image')
                .attr('xlink:href', '')
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .attr('width', margin.iR)
                .attr('height', margin.iR)
                .attr('class', 'js-beers-beer-img');
        svg.append('circle')
            .attr('cx', dim.w/2)
            .attr('cy', dim.h/2)
            .attr('r', margin.iR)
            .attr('fill', 'url(#beer-label)')
            .attr('class', 'stroke-black stroke-2 js-beers-beer-img');
    };

    var drawBeers = function (vis, ratings) {

        margin = vis.margin;
        dim = vis.dim;
        svg = vis.svg;
        var maxR = dim.h / 2;

        //radials
        var gapBase = (maxR - margin.oR - margin.iR) / 11;
        _.each(_.range(11), function (i) {
            svg.append('circle')
                .attr('cx', dim.w/2)
                .attr('cy', dim.h/2)
                .attr('r', margin.iR + gapBase * (i + 1))
                .style('fill', 'none')
                .attr('class', 'stroke-1 stroke-lightGrey ' +
                    (i % 2 === 1 ? 'stroke-dashed' : ''));
            var score = i/2;
            svg.append('text')
                .attr('x', dim.w/2)
                .attr('y', (maxR - margin.iR) - gapBase * (i + 1))
                .text(score)
                .attr('class', 'pos-middle v-middle size-tiny fill-grey');
        });

        //vertical and horitontal lines
        svg.append('line')
            .attr('x1', dim.w/2 - maxR)
            .attr('x2', dim.w/2 + maxR)
            .attr('y1', dim.h/2)
            .attr('y2', dim.h/2)
            .attr('class', 'stroke-grey stroke-1');
        svg.append('line')
            .attr('x1', dim.w/2)
            .attr('x2', dim.w/2)
            .attr('y1', 0)
            .attr('y2', dim.h)
            .attr('class', 'stroke-grey stroke-1');

        //draw circles
        //10 degrees
        var angleMargin = Math.PI/36;
        var baseAngle = Math.PI/2 - angleMargin * 2;
        r = 6;
        var i = 0;
        _.each(ratings, function (data, category) {

            //draw selected big circle
            svg.append('circle')
                .attr('cx', dim.w/2)
                .attr('cy', dim.w/2)
                .attr('r', 0)
                .attr('fill', colors[category])
                .attr('opacity', 0.8)
                .attr('class', 'js-beers-beer-bg-' + category);

            //draw dot
            _.each(data, function (d) {
                var distance = gapBase * (d.score * 2 + 1) + margin.iR;
                var angle = angleMargin + baseAngle / _.size(data) * d.id +
                    Math.PI/2 * (i + 1);
                var xPos = distance * Math.sin(angle);
                var yPos = distance * Math.cos(angle);
                svg.append('circle')
                    .attr('cx', xPos + dim.w/2)
                    .attr('cy', yPos + dim.h/2)
                    .attr('r', r)
                    .style('fill', colors[category])
                    .style('opacity', 0.3)
                    .attr('class', 'js-beers-dot-' + category +
                        ' js-beers-' + category + '-' + d.id)
                    .on('mouseover', function() {
                        d3.select(this).style('opacity', 1);
                        svg.append('text')
                            .attr('x', xPos + dim.w/2)
                            .attr('y', yPos + dim.h/2 - 10)
                            .text(d.name + ' (' + d.count + ')')
                            .style('fill', colors[category])
                            .attr('class', 'size-tiny ' +
                                (category === 'style' || category === 'country' ?
                                'pos-end' : '') +
                                ' js-beers-beer-dot-text');
                    })
                    .on('mouseout', function() {
                        d3.select(this).style('opacity', 0.3);
                        $('.js-beers-beer-dot-text').remove();
                    });
            });
            i = i + 1;
            drawCenterBeer();
        });
    };

    var putBeers = function (beerList) {

        function addBeer(beer, key, i, j) {
            $('.js-beers-' + key + '-list')
                .append('<img src="' + beer.label + '" width="40"' +
                    'class="label-image link ' +
                    (key === 'loves' && i + j === 0 ? 'selected"' : '"') +
                    'data-value="' + key + '-' + i + '-' + j + '">');
        }
        _.each(beerList, function (sort, key) {
            if (_.isEmpty(sort)) {
                $('.js-beers-' + key + '-list').html('No Beers');
            } else {
                _.each(sort, function (list, i) {
                    $('.js-beers-' + key + '-list')
                        .append((i > 0 ? ' / ' : '') +
                            (key === 'mosts' ?
                                '<i class="fa fa-check-square-o"></i> ' :
                                '<i class="fa fa-star"></i> ') + list.title);
                    _.each(list.list, function (beer, j) {
                        addBeer(beer, key, i, j);
                    });
                });
            }
        });
    };

    return {
        putBeers: putBeers,
        drawBeers: drawBeers,
        updateCenterBeer: updateCenterBeer,
        drawCenterBeer: drawCenterBeer
    };
});