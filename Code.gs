function cache(input) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(input);
  if (cached != null) {
    return cached;
  }
  var response = UrlFetchApp.fetch(input); // takes 20 seconds
  var contents = response.getContentText();
  console.log(input);
  try {
    cache.put(input, contents, 1500); // cache for 25 minutes
  } catch (error) {
    console.error(error);
  }
  return contents;
}

function COUNTSYLLABLES(word) {
  // https://stackoverflow.com/questions/5686483/how-to-compute-number-of-syllables-in-a-word-in-javascript
  word = word.toLowerCase();
  if (word.length <= 3) { return 1; }
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  if (word.match(/[aeiouy]{1,2}/g) == null) { return 1; }
  var count = word.match(/[aeiouy]{1,2}/g).length;
  return count;
}

function CANONIFETCH(input = "https://ubuntu.com/pro", tag = "all") {
  var html = cache(input);
  // remove footer
  html = html.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  html = html.replace(/<br>/g, '');

  pTags = html.match(/<p>.*?<\/p>/g);
  hTags = html.match(/<h[1-6]>.*?<\/h[1-6]>/g);
  liTags = html.match(/<li>.*?<\/li>/g);

  allTags = pTags.concat(hTags, liTags);

  // filter null and empty
  allTags = allTags.filter(function (el) {
    return el != null && el != "";
  });

  for (var i = 0; i < allTags.length; i++) {
    allTags[i] = allTags[i].replace(/<.*?>/g, '');

    // remove &nbsp; and &rsaquo; from the string
    allTags[i] = allTags[i].replace(/&nbsp;/g, ' ').replace(/&rsaquo;/g, '');
  }

  // filter null and empty
  allTags = allTags.filter(function (el) {
    return el != null && el != "";
  });

  console.log(allTags);
  return allTags;
}

function CANONIFETCHSINGLE(input, tag = "all") {
  var allTags = CANONIFETCH(input, tag);
  allTags = allTags.join('. ');
  return allTags;
}

function READINGGRADELEVEL(input) {
  var allTags = CANONIFETCH(input);

  // count sentences
  var sentences = [];

  for (var i = 0; i < allTags.length; i++) {
    // break the string into sentences
    var sentence_array = allTags[i].split('. ');
    // add sentences to array of sentences
    for (var j = 0; j < sentence_array.length; j++) {
      // if not null or empty
      if (sentence_array[j] != null && sentence_array[j] != "") {
        sentences.push(sentence_array[j]);
      }
    }
  }

  var sentence_count = sentences.length;
  console.log("Sentences: " + sentence_count);

  // count words
  var word_count = 0;

  for (var i = 0; i < allTags.length; i++) {
    // break the string into words
    var words = allTags[i].split(' ');
    // add words to total count
    word_count += words.length;
  }

  console.log("Words: " + word_count);

  // count syllables
  var syllable_count = 0;

  for (var i = 0; i < allTags.length; i++) {
    // break the string into words
    var words = allTags[i].split(' ');
    // count syllables for each word and add to total count
    for (var j = 0; j < words.length; j++) {
      // ignore if contains numbers
      if (words[j].match(/\d+/)) {
        continue;
      }
      syllable_count += COUNTSYLLABLES(words[j]);
    }
  }
  console.log("Syllables: " + syllable_count);

  // calculate reading level
  var reading_level = 0.39 * (word_count / sentence_count) + 11.8 * (syllable_count / word_count) - 15.59;
  console.log("Reading Level: " + reading_level);

  return reading_level;
}

function ACCESSIBILITY(input = "https://ubuntu.com/pro") {
  var url = encodeURIComponent(input);
  var api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + url + "&category=ACCESSIBILITY";

  var cache = CacheService.getScriptCache();
  var cacheKey = "accessibility-" + api;
  var cached = cache.get(cacheKey);
  if (cached != null) {
    console.log("From cache: " + cached)
    return parseFloat(cached);
  } else {
    var response = UrlFetchApp.fetch(api); // takes 20 seconds
    var contents = response.getContentText();
    var data = JSON.parse(contents);

    // get accessibility response
    var accessibility = data.lighthouseresponse.categories.accessibility.score;
    console.log("Accessibility score: " + accessibility);
    cache.put(cacheKey, accessibility, 1500); // cache for 25 minutes
    console.log("Put into cache");
    return accessibility;
  }
}

function GITHUBTEMPLATE(input = "https://ubuntu.com/pro") {
  // remove protocol by detecting //
  var domain = input.split('//')[1].split('/')[0];
  console.log("Domain: " + domain);

  // get everything past the domain
  var path = input.split(domain)[1];
  console.log("Path: " + path);

  // append /index.html if second level
  if (path.split('/').length < 3) {
    path += "/index";
  }

  path = path + ".html";
  console.log("Tweaked path: " + path);

  // https://github.com/canonical/ubuntu.com/blob/main/templates/pro/index.html
  var github_url = "https://github.com/canonical/" + domain + "/blob/main/templates" + path;
  console.log("GitHub URL: " + github_url);
  return github_url;
}

