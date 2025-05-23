const axios   = require('axios');
const cheerio = require('cheerio');
// const fetch   = require('node-fetch'); // or global fetch in Node>=18
const { prayerSourceUrl, latitude, longitude } = require('../config');

module.exports.getTimings = async () => {
    const { data: html } = await axios.get(prayerSourceUrl);
  
    const now = new Date();
    const month = now.getMonth() + 1;
    const date  = now.getDate();
  
    let fajar = "", asar = "", isha = "";
  
    switch (month) {
      case 1:
        if (date <= 15) {
          fajar = "6:20am"; asar = "4:00pm"; isha = "7:15pm";
        } else {
          fajar = "6:20am"; asar = "4:15pm"; isha = "7:15pm";
        }
        break;
      case 2:
        if (date <= 15) {
          fajar = "6:10am"; asar = "4:30pm"; isha = "7:30pm";
        } else {
          fajar = "6:00am"; asar = "4:45pm"; isha = "7:45pm";
        }
        break;
      case 3:
        if (date <= 15) {
          fajar = "5:40am"; asar = "4:45pm"; isha = "8:00pm";
        } else {
          fajar = "5:20am"; asar = "5:00pm"; isha = "8:00pm";
        }
        break;
      case 4:
        if (date <= 15) {
          fajar = "5:00am"; asar = "5:00pm"; isha = "8:15pm";
        } else {
          fajar = "4:40am"; asar = "5:15pm"; isha = "8:30pm";
        }
        break;
      case 5:
        if (date <= 15) {
          fajar = "4:30am"; asar = "5:15pm"; isha = "8:45pm";
        } else {
          fajar = "4:20am"; asar = "5:15pm"; isha = "9:00pm";
        }
        break;
      case 6:
        fajar = "4:20am"; asar = "5:30pm"; isha = "9:15pm";
        break;
      case 7:
        if (date <= 15) {
          fajar = "4:30am"; asar = "5:30pm"; isha = "9:15pm";
        } else {
          fajar = "4:30am"; asar = "5:30pm"; isha = "9:00pm";
        }
        break;
      case 8:
        if (date <= 15) {
          fajar = "4:40am"; asar = "5:15pm"; isha = "9:00pm";
        } else {
          fajar = "4:50am"; asar = "5:15pm"; isha = "8:30pm";
        }
        break;
      case 9:
        if (date <= 15) {
          fajar = "5:00am"; asar = "5:00pm"; isha = "8:15pm";
        } else {
          fajar = "5:10am"; asar = "4:45pm"; isha = "7:45pm";
        }
        break;
      case 10:
        if (date <= 15) {
          fajar = "5:20am"; asar = "4:30pm"; isha = "7:30pm";
        } else {
          fajar = "5:30am"; asar = "4:15pm"; isha = "7:15pm";
        }
        break;
      case 11:
        if (date <= 15) {
          fajar = "5:40am"; asar = "4:00pm"; isha = "7:00pm";
        } else {
          fajar = "6:00am"; asar = "3:45pm"; isha = "7:00pm";
        }
        break;
      case 12:
        if (date <= 15) {
          fajar = "6:10am"; asar = "3:45pm"; isha = "7:00pm";
        } else {
          fajar = "6:20am"; asar = "4:00pm"; isha = "7:00pm";
        }
        break;
      default:
        throw new Error(`Unexpected month: ${month}`);
    }
  
    // Fetch sunrise & sunset
    const isoDate = now.toISOString().split("T")[0];
    const url     = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${isoDate}&formatted=0`;
    const resp    = await fetch(url);
    const json    = await resp.json();
    console.log(url)
    // convert and bump maghrib by 1 minute
    function formatFromUTCString(isoString, offsetHours = 0, addMinutes = 0) {
      const utcMs   = Date.parse(isoString);
      const localMs = utcMs + offsetHours * 3600e3 + addMinutes * 60e3;
      const d       = new Date(localMs);
      let h = d.getUTCHours();
      let m = d.getUTCMinutes();
      const ampm = h >= 12 ? 'pm' : 'am';
      const h12  = ((h + 11) % 12) + 1;
      return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
    }
    const sunrise = formatFromUTCString(json.results.sunrise, 5);
    const maghrib = formatFromUTCString(json.results.sunset, 5, 1);

    const jumma = "1:30pm"
    const $ = cheerio.load(html);
    let zuhr ;
    $('.row.schedule-item').each((i, el) => {
      const label = $(el).find('time').text().trim();
      if (label === 'Zuhr') {
        zuhr = $(el).find('.col-md-10 h4').text().trim();
        return false; // stop loop early
      }
    });
    // console.log($("time:contains('zuhr')").parent().find('h4').text())
    return { fajar,zuhr, asar, isha, maghrib, sunrise, jumma };
};