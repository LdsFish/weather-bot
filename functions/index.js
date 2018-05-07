

const functions = require('firebase-functions');
const https = require('https');
const xml2js = require('xml2js');

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
      return { name: discribe, value };
    });
    timeSlot = timeElements.map(element => new Date(Date.parse(element.startTime[0])));
    payload.name = name;
    payload.data = timeElementDict;
    return payload;
  });
  return { data, time: timeSlot };
}

function responseObj(message) {
  return {
    fulfillmentMessages: [{
      text: {
        text: [message],
      },
    }],
    source: '',
  };
}

function generateCityMessage(data, city) {
  const weatherNow = data.data.find(d => d.name === city).data[0];
  const str = `${city}現在的氣溫是 ${weatherNow.value} 度，${weatherNow.name}`;
  return responseObj(str);
}

// function generateCityAndDataMessage(data, city, date) {
//   const timeSlot = data.time;
//   console.log(timeSlot, date);
//   // if (date < timeSlot[0])
//   const weatherNow = data.data.find(d => d.name === city).data[0];
//   const str = `${city  }現在的氣溫是 ${  weatherNow.value  } 度，${  weatherNow.name}`;
//   return responseObj(str);
// }

exports.helloHttp = functions.https.onRequest((request, response) => {
  // Get the city and date from the request
  const city = request.body.queryResult.parameters['taiwan-city'];
  const key = '';
  const parser = new xml2js.Parser();

  // Get the date for the weather forecast (if present)
  // let hasDate = false;
  // if (request.body.queryResult.parameters['date-time']) {
  //   // const inputDate = request.body.queryResult.parameters['date-time'];
  //   // date = new Date(Date.parse(JSON.parse(inputDate)[0]));
  //   hasDate = true;
  // }

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
          responseMessage = response.json(responseObj('糟糕，出錯了'));
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
      return response.json(responseObj('糟糕，我無法回答你'));
    });
  });
});
