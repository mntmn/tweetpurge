//
// THE ESCAPE FROM THE PLANET OF THE HELL WEBSITE
//
// 2018, mntmn. Public Domain.
//

var config = require("./config.js");
var fs = require("fs");

var Twit = require('twit');
var T = new Twit(config);

// download your tweet archive from twitter and extract it somewhere, then put the path here:
var datadir = "/path-to-your-exported-tweet-archive/data/js/tweets/";
var files = fs.readdirSync(datadir);

// persisted hash so you can resume in case of errors. create this file containing just: {}
var killed = JSON.parse(fs.readFileSync("./killed.json"));

var to_kill = [];

for (var i=0; i<files.length; i++) {
  var f = files[i];
  
  var year = parseInt(f.split("_")[0]);
  var month = parseInt(f.split("_")[1]);

  // optional date range
  //if (year<2014 || (year==2014 && month<6)) {
    console.log(f);

    var path = datadir+f;

    var json = new String(fs.readFileSync(path)).split("\n");
    json.splice(0,1);
    json = json.join("\n");

    var tweets = JSON.parse(json);

    console.log(tweets.map(function(tw){
      if (!killed[tw.id_str]) to_kill.push(tw.id_str);
      return tw.id_str;
    }));
  //}
}

function save_killed_list() {
  fs.writeFileSync("./killed.json",JSON.stringify(killed));
  console.log("wrote killed.json");
}

function exit_cleanly() {
  console.log("exiting.");
  save_killed_list();
  process.exit(0);
}

function kill_next() {
  if (to_kill.length) {
    console.log("kills to go: ",to_kill.length);
    tweet_id = to_kill.pop();
    console.log("killing: ",tweet_id);
    
    T.post('statuses/destroy/:id', {id: tweet_id}, function (err, data, response) {
      if (!err) {
        killed[tweet_id] = true;
        save_killed_list();
        setTimeout(kill_next, 10);
      } else {
        console.error(err, data);
        killed[tweet_id] = true;
        save_killed_list();
        setTimeout(kill_next, 10);

        // or, if things go really bad:
        //return exit_cleanly();
      }
    });
  } else {
    exit_cleanly();
  }
}

process.on('SIGTERM', function () {
  console.log("SIGTERM.");
  exit_cleanly();
});

to_kill = to_kill.reverse();

kill_next();