function GITHUBLASTUPDATED(input = "https://ubuntu.com/pro") {
  // remove protocol by detecting //
  var domain = input.split('//')[1].split('/')[0];
  console.log("Domain: " + domain);

  // get everything past the domain
  var path = input.split(domain)[1];
  console.log("Path: " + path);

  // append /index.html if second level
  if (path.split('/').length < 3) {
    path += "/index";
  }

  path = path + ".html";
  console.log("Tweaked path: " + path);

  var api = "https://api.github.com/repos/canonical/" + domain + "/commits?path=templates" + path;

  var cache = CacheService.getScriptCache();
  var cacheKey = "githublastupdated-" + api;
  var cached = cache.get(cacheKey);
  if (cached != null) {
    console.log("From cache: " + cached)
    return cached;
  } else {
    var response = UrlFetchApp.fetch(api); // takes 20 seconds
    var contents = response.getContentText();
    var data = JSON.parse(contents);

    // get accessibility response
    var last_updated = data[0].commit.author.date;
    console.log("Last updated: " + last_updated);
    cache.put(cacheKey, last_updated, 1500); // cache for 25 minutes
    console.log("Put into cache");
    return last_updated;
  }
}

// https://developers.google.com/drive/activity/v2/quickstart/apps-script
function GOOGLEDOCLASTUPDATED(input = "https://docs.google.com/document/d/1XidZq045nJDM5vzfB5KJCpH3AqOERvPOeayuqUKfNso/edit") {
  // check domain is docs.google.com
  if (input
    .split('//')[1]
    .split('/')[0] != "docs.google.com") {
    return;
  }

  // get document id
  var id = input.split('/')[5];
  console.log("ID: " + id);

  const request = {
    "itemName": "items/" + id,
    "pageSize": 1
  };

  var timeStamp = "";

  // Activity.query method is used Query past activity in Google Drive.
  const response = DriveActivity.Activity.query(request);
  const activities = response.activities;
  if (!activities || activities.length === 0) {
    console.log('No activity.');
    return;
  }
  console.log('Recent activity:');
  for (const activity of activities) {
    // get time information of activity.
    const time = getTimeInfo(activity);
    // get the action details/information
    const action = getActionInfo(activity.primaryActionDetail);
    // get the actor's details of activity
    const actors = activity.actors.map(getActorInfo);
    // get target information of activity.
    const targets = activity.targets.map(getTargetInfo);
    // print the time,actor,action and targets of drive activity.
    console.log('%s: %s, %s, %s', time, actors, action, targets);
    timeStamp = time;
    break;
  }

  console.log(timeStamp);
  return timeStamp;
}

/**
 * @param {object} object
 * @return {string}  Returns the name of a set property in an object, or else "unknown".
 */
function getOneOf(object) {
  for (const key in object) {
    return key;
  }
  return 'unknown';
}

/**
 * @param {object} activity Activity object.
 * @return {string} Returns a time associated with an activity.
 */
function getTimeInfo(activity) {
  if ('timestamp' in activity) {
    return activity.timestamp;
  }
  if ('timeRange' in activity) {
    return activity.timeRange.endTime;
  }
  return 'unknown';
}

/**
 * @param {object} actionDetail The primary action details of the activity.
 * @return {string} Returns the type of action.
 */
function getActionInfo(actionDetail) {
  return getOneOf(actionDetail);
}

/**
 * @param {object} user The User object.
 * @return {string}  Returns user information, or the type of user if not a known user.
 */
function getUserInfo(user) {
  if ('knownUser' in user) {
    const knownUser = user.knownUser;
    const isMe = knownUser.isCurrentUser || false;
    return isMe ? 'people/me' : knownUser.personName;
  }
  return getOneOf(user);
}

/**
 * @param {object} actor The Actor object.
 * @return {string} Returns actor information, or the type of actor if not a user.
 */
function getActorInfo(actor) {
  if ('user' in actor) {
    return getUserInfo(actor.user);
  }
  return getOneOf(actor);
}

/**
 * @param {object} target The Target object.
 * @return {string} Returns the type of a target and an associated title.
 */
function getTargetInfo(target) {
  if ('driveItem' in target) {
    const title = target.driveItem.title || 'unknown';
    return 'driveItem:"' + title + '"';
  }
  if ('drive' in target) {
    const title = target.drive.title || 'unknown';
    return 'drive:"' + title + '"';
  }
  if ('fileComment' in target) {
    const parent = target.fileComment.parent || {};
    const title = parent.title || 'unknown';
    return 'fileComment:"' + title + '"';
  }
  return getOneOf(target) + ':unknown';
}

// check if URL in yaml
function URLINMEGANAV(input = "https://canonical.com/lxd") {
  // fetch yaml
  var yamlUrl = "https://raw.githubusercontent.com/canonical/ubuntu.com/7caf93db8844cc3256d85067943f88ed3f5d68b7/meganav.yaml"
  var yaml = cache(yamlUrl);
  // split by new line
  var yamlArray = yaml.split('\n');
  // rows contain "url:"
  var rows = [];
  for (var i = 0; i < yamlArray.length; i++) {
    if (yamlArray[i].includes("url: ")) {
      // clean and show only url
      yamlArray[i] = yamlArray[i].split('url: ')[1];
      // remove "https://ubuntu.com" from the input if it has it
      if (input.includes("https://ubuntu.com")) {
        input = input.split('https://ubuntu.com')[1];
      }
      rows.push(yamlArray[i]);
      console.log(yamlArray[i]);
    }
  }

  // check if input is in the rows
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].includes(input)) {
      console.log("FOUND: " + input);
      return true;
    }
  }
  return false;
}