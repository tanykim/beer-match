define(['moment'], function (moment) {

	var putScore = function (profile, score, list) {

		_.each(profile, function (d, i) {
			$('.js-match-score-name-' + i).html(d.username);
			$('.js-match-score-pic-' + i)
				.css('background', 'url("' + d.avatar + '")')
				.css('background-size', '60px 60px');
		});
		$('.js-match-score-number').html(score);
		_.each(list, function (d, key) {
			$('.js-match-score-' + key).html(d);
		});
	};

	return {
		putScore: putScore
	};
});
