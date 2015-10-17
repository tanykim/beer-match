var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment-timezone');

function getTimezoned(t, timezone) {
    return moment.tz(t, 'ddd, DD MMM YYYY HH:mm:ssZ', timezone);
}

function getUnitId(today, t) {

    var week = t.year() + '-' + t.week();
    if (t.month() === 11 &&
        t.clone().add(6, 'days').date() < 7 &&
        moment(t.year() + 1, 'YYYY').startOf('year').day() > t.day()) {
        week = (t.year() + 1) + '-1';
    }
    return {
        day: t.format('YYYYMMDD'),
        week: week,
        month: t.year() + '-' + (t.month() + 1)
    };
}

function getCountByPeriod(checkins, today, since) {

    var daysCount = Math.ceil(today.diff(since, 'days', true)) + 1;

    //fill 0 if no check in
    var valByUnitId = _.object(_.map(['day', 'week', 'month'], function (unit) {
        return [
            unit,
            _.countBy(checkins, function (d) {
                return d.unitId[unit];
            })
        ];
    }));

    var byDayFull = _.map(_.range(daysCount), function (i) {

        var date = since.clone().add(i, 'days').startOf('day');
        var dateId = getUnitId(today, date);
        var vals = _.object(_.map(['day', 'week', 'month'], function (unit) {
            return [unit, valByUnitId[unit][dateId[unit]] ? valByUnitId[unit][dateId[unit]] : 0];
        }));

        return {
            date: date.format('YYYYMMDD'),
            day: vals.day,
            week: vals.week,
            month: vals.month,
            dateId : dateId
        };
    });

    var maxCount = _.object(_.map(valByUnitId, function (d, key) {
        return [key, _.max(d)]
    }));

    var unitCounts = _.object(_.map(['day', 'week', 'month'], function (unit) {
        return [ unit, _.size(_.unique(_.pluck(_.pluck(byDayFull, 'dateId'), unit))) ];
    }));

    var sober = _.object(_.map(['day', 'week', 'month'], function (unit) {
        return [ unit, unitCounts[unit] - _.size(valByUnitId[unit]) ];
    }));

    var frequency = _.object(_.map(['day', 'week', 'month'], function (unit) {

        //max 10 slots
        var maxVal = _.max(valByUnitId[unit]);
        //gap: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
        var gap = Math.pow(10, maxVal.toString().length - 1);
        if (maxVal / gap < 2) {
            gap = gap / 5;
        } else if (maxVal / gap < 5) {
            gap = gap / 2;
        }
        var slicesCount = Math.ceil(maxVal / gap);
        if (maxVal === gap * slicesCount) {
            slicesCount++;
        }

        //list = { 0: [], gap: [] }
        var list = _.countBy(_.values(valByUnitId[unit]), function (d) {
            return Math.floor(d / gap) * gap;
        });
        list[0] = unitCounts[unit] - _.size(valByUnitId[unit]);

        var slicesByCount = _.map(_.range(slicesCount), function (i) {
            return _.isUndefined(list[gap * i]) ? 0 : list[gap * i];
        });

        return [unit, {
            counts: slicesByCount,
            gap: gap
        }];
    }));

    console.log(frequency);

    return {
        list: byDayFull,
        maxCount: maxCount,
        unitCounts: unitCounts,
        sober: sober,
        frequency: frequency
    };
}

function getScoreAvg(checkins) {
    return Math.round(_.reduce(_.pluck(checkins, 'rating_score'),
        function (memo, num) {
            return memo + num;
        }, 0) / checkins.length * 100) / 100;
}

function stringifyAbv(val) {
    var str;
    if (+val >= 10) {
        str = '0' + Math.floor(+val);
    } else {
        str = '00' + Math.floor(+val);
    }
    return str;
}

