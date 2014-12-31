var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment');

var timeConvert = {
	timezoned: function (t, timezone) {
		//SHOULD FIX TIMEZONE
		var momentT = moment(t, 'ddd, DD MMM YYYY HH:mm:ssZ');
		// return momentT.tz(timezone);
		return momentT;
	},
	userinfo: function (t) {
		return moment(t).format('MMM D, YYYY');
	},
	//FIXME: to string
	range: function(t) {
		return [moment(t), moment()];
	},
	dayId: function(t) {
		var week = t.year() + '-' + t.week();
		if (t.weeks() === 1 && t.month() === 0) {
			week = t.year() - 1 + '-' + moment(t.year()-1, 'YYYY').weeksInYear();
		} else if (t.weeks() === 1 && t.month() === 11) {
			week = t.year() + '-' + moment(t.year(), 'YYYY').weeksInYear();
		}
		return {
			day: t.format('YYYYMMDD'),
			week: week,
			month: t.year() + '-' + t.month()
		};
	}
};

function getCountByPeriod(checkins, timezone, timeRange) {

	function getByUnit(unit) {
		return _.countBy(_.pluck(checkins, 'created_at'), function (d) {
			var timezoned = timeConvert.timezoned(d, timezone);
			var dayId = timeConvert.dayId(timezoned);
			return dayId[unit];
		});
	}

	var byWeek = getByUnit('week');
	var byMonth = getByUnit('month');
	var byDay = getByUnit('day');

	var daysCount = Math.ceil(timeRange[1].diff(timeRange[0], 'days', true)) + 1;

	//fill 0 if no check in
	var byDayFull = _.object(_.map(_.range(daysCount), function (i) {
		var day = timeRange[0].clone().add(i, 'days');
		var dayId = timeConvert.dayId(moment(day));
		var dayFormatted = day.format('YYYYMMDD');
		// if (dayFormatted === '20101231' || dayFormatted === '20110101') {
		// 	console.log(dayId);
		// }
		var count = { day: 0, week: 0, month: 0 };
		if (!_.isUndefined(byDay[dayFormatted])) {
			count.day = byDay[dayFormatted];
		}
		if (!_.isUndefined(byWeek[dayId.week])) {
			count.week = byWeek[dayId.week];
		}
		if (!_.isUndefined(byMonth[dayId.month])) {
			count.month = byMonth[dayId.month];
		}
		return [dayFormatted, count];
	}));

	var maxCount = {
		day: _.max(byDay),
		week: _.max(byWeek),
		month: _.max(byMonth)
	};

	var frequency = _.map([byDay, byWeek, byMonth], function (unit) {

		//max 10 slots, include last dummy slot
		var maxCount = _.max(unit);
		var gap = Math.ceil(Math.ceil(maxCount / 10) * 10 / 10);
		if (gap === 0) {
			gap = 1;
		}
		var slots = Math.ceil(maxCount/gap);
		var lastSlot = slots * gap;
		if (lastSlot === maxCount) {
			slots = slots + 2;
		} else {
			slots = slots + 1;
		}

		var list = _.countBy(_.values(unit), function (d) {
			return Math.floor(d / gap) * gap;
		});

		var arr = _.map(_.range(slots), function (i) {
			return [ gap * i , _.isUndefined(list[gap * i]) ? 0 : list[gap * i]];
		});

		return _.object(arr);
	});

	return {
		list: byDayFull,
		maxCount: maxCount,
		frequency: { day: frequency[0], week: frequency[1], month: frequency[2] }
	};
}

function getScoreAvg(checkins) {
	return Math.round(_.reduce(_.pluck(checkins, 'rating_score'), function (memo, num) {
			return memo + num;
		}, 0) / checkins.length * 100) / 100;
}

