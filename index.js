'use strict';

const Twit = require('twit');

// const dotenv = require('dotenv').config();
const config = require('./data/config.json');
const quotes = require('./data/quotes.json');

const InvestigatoryPowers = {

  bot : new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
  }),
  timeLastTweet: 0,
  timeLastRetweet : 0,
  skippedItems : 0,

  init() {
    this.render();
  },

  getFollowerIds() {

    // Get follower ids
    //
    InvestigatoryPowers.bot.get('followers/ids', { screen_name: config.screenName, stringify_ids: true },  function(err, data, response) {

      console.log('\n');
      console.log('-------- \n');
      console.log('> IPB TRACKING: ' + data.ids.length);
      console.log('> IPB OPEN: stream \n');

      InvestigatoryPowers.streamFilter(data);

    });

  },

  streamFilter(data) {

    let followerIds = data.ids;

    // Add @theresa_may, @Number10gov, @Snowden to start of follower id array
    //
    followerIds.unshift('747807250819981312', '14224719', '2916305152');

    // Open stream and watch for follower updates and tracked hashtags
    //
    const stream = this.bot.stream('statuses/filter', {
      follow: followerIds,
      track: config.trackHashTags
    });

    stream.on('tweet', function(tweet) {

      // May has lied again, exclude quotes + retweets
      //
      if (tweet.user.id_str === '747807250819981312' || tweet.user.id_str === '14224719') {

        if (!twitter.is_quote_status && !tweet.hasOwnProperty('retweeted_status')) {

          console.log('!!!!!!!! \n');
          console.log('> IPB FOUND: @theresa_may or @Number10gov');
          console.log('> > created_at: ' + tweet.created_at);
          console.log('> > screen_name: @' + tweet.user.screen_name);
          console.log('> > text: ' + tweet.text + '\n');

          InvestigatoryPowers.replyWithFreedom(tweet);

        }

      }

      // The hero has posted, exclude quotes + retweets
      //
      if (tweet.user.id_str === '2916305152' && !twitter.is_quote_status && !tweet.hasOwnProperty('retweeted_status')) {

        console.log('******** \n');
        console.log('> IPB FOUND: @Snowden');
        console.log('> > created_at: ' + tweet.created_at);
        console.log('> > screen_name: @' + tweet.user.screen_name);
        console.log('> > text: ' + tweet.text + '\n');

        InvestigatoryPowers.likeHeroTweet(tweet);

      }

      // Follower tweets a link, exclude quotes + retweets
      //
      if (followerIds.includes(tweet.user.id_str) && !twitter.is_quote_status && !tweet.hasOwnProperty('retweeted_status') && Object.keys(tweet.entities.urls).length !== 0) {

        if (tweet.entities.urls[0].hasOwnProperty('display_url')) {

          console.log('-------- \n');
          console.log('> IPB FILTER: follow');
          console.log('> > created_at: ' + tweet.created_at);
          console.log('> > screen_name: @' + tweet.user.screen_name);
          console.log('> > display_url: ' + tweet.entities.urls[0].display_url + '\n');

          InvestigatoryPowers.submitEvidence(tweet);

        }

      }

      // Search for tweets containing tracked hashtags and retweet, exclude @theresa_may, @Number10gov, @Snowden
      //
      if (tweet.user.id_str !== '747807250819981312' && tweet.user.id_str !== '14224719' && tweet.user.id_str !== '2916305152' && Object.keys(tweet.entities.hashtags).length !== 0) {

        let hashtags = tweet.entities.hashtags;

        for (let i = 0; i < hashtags.length; i++) {
          if (hashtags[i].text.toLowerCase() === 'ipbill' || hashtags[i].text.toLowerCase() === 'snooperscharter') {
            InvestigatoryPowers.retweetTrackedHashtags(tweet);
          }
        }

      }

      InvestigatoryPowers.skippedItems++;

    });

  },

  replyWithFreedom(tweet) {

    // Get random 1984 quote
    //
    let dontTreadOnMe = '@' + tweet.user.screen_name + ' ' + quotes.response[Math.floor(Math.random() * quotes.response.length)];

    InvestigatoryPowers.bot.post('statuses/update', { in_reply_to_status_id: tweet.id_str, status: dontTreadOnMe }, function(err, data, response) {

      if (!err) {

        console.log('-------- \n');
    		console.log('> IPB SUCCESS: reply');
        console.log('> > id_str: ' + tweet.id_str);
        console.log('> > > ' + dontTreadOnMe + '\n');

    	} else {

        console.log('-------- \n');
    		console.log('> IPB ERROR: reply');
        console.log('> > id_str: ' + tweet.id_str + '\n');
        console.log('> > > ' + dontTreadOnMe + '\n');

      }

    });

  },

  likeHeroTweet(tweet) {

    InvestigatoryPowers.bot.post('favorites/create', { id: tweet.id_str }, function(err, data, response) {

    	if (!err) {

        console.log('-------- \n');
    		console.log('> IPB SUCCESS: like');
        console.log('> > id_str: ' + tweet.id_str + '\n');

    	} else {

        console.log('-------- \n');
    		console.log('> IPB ERROR: like');
        console.log('> > id_str: ' + tweet.id_str + '\n');

      }

    });

  },

  submitEvidence(tweet) {

    let timeNow = +(new Date()),
    shouldRateLimit = timeNow < InvestigatoryPowers.timeLastTweet + config.rateLimitTweet;

    if (!shouldRateLimit && config.postToAccount) {

      let message = 'Attention @'+ config.replyToHandle +' the user @' + tweet.user.screen_name + ' has recently visited ' + tweet.entities.urls.display_url + '. Please update public records';

      InvestigatoryPowers.bot.post('statuses/update', { status: message }, function(err, data, response) {

        if (!err) {

          console.log('-------- \n');
      		console.log('> IPB SUCCESS: submit');
          console.log('> > id_str: ' + tweet.id_str + '\n');

          console.log('-------- \n');
          console.log('> IPB ITEMS SKIPPED: ' + InvestigatoryPowers.skippedItems + '\n');

          InvestigatoryPowers.skippedItems = 0;
          InvestigatoryPowers.timeLastTweet = timeNow;

      	} else {

          console.log('-------- \n');
      		console.log('> IPB ERROR: submit');
          console.log('> > id_str: ' + tweet.id_str + '\n');

        }

      });

    }

  },

  retweetTrackedHashtags(tweet) {

    let timeNow = +(new Date()),
    shouldRateLimit = timeNow < InvestigatoryPowers.timeLastRetweet + config.rateLimitRetweet;

    if (!shouldRateLimit && config.postToAccount) {

			InvestigatoryPowers.bot.post('statuses/retweet/:id', { id: tweet.id_str }, function(err, response) {

        if (!err) {

          console.log('-------- \n');
          console.log('> IPB SUCCESS: retweet');
          console.log('> > created_at: ' + tweet.created_at);
          console.log('> > screen_name: ' + tweet.user.screen_name);
          console.log('> > text: ' + tweet.text + '\n');

          console.log('-------- \n');
          console.log('> IPB ITEMS SKIPPED: ' + InvestigatoryPowers.skippedItems + '\n');

          InvestigatoryPowers.skippedItems = 0;
          InvestigatoryPowers.timeLastRetweet = timeNow;

				} else {

          console.log('-------- \n');
					console.log('> IPB ERROR: retweet');
          console.log('> > created_at: ' + tweet.created_at);
          console.log('> > screen_name: ' + tweet.user.screen_name);
          console.log('> > text: ' + tweet.text + '\n');

				}

      });

    }

  },

  render() {

    InvestigatoryPowers.getFollowerIds();

  }

}

InvestigatoryPowers.init();
