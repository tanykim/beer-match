define(['jquery', 'momentTZ', 'underscore'], function ($, moment, _) {

	var match = function (dataset) {
		var d1 = dataset[0];
		var d2 = dataset[1];

		this.url = d1.userinfo.userId + '+' + d2.userinfo.userId;	
	};

	return match;
});