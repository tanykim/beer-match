define(['jquery', 'momentTZ', 'underscore'], function ($, moment, _) {

    function getSum(arr) {
        return _.reduce(arr, function (memo, num) {
            return memo + num;
        }, 0);
    }
     
    function getBeersList(allBeers, common) {

        var loves = function (list) {
            return _.pluck(_.filter(list, function (d) {
                return d.score >= 4 && _.contains(common, d.bid);
            }), 'bid');
        };
        var hates = function (list) {
            return _.pluck(_.filter(list, function (d) {
                return d.score <= 2 && _.contains(common, d.bid);
            }), 'bid');
        };

        function getBeerInfo(list1, list2) {
            return _.map(_.intersection(list1, list2), function (d) {
                var u1 = _.findWhere(allBeers[0], { bid: d });
                var u2 = _.findWhere(allBeers[1], { bid: d });
                return {
                    name: u1.name,
                    label: u1.label,
                    scores : [u1.score, u2.score],
                    counts : [u1.count, u2.count]
                };
            });
        }

        return [
            getBeerInfo(loves(allBeers[0]), loves(allBeers[1])), //both love
            getBeerInfo(hates(allBeers[0]), hates(allBeers[1])), //both hate
            getBeerInfo(loves(allBeers[0]), hates(allBeers[1])), //1 love 2 hate
            getBeerInfo(hates(allBeers[0]), loves(allBeers[1])) //1 hate 2 love
        ];
    }

    function getVenues(dataset, common) {
        return _.sortBy(_.map(common, function (id) {
            var u1 = _.findWhere(dataset[0], { id: id });
            var u2 = _.findWhere(dataset[1], { id: id });
            return {
                name: u1.name,
                city: u1.city,
                counts: [u1.count, u2.count],
                lat: u1.lat,
                lng: u1.lng
            };
        }), function (d) {
            return d.counts[0] + d.counts[1];
        }).reverse();
    }

    function getSimilarity(v, base) {
        function getDistance(p1, p2) {
            var x1 = p1[0];
            var y1 = p1[1];
            var x2 = p2[0];
            var y2 = p2[1];
            return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        }
        var lenA = getDistance(base, v);
        var lenB = getDistance(v, [0, 0]);
        var lenC = getDistance(base, [0, 0]);
        //get Cos val
        return (-1 * (lenA * lenA) + lenB * lenB + lenC * lenC) / (2 * lenB * lenC);
    }

    function getVector(scores, scoreAvgs) {
        return _.map(scores, function (d) {
            return getSimilarity(d, scoreAvgs);
        });
    }

    function getMatchByBeer(dataset, common, scoreAvgs) {
        var scores = _.filter(_.map(common, function (bid) {
            return _.map(dataset, function (d) {
                var elm = _.findWhere(d.allBeers, { bid: bid });
                return elm.score * elm.count / d.userinfo.beerCount;
            });
        }), function (arr) {
            return arr[0] + arr[1] > 0;
        });
        var vector = getVector(scores, scoreAvgs);
        return getSum(vector) / vector.length;
    }

    function getMatchByAttr(dataset, attr, scoreAvgs) {    
        var all = _.unique(_.flatten(_.map(dataset, function (d) {
            return _.pluck(d.ratingsList[attr], 'name');
        })));
        var scores = _.filter(_.map(all, function (name) {
            return _.map(dataset, function (d) {
                var elm = _.findWhere(d.ratingsList[attr], { name: name });
                return elm ? elm.rating * elm.count / d.maxCount[attr] : 0;
            });
        }), function (arr) {
            return arr[0] + arr[1] > 0;
        });
        var vector = getVector(scores, scoreAvgs);
        return getSum(vector) / vector.length;
    }

    function getStyles(dataset) {
        var styles = _.map(dataset, function (d, i) {
        var list = _.sortBy(_.map(d.ratingsList.style, function (style) {
                return {
                    name: style.name,
                    count: style.count,
                    rating: style.rating
                };
            }), function(d) {
                return d.count;
            });
            return i === 1 ? list.reverse() : list;
            });

        function addRow(user, styles, second) {
            var row = [];
            var commonStyles = _.intersection(_.pluck(styles[0], 'name'), _.pluck(styles[1], 'name'));
            var getValue = function (d, same) {
                var isContains = _.contains(commonStyles, user.name);
                var value = 0
                if ((isContains && !same || !isContains && same) && d.name === user.name) {
                // if ((isContains && !same) && d.name === user.name) {
                   
                    value = user.count;
                }
                return value;
            };
            _.each(styles[1], function (d) {
                row.push(getValue(d, !second));
            });
            _.each(styles[0], function (d) {
                row.push(getValue(d, second));
            });
            return row;
        }
        
        var matrix = [];
        var names = [];

        //reverse order
        _.each(styles[1], function (user) {
            var row = addRow(user, styles, false);
            matrix.push(row);
            names.push(user.name);
        });
        _.each(styles[0], function (user, i) {
            var row = addRow(user, styles, true);
            matrix.push(row);
            names.push(user.name);
        });

        return {
            matrix: matrix,
            names: names,
            divide: _.size(styles[1])
        };
    }

	var match = function (dataset) {

        console.log(dataset);
        
        /* match by taste by
        - common beer similarity
        - styles similarity
        - abv similarity
        */
        var scoreAvgs = _.pluck(dataset, 'scoreAvg');
        var commonBeers = _.intersection(_.pluck(dataset[0].allBeers, 'bid'), _.pluck(dataset[1].allBeers, 'bid'));
        var byBeer = 0;
        if (!_.isEmpty(commonBeers)) {
            byBeer = getMatchByBeer(dataset, commonBeers, scoreAvgs);
        }
        var byStyle = getMatchByAttr(dataset, 'style', scoreAvgs);
        var byAbv = getMatchByAttr(dataset, 'abv', scoreAvgs);

        //percentage
        var matchList = {
            beer: Math.round(byBeer * 1000) / 10,
            style: Math.round(byStyle * 1000) / 10,
            abv: Math.round(byAbv * 1000) / 10
        };
        var weight = {
            beer: 0.2,
            style: 0.5, 
            abv: 0.3
        };
        var weighted = _.map(matchList, function (by, key) {
            return by * weight[key];
        });
        this.matchList = matchList;
        this.matchScore = Math.round(getSum(weighted) * 10) / 10;

        console.log('Match Score---', this.matchList, this.matchScore); 

        /* behavior compasition stats -1 to 1
        - Beer Lover - light drinker: count
        - Explorer - Loyal patron: distinctive / all checkin
        - Weekend - Steady: weekend/weekday
        - Socializer - hermit: venue/total
        - Daytime - other time: // by hour
        1 to -1, calbration needed based on the comparison
        */
        var stCount = _.map(dataset, function (d) {
            // 0 to 40
            return Math.min(Math.max(1/20 * d.avgCount.month - 1, -1), 1);
        });
        var stExplorer = _.map(dataset, function (d) {
            // 1: all differnt, -1: all same
            return d.userinfo.beerCount / d.userinfo.checkinCount * 2 - 1;
        });   
        var days = _.map(dataset, function (d) {
            return _.pluck(d.byDay, 'total');
        });
        var stWeekend = _.map(days, function (arr, i) {
            // 1: all weekend, -1: all 7 days
            return (arr[0] + arr[6]) / dataset[i].userinfo.checkinCount * 2 - 1;
        });
        var stSocial = _.map(dataset, function (d) {
            // 1: all social, -1: all home
            return getSum(_.pluck(d.byDay, 'venue')) / d.userinfo.checkinCount * 2 - 1;
        });
        var hours = _.map(dataset, function (d) {
                return _.map(_.range(24), function (h) {
                    return d.byHour[h] ? d.byHour[h].total : 0;
                });
            });
        var stDaytime = _.map(hours, function (d, i) {
            var lateNight = d.slice(0, 4);
            lateNight[lateNight.length] = d[23];
            var segments = [
                d.slice(11, 17), //11am - 5pm
                d.slice(17, 20), //5pm - 8pm
                d.slice(20, 23), //8pm - 11pm
                lateNight //11pm - 4am
            ];
            var bySeg = _.map(segments, function (seg) {
                return getSum(seg);
            });
            // 1: all day drink, -1: all night drink
            return bySeg[0] / getSum(bySeg) * 2 - 1;
        });
        this.behavior = {
            count: stCount,
            explorer: stExplorer,
            weekend: stWeekend,
            social: stSocial,
            daytime : stDaytime
        };
        console.log('stats count--', stCount);
        console.log('stats explorer--', stExplorer);
        console.log('stats weekend--', stWeekend);
        console.log('stats social--', stSocial);
        console.log('stats segments--', stDaytime);

        /* dataset for vis 
        - URL
        - userinfo
        - avgCount
        - beerlist
        - style
        - by day, by hour
        - top venues, common venues, venue match
        */
        this.url = dataset[0].userinfo.userId + '+' + dataset[1].userinfo.userId;
        this.userinfo = _.pluck(dataset, 'userinfo');
        this.avgCount = _.pluck(dataset, 'avgCount');
        this.beersList = [];
        if (commonBeers) {
            this.beersList = getBeersList(_.pluck(dataset, 'allBeers'), commonBeers);
        }
        
        this.styles = getStyles(dataset);

        // console.log(matrix);
        // this.styles = matrix;

        this.byDay = days;
        this.byHour = hours;
        
        var commonVenues = _.intersection(_.pluck(dataset[0].allVenues, 'id'), _.pluck(dataset[1].allVenues, 'id'));
        this.topVenueTypes = _.map(dataset, function (d) {
                return _.sortBy(_.map(d.venues.type, function (t, key) {
                    return { type: key, icon: t.icon, count: t.count };
                }), function (v) {
                    return v.count;
                }).reverse();
            });
        this.venues = [];
        if (!_.isEmpty(commonVenues)) {
            this.venues = getVenues(_.pluck(dataset, 'allVenues'), commonVenues);
        }

        console.log('common beers list--', this.beersList);
        console.log('by day and hour--', this.byDay, this.byHour);
        console.log('top venues--', this.topVenueTypes);
        console.log('common venues--', this.venues);
        // console.log('match by venues--', this.matchByVenue); 
	};

	return match;
});