function getAllList(checkins, obj, key) {

    function getFilteredCount (list, count) {
        return _.filter(list, function (d) {
            return d.count > count;
        });
    }

    function get(obj, key) {

        var list = _.map(_.groupBy(_.map(checkins, function (d) {
            var subObj;
            if (obj === 'beer') {
                subObj = 'beer_' + key;
            } else {
                subObj = key + '_name';
            }
            return {
                key: d[obj][subObj],
                rating_score: d.rating_score,
                beerId: d.beer.bid
            };
        }), function (d) {
            if (key === 'abv') {
                return stringifyAbv(d.key);
            } else {
                return d.key;
            }
        }), function (arr, name) {
            return {
                    name: name,
                    count: arr.length,
                    score: getScoreAvg(arr),
                    beers: _.size(_.unique(_.pluck(arr, 'beerId')))
                };
        });

        //get max 30 elements
        var maxCount = _.max(_.pluck(list, 'count'));
        if (_.size(list) > 30) {
            for (var i = 1; i < maxCount; i++) {
                var filtered = getFilteredCount(list, i);
                if (_.size(filtered) < 30) {
                    list = filtered;
                    break;
                }
            }
        }

        var listWithId = _.map(_.sortBy(list, function (d) {
            return d.count;
        }).reverse(), function (d, i) {
            return {
                id: i,
                name: key === 'abv' ? parseInt(d.name) + '.X %' : d.name,
                count: d.count,
                score: d.score,
                beers: d.beers
            };
        });

        return listWithId;
    }

    return {
        style: get('beer', 'style'),
        abv: get('beer', 'abv'),
        brewery: get('brewery', 'brewery'),
        country: get('brewery', 'country')
    };
}

function getRatingsMaxCount (list) {
    return _.object(_.map(_.keys(list), function (k) {
        return [k, _.max(_.pluck(list[k], 'count'))];
    }));
}

function getCategoriesVals(checkin, ratings) {
    var categories = {
        style: checkin.beer.beer_style,
        abv: parseInt(checkin.beer.beer_abv) + '.X %',
        country: checkin.brewery.country_name,
        brewery: checkin.brewery.brewery_name
    };
    return _.object(_.map(ratings, function (d, key) {
        var ratingsObj = _.where(d, { name : categories[key] });
        var order = null;
        var count = 0;
        if (!_.isEmpty(ratingsObj)) {
            order = ratingsObj[0].id;
            count = ratingsObj[0].count;
        }
        return [key, { order: order, name: categories[key], count: count }];
    }));
}

function getBeerListByRating(score, currentList, checkins, ratings) {

    function getBeerCount(bid) {
        return _.size(_.filter(_.map(checkins, function (d) {
            return d.beer.bid;
        }), function (id) {
            return id === bid;
        }));
    }

    //exclude beers that were in the previous rating
    var lastScoreIds = [];
    if (!_.isEmpty(currentList)) {
        lastScoreIds = _.pluck(currentList[currentList.length - 1].list, 'bid');
    }

    var list = _.sortBy(_.map(_.groupBy(_.filter(checkins, function (d) {
            return d.rating_score === score &&
                !_.contains(lastScoreIds, d.beer.bid);
        }), function (d) {
            return d.beer.bid;
        }), function (d) {
            var categories = getCategoriesVals(d[0], ratings);
            return {
                bid: d[0].beer.bid,
                abv: d[0].beer.beer_abv,
                count: getBeerCount(d[0].beer.bid),
                label: d[0].beer.beer_label,
                name: d[0].beer.beer_name,
                categories: categories,
                score: score
            };
        }), function (d) {
            return d.count;
        }).reverse();
    if (score === 0) {
        list = _.filter(list, function (d) {
            return d.count > 1;
        });
    }
    return list;
}