function getRatings(checkins) {

	var maxCount = {};

	function getGroupedRatingList(obj, key) {
		var allList = _.map(_.groupBy(_.map(checkins, function (d) {
				var subObj;
				if (obj === 'beer') {
					subObj = 'beer_' + key;
				} else {
					subObj = key + '_name';
				}
				return { key: d[obj][subObj], rating_score: d.rating_score, beerId: d.beer.bid };
			}), function (d) {
				if (key === 'abv') {
					if (+d.key >= 10) {
						return '0' + Math.floor(+d.key);
					}
					else {
						return '00' + Math.floor(+d.key);
					}
				} else {
					return d.key;
				}
			}), function (arr, i) {
				return {
						name: i,
						count: arr.length,
					 	rating: getScoreAvg(arr),
					 	//number of distinctive beers
					 	beers: _.size(_.unique(_.pluck(arr, 'beerId')))
					};
			});

		//make a list with less than 50 elements in the list
		function getFilteredCount (count) {
			return _.filter(allList, function (d) {
				return d.count > count;
			});
		};
		maxCount[key] = _.max(_.pluck(allList, 'count'));
		if (_.size(allList) > 50) {
			for (var i = 1; i < maxCount[key]; i++) {
				var filtered = getFilteredCount(i);
				if (_.size(filtered) < 50) {
					allList = filtered;
					break;
				}
			}
		}

		function sortList(by) {
			var sorted = _.sortBy(allList, function (d) {
				return d[by];
			});
			if (by !== 'name') {
				sorted.reverse();
			}
			var acc = 0;
			return _.object(_.map(sorted, function (d, i) {
				var arr = [ d.name, { order: i, accCount: acc }];
				acc = acc + d.count;
				return arr;
			}));
		}
		var sortedVal = _.object(_.map(['rating', 'count', 'name'], function (by) {
			return [by, sortList(by)];
		}));

		var combined = _.map(allList, function (d) {
			var byName = key === 'abv' ? parseInt(d.name) + '.X %' : d.name;
			return {
				name: byName,
				count: d.count,
			 	rating: d.rating,
			 	beers: d.beers,
			 	order: {
			 		rating: sortedVal.rating[d.name].order,
			 		count: sortedVal.count[d.name].order,
			 		name: sortedVal.name[d.name].order
			 	},
			 	accCount: {
			 		rating: sortedVal.rating[d.name].accCount, //not used
			 		count: sortedVal.count[d.name].accCount,
			 		name: sortedVal.name[d.name].accCount //not used
			 	}
			};
		});

		return combined;
	}

	var style = getGroupedRatingList('beer', 'style');
	var abv = getGroupedRatingList('beer', 'abv');
	var brewery = getGroupedRatingList('brewery', 'brewery');
	var country = getGroupedRatingList('brewery', 'country');

	var list = {
		style: style,
		abv: abv,
		brewery: brewery,
		country: country
	};

	return { maxCount: maxCount, list: list };
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
			order = ratingsObj[0].order.count;
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

	var list = _.map(_.groupBy(_.filter(checkins, function (d) {
			return d.rating_score === score && !_.contains(lastScoreIds, d.beer.bid);
		}), function (d) {
			return d.beer.bid;
		}), function (d) {
			var categories = getCategoriesVals(d[0], ratings);
			return {
				bid: d[0].beer.bid,
				count: getBeerCount(d[0].beer.bid),
				label: d[0].beer.beer_label,
				name: d[0].beer.beer_name,
				categories: categories,
				score: score
			};
		});
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
				timeConvert.timezoned(d.created_at, timezone).day(),
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
		return { day: moment(i, 'd').format('dddd'), total: d.length, venue: publicVenue.length };
	});
}

