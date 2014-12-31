define(['jquery', 'momentTZ', 'underscore'], function ($, moment, _) {

    // function getScoreAvg(checkins) {
    //     return Math.round(_.reduce(_.pluck(checkins, 'rating_score'), function (memo, num) {
    //             return memo + num;
    //         }, 0) / checkins.length * 100) / 100;
    // }

    function getMatchByBeer(b1, b2, max, beerCount) {
        var common = _.intersection(_.pluck(b1, 'bid'), _.pluck(b2, 'bid'));
        var match = 0;
        if (common) {
            var scores = _.map(common, function (bid) {
                var e1 = _.findWhere(b1, { bid: bid });
                var e2 = _.findWhere(b2, { bid: bid });
                var diff = Math.abs(e1.score * e1.count - e2.score * e2.count);
                return -1 / (max * 5) * diff + 1;  
            });
            console.log(scores.length, beerCount);
            var ratio = scores.length / beerCount;
            match = _.reduce(scores, function (memo, num) {
                    return memo + num;
                }, 0) / scores.length * ratio;
        }
        console.log('Match by beer---', match);
        return match;
    }

    /*
    function getBeerlist() {

        var d1;
        var d2;
        var b1;
        var b2;
        var mostCount1;
        var mostCount2;

        var mostCount = function (checkins) { 
            return _.max(_.countBy(_.pluck(checkins, 'beer'), function (d) {
                return d.bid;
            }));
        };

        $.ajax({
            url: '/users/old/gregavola.json'
        }).done(function (data1) {
            d1 = data1;
            b1 = _.map(_.groupBy(d1.checkins, function (d) {
                    return d.beer.bid;
                }), function (d) {
                    var b = d[0];
                    return {
                        bid: b.beer.bid,
                        count: d.length,
                        label: b.beer.beer_label,
                        name: b.beer.beer_name,
                        score: getScoreAvg(d)
                    };
                });
            mostCount1 = mostCount(d1.checkins);

            $.ajax({
                url: '/users/old/tanyofish.json'
            }).done(function (data2) {
                d2 = data2;
                b2 = _.map(_.groupBy(d2.checkins, function (d) {
                        return d.beer.bid;
                    }), function (d) {
                        var b = d[0];
                        return {
                            bid: b.beer.bid,
                            count: d.length,
                            label: b.beer.beer_label,
                            name: b.beer.beer_name,
                            score: getScoreAvg(d)
                        };
                    });
                mostCount2 = mostCount(d2.checkins);

                var maxMostBeer = Math.max(mostCount1, mostCount2);
                var minBeerCount = Math.min(d1.userinfo.beerCount, d2.userinfo.beerCount);   
        

                getMatchByBeer(b1, b2, maxMostBeer, minBeerCount);

                return [b1, b2];
            });
        });

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
        //get cosign val
        return Math.abs((-1 * (lenA * lenA) + lenB * lenB + lenC * lenC) / (2 * lenB * lenC));
    }
    */

    function getMatchByStyle(u1, u2) {

        var arr1 = _.pluck(u1.ratingsList.style, 'name');
        var arr2 = _.pluck(u1.ratingsList.style, 'name');
        var all = _.union(arr1, arr2);
        var scores = _.filter(_.map(all, function (name) {
                var e1 = _.findWhere(u1.ratingsList.style, { name: name });
                var e2 = _.findWhere(u2.ratingsList.style, { name: name });
                var r1 = e1 ? e1.rating * e1.count / u1.maxCount.style : 0;
                var r2 = e2 ? e2.rating * e2.count / u2.maxCount.style : 0;
                return {
                    name: name,
                    r1: r1,
                    r2: r2
                }
            }), function (d) {
                return d.r1 + d.r2 > 0;
            });
        var vector = _.map(scores, function (d) {
                return getSimilarity([d.r1, d.r2], [u1.scoreAvg, u2.scoreAvg]);
            });
        console.log(vector);
        var match = _.reduce(vector, function (memo, num) {
                return memo + num;
            }, 0)/vector.length;

        console.log('Match by style---', match);
        return match;
    }

	var match = function (dataset) {
        var u1 = dataset[0];
        var u2 = dataset[1];
    
        console.log(u1, u2);

        this.matchByStyle = getMatchByStyle(u1, u2);
        
        var maxMostBeer = Math.max(u1.beerList.mosts[0].title, u2.beerList.mosts[0].title);
        var minBeerCount = Math.min(u1.userinfo.beerCount, u2.userinfo.beerCount);
        this.matchByBeer = getMatchByBeer(u1.allBeers, u2.allBeers, maxMostBeer, minBeerCount);	
        
        this.url = dataset[0].userinfo.userId + '+' + dataset[1].userinfo.userId;
	};

	return match;
});