function getFavorites(checkins, ratings) {

    var loves = [];
    var highest = _.max(_.pluck(checkins, 'rating_score'));
    var highCount = 0;
    for (var i = highest; i >= 4; i = i - 0.5) {
        var beerList = getBeerListByRating(i, loves, checkins, ratings);
        loves.push({ title: i, list: beerList });
        highCount = highCount + beerList.length;
        if (highCount >= 10) {
            break;
        }
    }
    var hates = [];
    var lowest = _.min(_.pluck(checkins, 'rating_score'));
    var lowestBound = Math.max(lowest, 2);
    var lowCount = 0;
    for (var i = lowest; i <= lowestBound; i = i + 0.5) {
        var beerList = getBeerListByRating(i, hates, checkins, ratings);
        if (beerList.length > 0) {
            hates.push({ title: i, list: beerList });
        }
        lowCount = lowCount + beerList.length;
        if (lowCount >= 10) {
            break;
        }
    }

    //beers drank most
    var mostCount = _.max(_.countBy(_.pluck(checkins, 'beer'), function (d) {
            return d.bid;
        }));
    var mostList = _.map(_.filter(_.map(_.groupBy(checkins, function (d) {
            return d.beer.bid;
        }), function (d) {
            return [d.length, d];
        }), function (arr) {
            return arr[0] === mostCount;
        }), function (d) {
            var b = d[1][0];
                var categories = getCategoriesVals(b, ratings);
            return {
                bid: b.beer.bid,
                abv: b.beer.beer_abv,
                count: mostCount,
                label: b.beer.beer_label,
                name: b.beer.beer_name,
                categories: categories,
                score: getScoreAvg(d[1])
            };
        });

    return  {
        loves: loves,
        hates: hates,
        mosts: [{ title: mostCount, list: mostList }]
    };
}

function getByDay(checkins, timezone) {
    var byDay = _.groupBy(_.map(checkins, function (d) {
            return [
                d.created_at.day(),
                d.venue.public_venue? true : false
            ];
        }), function (d) {
            return d[0];
        });
    return _.map(_.range(7), function (i) {
        var d = byDay[i] ? byDay[i]: [];
        var publicVenue = _.filter(d, function (d) {
            return d[1];
        });
        return {
            id: i,
            day: moment(i, 'd').format('dddd'),
            total: d.length,
            venue: publicVenue.length
        };
    });
}

function getByHour(checkins, timezone) {
    var byHour = _.groupBy(_.map(checkins, function (d) {
            return {
                day: d.created_at.day(),
                hour: d.created_at.hour()
            };
        }), function (d) {
            return d.hour;
        });

    var byHourFilled = _.map(_.range(24), function (h) {
            return byHour[h] ? byHour[h] : 0;
        });

    return _.object(_.map(byHourFilled, function (d, i) {
            var byDayObj = _.countBy(_.pluck(d, 'day'));
            var byDay = _.map(_.range(7), function (i) {
                    return byDayObj[i] ? byDayObj[i]: 0;
                });
            var total = _.reduce(_.values(byDay), function (memo, num) {
                    return memo + num;
                }, 0);
            return [i, { total: total, byDay: byDay }];
        }));
}

function getVenueType(d) {
    var type = "undefined";
    if (d.venue.categories) {
        var primary = _.filter(d.venue.categories.items, function (d) {
            return d.is_primary;
        });
        if (!_.isEmpty(primary)) {
            type = primary[0].category_name;
        }
    }
    return type;
}

function getCityName(loc) {
    var city = '';
    if (loc) {
        if (loc.venue_city) {
            var country = '';
            if (loc.venue_country) {
                if (loc.venue_country !== 'United States') {
                    country = ', ' + loc.venue_country;
                }
            }
            city = loc.venue_city +
                (loc.venue_state ? ', ' + loc.venue_state : '') + country;
        }
    }
    return city;
}

function getVisitedDates(data) {
    return _.unique(_.map(data, function (d) {
        return moment(d.created_at.format('YYYYMMDD'));
    }));
}

function getLocationList(checkins) {
    return _.sortBy(_.map(_.omit(_.groupBy(checkins, function (d) {
        if (d.venue.venue_id) {
            return d.venue.venue_id;
        }
    }), 'undefined'), function (d) {
        return {
            id: d[0].venue.venue_id,
            name: d[0].venue.venue_name,
            count: d.length,
            icon: d[0].venue.venue_icon.sm,
            location: [d[0].venue.location.lat, d[0].venue.location.lng],
            score: getScoreAvg(d),
            dates: getVisitedDates(d),
            type: getVenueType(d[0]),
            city: getCityName(d[0].venue.location)
        };
    }), function (d) {
        return d.count;
    }).reverse();
}