function getByHour(checkins, timezone) {
	return _.object(_.map(_.groupBy(_.map(checkins, function (d) {
			return {
				day: timeConvert.timezoned(d.created_at, timezone).day(),
				hour: timeConvert.timezoned(d.created_at, timezone).hour()
			};
		}), function (d) {
			return d.hour;
		}), function (d, i) {
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

function getLocationList(checkins) {

	return _.sortBy(_.map(_.countBy(_.compact(_.map(checkins, function (d) {
			if (d.venue.location) {
				return { points: d.venue.location.lat + ':' + d.venue.location.lng };
			}
		})), function (d) {
			return d.points;
		}), function (d, key) {
			var lanLng = key.split(':');
			return { latitude: lanLng[0], longitude: lanLng[1], value: d};
		}), function (d) {
			return d.value;
		}).reverse();
}

function getVenueList(checkins) {

	function getCityName(loc) {
		var city = '';
		if (loc) {
			if (loc.venue_city) {
				city = loc.venue_city +
				(loc.venue_state ? ', ' + loc.venue_state : '') +
				(loc.venue_country ? ', ' + loc.venue_country : '');
			}
		}
		return city;
	}

	var venueTypesArr = _.sortBy(_.map(_.omit(_.groupBy(checkins, function (d) {
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
		}), 'undefined'), function (d, key) {
			return [key,
				d.length,
				d[0].venue.venue_icon.sm
			];
		}), function (arr) {
			return arr[1];
		//top 10 locations
		}).reverse().slice(0, 10);

	var venueTypes = _.object(_.map(venueTypesArr, function (d, i) {
		return [d[0], { count: d[1], icon: d[2], id: i }];
	}));

	var venueCitiesArr = _.sortBy(_.map(_.omit(_.groupBy(checkins, function (d) {
			return getCityName(d.venue.location);
		}), ''), function (d, key) {
			var venuesCount = _.size(_.unique(_.map(d, function (d) {
					return d.venue.venue_id;
				})));
			return [key,
				d.length,
				venuesCount
			];
		}), function (arr) {
			return arr[1];
		}).reverse().slice(0, 10);

	var venueCities = _.object(_.map(venueCitiesArr, function (d, i) {
		return [d[0], { count: d[1], venuesCount: d[2], id: i}];
	}));

	var venueNames = _.sortBy(_.map(_.omit(_.groupBy(checkins, function (d) {
			if (d.venue.venue_name) {
				return d.venue.venue_name;
			}
		}), 'undefined'), function (d) {
			var primary = _.filter(d[0].venue.categories.items, function (d) {
				return d.is_primary;
			});
			var type = '';
			if (!_.isEmpty(primary)) {
				type = primary[0].category_name;
			}
			var city = getCityName(d[0].venue.location);
			var scoreAvg = getScoreAvg(d);
			return {
					id: d[0].venue.venue_id,
					name: d[0].venue.venue_name,
					count: d.length,
					lat: d[0].venue.location.lat,
					lng: d[0].venue.location.lng,
					score: scoreAvg,
					type: type,
					city: city,
					typeId: venueTypes[type] ? venueTypes[type].id : undefined,
					cityId: venueCities[city] ? venueCities[city].id : undefined
				};
		}), function (d) {
			return d.count;
		}).reverse().slice(0, 10);

	return {
		name: venueNames,
		type: venueTypes,
		city: venueCities
	};
}

var User = function (userinfo, timezone, checkins) {

	var timezoned = timeConvert.timezoned(userinfo.since, timezone);
	var since = timeConvert.userinfo(timezoned);

	//---from user info
	this.userinfo = userinfo;

	//--count
	var checkinCount = userinfo.checkinCount;
	var avgCount = _.map(['days', 'weeks', 'months'], function (unit) {
		var count = moment().diff(moment(since, 'MMM d, YYYY'), unit, true);
		return Math.round(checkinCount / count * 10) / 10;
	});
	var avgUnit = 'week';
	if (avgCount[1] < 1) {
		avgUnit = 'month';
	} else if (avgCount[1] > 20) {
		avgUnit = 'day';
	}
	this.checkinCount = checkinCount;
	this.avgCount = { day: avgCount[0], week: avgCount[1], month: avgCount[2] };
	this.avgUnit = avgUnit;
	this.timeRange = timeConvert.range(timezoned);
	this.countByPeriod = getCountByPeriod(checkins, timezone, this.timeRange);

	//ratings
	this.scoreAvg = getScoreAvg(checkins);
	var ratings = getRatings(checkins);
	this.ratingsList = ratings.list;
	this.maxCount = ratings.maxCount;

	//beer list
	this.beerList = getFavorites(checkins, this.ratingsList);
	this.scoreCount = _.countBy(_.pluck(checkins, 'rating_score'), function (d) {
			return d;
		});

	//by day and hour
	this.byDay = getByDay(checkins, timezone);
	this.byHour = getByHour(checkins, timezone);

	//by venue
	this.locationList = getLocationList(checkins);
	this.venues = getVenueList(checkins);
};

module.exports = User;