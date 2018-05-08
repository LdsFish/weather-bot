const functions = require('firebase-functions');
const https = require('https');
const xml2js = require('xml2js');

const key = '';

function parseData(result) {
  let timeSlot = [];
  const dataset = result.cwbopendata.dataset[0].location;
  const data = dataset.map((location) => {
    const payload = {};
    const name = location.locationName[0];
    const timeElements = location.weatherElement[0].time;
    const timeElementDict = timeElements.map((element) => {
      const discribe = element.parameter[0].parameterName[0];
      const value = element.parameter[0].parameterValue[0];
      return { discribe, value };
    });
    timeSlot = timeElements.map(element => new Date(Date.parse(element.startTime[0])));
    payload.name = name;
    payload.data = timeElementDict;
    return payload;
  });
  return { data, time: timeSlot };
}

function getResponseObj(message) {
  return {
    fulfillmentMessages: [{
      text: {
        text: [message],
      },
    }],
    source: '',
  };
}

function generateCityMessage(obj, city) {
  const weatherNow = obj.data.find(d => d.name === city).data[0];
  const str = `${city}現在的氣溫是 ${weatherNow.value} 度，${weatherNow.discribe}`;
  return getResponseObj(str);
}


exports.helloHttp = functions.https.onRequest((request, response) => {
  // Get the city and date from the request
  const city = request.body.queryResult.parameters['taiwan-city'];
  const parser = new xml2js.Parser();

  // Get weather with cwb API and parse xml data to json
  https.get(`https://opendata.cwb.gov.tw/opendataapi?dataid=F-C0032-001&authorizationkey=${key}`, (res) => {
    let responsData = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      responsData += chunk;
    });
    res.on('end', () => {
      parser.parseString(responsData, (err, result) => {
        let responseMessage;
        if (err) {
          responseMessage = response.json(getResponseObj('糟糕，出錯了'));
          console.log(`Cannot parse string: ${err.message}`);
        } else {
          const data = parseData(result);
          responseMessage = response.json(generateCityMessage(data, city));
        }
        return responseMessage;
      });
    });
    res.on('error', (err) => {
      console.log(`Cannot get response: ${err.message}`);
      return response.json(getResponseObj('糟糕，出錯了'));
    });
  });
});