function getVenueList(checkins, locations) {

    function getVenueIds(d) {
        return _.unique(_.map(d, function (v) {
            return v.venue.venue_id;
        }));
    }

    var venueTypes = _.sortBy(_.map(_.omit(_.groupBy(checkins, function (d) {
            return getVenueType(d);
        }), 'undefined'), function (d, key) {
            return {
                name: key,
                count: d.length,
                icon: d[0].venue.venue_icon.sm,
                venueIds: getVenueIds(d)
            };
        }), function (obj) {
            return obj.count;
        }).reverse().slice(0, 10); //top 10 locations

    var venueCities = _.sortBy(_.map(_.omit(_.groupBy(checkins, function (d) {
            return getCityName(d.venue.location);
        }), ''), function (d, key) {
            return {
                name: key,
                count: d.length,
                venueIds: getVenueIds(d)
            };
        }), function (obj) {
            return obj.count;
        }).reverse().slice(0, 10);

    return {
        name: locations.slice(0, 10),
        type: venueTypes,
        city: venueCities
    };
}

function getVenueByTime(checkins, unit, timezone) {

    return _.sortBy(_.map(_.omit(_.groupBy(_.map(checkins, function (d) {
        var city = getCityName(d.venue.location);
        return [city, d.unitId[unit]];
    }), function (arr) {
        return arr[0];
    }), ''), function (unitArr, city) {
        return {
            city: city,
            total: unitArr.length,
            by: _.countBy(unitArr, function (u) {
                return u[1];
            })
        };
    }), function (obj) {
        return obj.total;
    }).reverse().slice(0, 20);
}

function getAllBeers(checkins) {

    return _.map(_.groupBy(checkins, function (d) {
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
}

var User = function (userinfo, timezone, originalCheckins) {

    var since = getTimezoned(userinfo.since, timezone);
    var today = moment().tz(timezone);

    var checkins = _.map(originalCheckins, function (d) {
        var timezoned = getTimezoned(d.created_at, timezone);
        return {
            created_at: timezoned,
            unitId: getUnitId(today, timezoned),
            rating_score: d.rating_score,
            beer: d.beer,
            brewery: d.brewery,
            venue: d.venue
        };
    });

    this.timeRange = _.map([since, moment().tz(timezone)], function (d) {
        return moment(d).format('YYYYMMDD HH:mm:ssZ');
    });

    //---from user info
    this.userinfo = userinfo;

    //--count
    var avgCount = _.object(_.map(['day', 'week', 'month'], function (unit) {
        var count = moment().diff(since, unit, true);
        return [unit, Math.round(userinfo.checkinCount / count * 10) / 10];
    }));
    var avgUnit = 'week';
    if (avgCount.week < 1) {
        avgUnit = 'month';
    } else if (avgCount.week > 20) {
        avgUnit = 'day';
    }

    this.avgCount = avgCount;
    this.avgUnit = avgUnit;
    this.countByPeriod = getCountByPeriod(checkins, today, since);
    this.scoreAvg = getScoreAvg(checkins);

    //ratings
    var ratings = getAllList(checkins);
    this.ratingsList = ratings;
    this.scoreCount = _.pick(_.countBy(_.pluck(checkins, 'rating_score'),
        function (d) {
            return d;
        }), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);

    //beer list
    this.beerList = getFavorites(checkins, ratings);
    this.maxCount = getRatingsMaxCount(ratings);

    //by day and hour
    this.byDay = getByDay(checkins, timezone);
    this.byHour = getByHour(checkins, timezone);
    this.maxValsForWhen = {
        matrix: _.max(_.map(this.byHour, function (hour) {
                return _.max(hour.byDay);
            })),
        day : _.max(_.pluck(this.byDay, 'total')),
        hour: _.max(_.pluck(this.byHour, 'total'))
    };

    //by venue
    var locations = getLocationList(checkins);
    this.locationList = locations;
    this.venues = getVenueList(checkins, locations);
    var unit = moment(today, 'YYYYMMDD')
        .diff(moment(since, 'YYYYMMDD'), 'month') > 3 ?
        'month' :
        'week';
    this.venueByTime = getVenueByTime(checkins, unit, timezone);
    this.venueByTimeUnit = unit;

    //for Match
    this.allBeers = getAllBeers(checkins);
};

module.exports = User;