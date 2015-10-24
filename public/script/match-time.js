define(['moment', 'textures'], function (moment, textures) {

    'user strict';

    var status = {
        value: 'absolute',
        group: 'day',
        type: 'bars'
    };

    var margin, dim, x, y, xAxis0, yAxis, tx, maxUser;

    function getDayHourDataset(byDay, byHour, byDayHour, maxY) {

        var maxRVal = _.map(_.range(2), function (user) {
            return _.max(_.map([byDay[user], byHour[user]], function (sort) {
                return _.max(sort);
            }));
        });

        var maxR = Math.min(dim.w/48 + margin.right, dim.h / 4);

        return _.map(byDayHour, function (user, i) {
            return _.flatten(_.map(user, function (day, j) {
                return _.map(day, function (d, hour) {
                    return {
                        x: {
                            day: x((24 * j) + (+hour)),
                            hour: x((7 * +hour) + j)
                        },
                        y: {
                            absolute: i === 0 ?
                                    y[i].absolute(d) :
                                    dim.h / 2 + margin.middle,
                            relative: i === 0 ?
                                y[i].relative(d/maxY[i]) :
                                dim.h / 2 + margin.middle,
                        },
                        baseY: i === 0 ? dim.h / 2 : dim.h / 2 + margin.middle,
                        width: dim.w / 24 / 7,
                        height: {
                            absolute: i === 0 ?
                                    dim.h / 2 - y[i].absolute(d) :
                                    y[i].absolute(d),
                            relative: i === 0 ?
                                    dim.h / 2 - y[i].relative(d/maxY[i]) :
                                    y[i].relative(d/maxY[i]),
                        },
                        cx: {
                            day: x((24 * j) + 12),
                            hour: x((7 * +hour) + 3.5)
                        },
                        cy: i === 0 ?
                            (dim.h / 4) :
                            (dim.h / 2 + margin.middle + dim.h / 4),
                        r: {
                            absolute_day: Math.sqrt(byDay[i][j] * maxR * maxR /
                                _.max(maxRVal)),
                            relative_day: Math.sqrt(byDay[i][j] /
                                maxRVal[i] * maxR * maxR),
                            absolute_hour: Math.sqrt(byHour[i][hour] *
                                maxR * maxR / _.max(maxRVal)),
                            relative_hour: Math.sqrt(byHour[i][hour] /
                                maxRVal[i] * maxR * maxR)
                        },
                        opacity: {
                            day: 0.05,
                            hour: 0.14
                        },
                        lable: {
                            bar: moment(j, 'e').format('ddd') + ', ' +
                                moment(hour, 'H').format('ha') + ' - ' +
                                moment((+hour + 1), 'H').format('ha'),
                            day: moment(j, 'e').format('dddd'),
                            hour: moment(hour, 'H').format('ha') + ' - ' +
                                moment((+hour + 1), 'H').format('ha')
                        },
                        value: {
                            bar: d,
                            day: byDay[i][j],
                            hour: byHour[i][hour]
                        }
                    };
                });
            }));
        });
    }

    function switchTicks(selected) {

        function updateAxis(callback) {
            d3.select('.js-time-x0').call(xAxis0[selected]);
            callback();
        }

        updateAxis(function () {
            d3.selectAll('.js-time-x line').attr('y2', function(d){
                var slice = selected === 'day' ? 24 : 7;
                if ( d % slice === 0 )  {
                    return $(this).parent().parent().data().value * dim.h / 2;
                } else if ( selected === 'day' && status.type === 'bars' &&
                    d % 6 === 0 ) {
                    return $(this).parent().parent().data().value * -6;
                } else {
                    return 0;
                }
            });
            d3.selectAll('.js-time-x0 text').style('display', function(d){
                if (status.group === 'day' && status.type === 'bubble' &&
                    d % 24 !== 0 && d % 6 === 0) {
                    return 'none';
                } else {
                    return 'block';
                }
            }).attr('transform', function(d) {
                if (status.group === 'day' && status.type === 'bubble' &&
                    d % 24 === 0) {
                    return 'translate(' + dim.w/14 + ', 0)';
                } else {
                    return '';
                }
            });
        });
    }

    function updateGraph(type, selected) {

        status[type] = selected;

        $('.js-time-tooltip').hide();
        d3.select('.js-time-bar-first').style('fill', E.users[maxUser]);

        //hide y axis when bubble
        if (status.type === 'bubble') {
            $('.js-time-y').hide();
        } else {
            $('.js-time-y').show();
        }

        if (type === 'value') { //absolute-relative
            _.each(yAxis, function (d, i) {
                d.scale(y[i][selected]);
                d3.select('.js-time-y-' + i).transition().call(d);
            });
            d3.selectAll('.js-time-bar')
                .transition()
                .attr('y', function (d) { return d.y[selected]; })
                .attr('height', function (d) { return d.height[selected]; });
            d3.selectAll('.js-time-bubble')
                .transition()
                .attr('r', function (d) {
                    return d.r[selected + '_' + status.group];
                })
                .style('opacity', function (d) {
                    return d.opacity[status.group];
                });
        } else if (type === 'group') { //day-hour

            d3.selectAll('.js-time-bar-bg').transition().attr('x', function() {
                var vals = $(this).data().value.split('-');
                return (selected === 'day') ?
                        x(+vals[0] * 24 + (+vals[1])) :
                        x(+vals[1] * 7 + (+vals[0]));
            });

            switchTicks(selected);

            d3.selectAll('.js-time-bar')
                .transition()
                .attr('x', function (d) { return d.x[selected]; });
            d3.selectAll('.js-time-bubble')
                .transition()
                .attr('cx', function (d) { return d.cx[selected]; })
                .attr('r', function (d) {
                    return d.r[status.value + '_' + selected];
                })
                .style('opacity', function (d) {
                    return d.opacity[status.group];
                });

            //update bubble mouse over
            _.each(_.range(2), function (user) {
                d3.selectAll('.js-time-bubble-' + user)
                    .on('mouseover', function (d) {
                        d3.select(this).style('fill', tx[user].url())
                            .style('opacity', 1);
                        E.setTooltipText([d.value[selected] + ' check-ins',
                            d.lable[selected]], 'time',
                            dim.w, d3.mouse(this)[0], d3.mouse(this)[1]);
                    });
            });
        } else {
            $('.js-time-elm').toggle();
            $('.js-time-bar-bg').toggle();
            $('#vis-timeline').find('.y').toggle();
            switchTicks(status.group);
        }
    }

    function putTexture(svg) {
        tx = _.map(E.users, function (d) {
            return textures.lines().size(6).background(d);
        });
        svg.call(tx[0]);
        svg.call(tx[1]);
    }

    function drawWeekends(svg) {
        _.each(_.range(2), function (i) {
            _.each(_.range(7), function (j) {
                _.each(_.range(24), function (hour) {
                    if (j === 0 || j > 4) {
                        svg.append('rect')
                            .attr('x', x(j * 24 + hour))
                            .attr('y', i === 0 ? 0 : dim.h / 2 + margin.middle)
                            .attr('width', dim.w / 24 / 7)
                            .attr('height', dim.h / 2)
                            .attr('fill', '#e5e5e5')
                            .attr('data-value', j + '-' + hour)
                            .attr('class', 'js-time-bar-bg');
                    }
                });
            });
        });
    }

    function drawElements(svg, byDayHour, dataset, max) {

        _.each(byDayHour, function (user, i) {

            svg.selectAll('.js-time-bubble-' + i)
                .data(dataset[i])
                .enter().append('circle')
                .attr('cx', function (d) { return d.cx.day; })
                .attr('cy', function (d) { return d.cy; })
                .attr('r', function (d) { return d.r.absolute_day; })
                .attr('fill', E.users[i])
                .style('opacity', 1/24)
                .attr('class', 'js-time-elm js-time-bubble js-time-bubble-' + i)
                .style('display', 'none')
                .on('mouseover', function (d) {
                    d3.select(this).style('fill', tx[i].url())
                        .style('opacity', 1);
                    E.setTooltipText([d.value.day + ' check-ins', d.lable.day],
                        'time', dim.w, d3.mouse(this)[0], d3.mouse(this)[1]);
                })
                .on('mouseout', function (d) {
                    $('.js-time-tooltip').hide();
                    d3.select(this).style('fill', E.users[i])
                    .style('opacity', 1/24);
                });

            svg.selectAll('.js-time-bar-' + i)
                .data(dataset[i])
                .enter().append('rect')
                .attr('x', function (d) { return d.x.day; })
                .attr('y', function (d) { return d.y.absolute; })
                .attr('width', function (d) { return d.width; })
                .attr('height', function (d) { return d.height.absolute; })
                .attr('fill', function (d) {
                    return d.value.bar === max ? tx[i].url() : E.users[i];
                })
                .attr('class', function (d) {
                    return 'js-time-elm js-time-bar js-time-bar-' + i +
                        (d.value.bar === max ? ' js-time-bar-first' : '');
                })
                .on('mouseover', function (d) {
                    d3.select(this).style('fill', tx[i].url());
                    if (d.value.bar !== max) {
                        d3.select('.js-time-bar-first')
                            .style('fill', E.users[maxUser]);
                    }
                    E.setTooltipText([d.value.bar + ' check-ins', d.lable.bar],
                        'time', dim.w, d3.mouse(this)[0], d3.mouse(this)[1]);
                })
                .on('mouseout', function () {
                    $('.js-time-tooltip').hide();
                    d3.select(this).style('fill', E.users[i]);
                });
        });
    }

    var drawTimeline = function (vis, byDay, byHour, byDayHour, profile) {

        margin = vis.margin;
        dim = vis.dim;
        var svg = vis.svg;

        x = d3.scale.linear().range([0, dim.w]).domain([0, 7 * 24]);
        xAxis0 = _.object(_.map(['day', 'hour'], function (sort) {
            var val = d3.svg.axis().scale(x).orient('bottom').ticks(7*24)
                .tickPadding(margin.middle / 4)
                .tickFormat(function (d) {
                    var f = '';
                    if (sort === 'day') {
                        if (d % 24 === 0) {
                            f = moment().day(d / 24).format('ddd');
                        } else if (d % 6 === 0) {
                            f = moment(d % 24, 'hh').format('ha');
                        }
                    } else {
                        if (d % 7 === 0) {
                            f = moment(d / 7, 'hh').format('ha');
                        }
                    }
                    return f;
                });
            return [sort, val];
        }));
        var xAxis1 = d3.svg.axis().scale(x).orient('top').ticks(7*24)
                .tickFormat('');

        var maxY = _.map(byDayHour, function (d) {
            return _.max(_.map(d, function (day) {
                return _.max(day);
            }));
        });
        y = _.map(_.range(2), function (d) {
            var range = d === 0 ? [0, dim.h / 2] : [dim.h / 2, 0];
            return _.object(_.map(['absolute', 'relative'], function (sort) {
                var val = d3.scale.linear().range(range);
                var domain = sort === 'absolute' ?
                        val.domain([E.getAxisTicks(_.max(maxY)).endPoint, 0]) :
                        val.domain([1, 0]);
                return [sort, domain];
            }));
        });
        yAxis = _.map(_.range(2), function (d) {
            return d3.svg.axis().scale(y[d].absolute).orient('left')
                    .tickSize(-dim.w);
        });

        //weekend
        drawWeekends(svg);

        svg.append('g')
            .attr('class', 'x axis js-time-x js-time-x0')
            .attr('data-value', -1)
            .attr('transform', 'translate(0, ' + dim.h / 2 + ')');
        svg.append('g')
            .attr('class', 'x axis js-time-x js-time-x1')
            .attr('data-value', 1)
            .attr('transform', 'translate(0, ' +
                (dim.h / 2 + margin.middle) + ')')
            .call(xAxis1);
        svg.append('g')
            .attr('class', 'y axis js-time-y js-time-y-0')
            .call(yAxis[0]);
        svg.append('g')
            .attr('class', 'y axis js-time-y js-time-y-1')
            .attr('transform', 'translate(0, ' +
                (dim.h / 2 + margin.middle) + ')')
            .call(yAxis[1]);
        switchTicks('day');

        //draw circle by Hour and bars
        putTexture(svg);
        var dataset = getDayHourDataset(byDay, byHour, byDayHour, maxY);
        maxUser = maxY[0] >= maxY[1] ? 0 : 1;
        drawElements(svg, byDayHour, dataset, _.max(maxY));

        //lable
        E.putAxisLable(svg, -dim.h / 4 + 10, 0, profile[0].username, 'y');
        E.putAxisLable(svg, -dim.h / 4 * 3 + 10 - margin.middle , 0,
            profile[1].username, 'y');

        //tooltip
        E.drawTooltip(svg, 'time', 2);
        var maxVals = _.filter(_.flatten(dataset), function (d) {
            return d.value.bar == _.max(maxY);
        })[0];
        E.setTooltipText([_.max(maxY) + ' check-ins', maxVals.lable.bar],
            'time', dim.w, maxVals.x.day, maxVals.y.absolute,
            dim.w / 24 / 7 / 2);
    };

    return {
        drawTimeline: drawTimeline,
        updateGraph: updateGraph
    };
});
