define(['jquery'], function ($) {

	var settings = {

		//intro messages
		msg: {
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

	    //titles
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
        ],

        //colors
       	beerColors: [
       		'#e8dd21', '#ffc61e', '#f99b0c', '#d38235',
       		'#d86018', '#7c2529', '#643335', '#3f2021', '#25282a'
       	],
       	colors: {
       		style: '#ffc61e',
       		abv: '#d86018',
			brewery: '#7c2529',
			country: '#3f2021'
       	},
       	users: ['#cc0000', '#00cc00'],
       	getWidth: function (div) {
       		return $('.' + div).width();
       	}
    };

	return settings;
});