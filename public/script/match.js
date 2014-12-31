define(['jquery', 'momentTZ', 'underscore', 'beer'], function ($, moment, _, Beer) {

    /*test
    console.log('---test');
    // console.log(getDistance(3, 3, 0, 0));
    function getCos(v) {
        function getDistance(p1, p2) {
            var x1 = p1[0];
            var y1 = p1[1];
            var x2 = p2[0];
            var y2 = p2[1];
            return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        }
        var avgR = [3, 0];
        var lenA = getDistance(avgR, v);
        var lenB = getDistance(v, [0, 0]);
        var lenC = getDistance(avgR, [0, 0]);
        return (-1 * (lenA * lenA) + lenB * lenB + lenC * lenC) / (2 * lenB * lenC);
    }
    console.log(getCos([3, 0]));
    */
    
	var match = function (dataset) {

		var b1 = new Beer(dataset[0].userinfo, dataset[0].timezone, dataset[0].checkins);
		var b2 = new Beer(dataset[1].userinfo, dataset[1].timezone, dataset[1].checkins);

		this.url = dataset[0].userinfo.userId + '+' + dataset[1].userinfo.userId;	
	};

	return match;
});