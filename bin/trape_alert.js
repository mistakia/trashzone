/************************************************************************
 * This example shows how to use the ImageService API to upload images
 * to GroupMe.
 *
 * It also demonstrates using EventEmitters to turn callback-based APIs
 * into event-based APIs.
 ***********************************************************************/


var fs           = require('fs');
var path         = require('path');
var EventEmitter = require('events').EventEmitter
var assert       = require('assert');

var ImageService = require('groupme').ImageService;
var API          = require('groupme').Stateless;

if (process.argv.length < 4) {
    console.log("Usage: node HelloWorld.js ACCESS_TOKEN IMAGE [GROUP_ID]");
    process.exit(1);
} 
var ACCESS_TOKEN = process.argv[2];
var IMAGE_PATH   = process.argv[3];
var BOT_ID = process.argv[4];
var MESSAGE = process.argv[5];

/************************************************************************
 * Here we show an example of uploading an image
 * and providing an EventEmitter interface to the process.
 ***********************************************************************/

var uploadImageEvented = function(eventEmitter, path) {

  ImageService.post(
      path, 
      function(err,ret) {
        if (err) {
          eventEmitter.emit('error', err);
        } else {
          eventEmitter.emit('success', ret);
        }
      });

  eventEmitter.emit('start');

  return eventEmitter;

}

/************************************************************************
 * Helper function for posting a picture message
 ***********************************************************************/

var postImageAsBot = function(eventEmitter, access_token, bot_id, picture_url, message) {

  API.Bots.post(
    access_token,
    bot_id,
    message,
    {picture_url:picture_url},
    function(err,ret) {
      if (err) {
        eventEmitter.emit('error', err);
      } else {
        eventEmitter.emit('success', ret);
      }
    });

  eventEmitter.emit('start');

  return eventEmitter;

}


/************************************************************************
 * The logic of this example built around EventEmitters
 ***********************************************************************/

var errorFunc = function(err) {
  console.log(err);
  process.exit(1);
}


var uploader = new EventEmitter();
var botter   = new EventEmitter();
var poster   = new EventEmitter();


uploader.on('error', errorFunc);
poster.on('error', errorFunc);
botter.on('error', errorFunc);

var picture_url;
uploader.on('success', function(data) {
  console.log("Successfully uploaded image:", data);
  assert(data.picture_url);
  picture_url = data.picture_url;

  if (process.argv.length == 6) {
    //Start the Message Post
    postImageAsBot(poster, ACCESS_TOKEN, BOT_ID, picture_url, MESSAGE)
  }

});

poster.on('success', function(ret) {
  console.log("Successfully posted picture message using bot!", ret);

});

//Start the Image Upload
uploadImageEvented(uploader, IMAGE_PATH);
