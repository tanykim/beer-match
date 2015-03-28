var E = {

	//text for UI
    msgs: {
        intro: {
            init: 'Explore your beers and see a match with a friend! <br/> Enter your UNTAPPD user name',
            diffName: 'Try a different user name',
            userIdCheck: 'Checking user name...',
            tooShort: 'Should be at least 3 characters',
            friends: 'Or enter an Untapped user name',
            noFriends: 'No friends found, enter an UNTAPPD user name',
            back: 'Welcome back!'
        },
        share: {
            facebook: "https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fbeer.tany.kim",
            twitter: "https://twitter.com/intent/tweet?text=Check this cool visualization of beer! See your beer taste and the match with your friends at http%3A%2F%2Fbeer.tany.kim",
            google: "https://plus.google.com/share?url=http%3A%2F%2Fbeer.tany.com"
        },
        titles: {
            single: [
                'How much do I drink?',
                'What matters?',
                'Beers I love & hate',
                'When do I drink?',
                'Where do I drink?',
                'When & Where'
            ],
            match: [
                'Match scores',
                'Who drinks more?',
                'Beers (dis/)agreed',
                'Shared styles',
                'When do we drink?',
                'Where do we drink?'
            ]
        }
    },

    //categories
    categoryList: ['style', 'abv', 'brewery', 'country'],

    //colors
	beerColors: ['#e8dd21', '#ffc61e', '#f99b0c', '#d38235', '#d86018', '#7c2529', '#643335', '#3f2021', '#25282a'],
	colors: { style: '#ffc61e', abv: '#d86018',
			brewery: '#7c2529', country: '#3f2021'},
	users: ['#cc0000', '#00cc00'],

	//vis
	noTicks: { size: 0, padding: 9 },

	getAxisTicks: function (maxVal, len) {
		//gap: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
        var gap = Math.pow(10, maxVal.toString().length - 1);
        if (maxVal / gap < 2) {
            gap = gap / 5;
        } else if (maxVal / gap < 5) {
            gap = gap / 2;
        }
        var slicesCount = Math.ceil(maxVal / gap);

        return {
        	endPoint: slicesCount * gap,
        	count: len / slicesCount < 20 ? 5 : slicesCount
        }
	}
}