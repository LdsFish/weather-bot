let fs = require('fs');

function parseData(result){
  let timeSlot = [];
  const dataset = result.cwbopendata.dataset[0].location;
  const data = dataset.map( location => {
    const package = {};
    const name = location['locationName'][0];
    const timeElements = location['weatherElement'][0]['time'];
    const timeElementDict = timeElements.map( element => {
      const name = element.parameter[0].parameterName[0];
      const value = element.parameter[0].parameterValue[0];
      return { name, value }
    })
    timeSlot = timeElements.map( element => new Date(Date.parse(element.startTime[0])));
    package['name'] = name;
    package['data'] = timeElementDict;
    return package;
  });
  return {data, time: timeSlot}
}

let file = fs.readFileSync('sample.json', 'utf8');
let result = JSON.parse(file);
console.log(parseData(result));