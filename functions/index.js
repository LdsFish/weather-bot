'use strict';

const functions = require('firebase-functions');
const fs = require('fs');
const tw = require('taiwan-weather');

exports.helloHttp = functions.https.onRequest((request, response) => {

  // Get the city and date from the request
  let city = request.body.queryResult.parameters['taiwan-city'];
  const key = "";

  // Get the date for the weather forecast (if present)
  let date = '';
  if (request.body.queryResult.parameters['date-time']) {
    date = request.body.queryResult.parameters['date-time'];
  }

  tw.getStream(key, (err, stream) => {
    console.log("stream", stream);
  });

  // response.json({ fulfillmentText: 'This is a sample response from your webhook!' });
  let message = "This is a sample response from your webhook!"; //Default response from the webhook to show it’s working
  let responseObj = {
    "fulfillmentText": message,
    "fulfillmentMessages": [{
      "text": {
        "text": [
          "Hello I m Responding to intent"
        ]
      }
    }],
    "source": ""
  }
  return response.json(responseObj);
});