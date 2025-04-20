require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');


const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://LUMScape:diddyparty16!@lumscape.md59v.mongodb.net";
const PRAYER_COLLECTION = 'prayerTimings';
const PRAYER_SOURCE_URL = 'https://lrs.lums.edu.pk/namazTimings.html';

const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectToDb() {
  if (!db) {
    try {
      await client.connect();
      db = client.db('LUMScapeDB');
      console.log("Connected to MongoDB!");
    } catch (err) {
      console.error("Database connection error:", err);
      process.exit(1);
    }
  }
}

app.use(express.json());

async function fetchCollection(req, res, collectionName) {
  await connectToDb();
  try {
    const data = await db.collection(collectionName).find({}).toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createDocument(req, res, collectionName) {
  await connectToDb();
  try {
    const result = await db.collection(collectionName).insertOne(req.body);
    res.status(201).json({ message: "Document created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getDocumentById(req, res, collectionName) {
  await connectToDb();
  try {
    const document = await db.collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
    document ? res.json(document) : res.status(404).json({ message: "Document not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateDocument(req, res, collectionName) {
  await connectToDb();
  try {
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    result.matchedCount
      ? res.json({ message: "Document updated" })
      : res.status(404).json({ message: "Document not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteDocument(req, res, collectionName) {
  await connectToDb();
  try {
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(req.params.id) });
    result.deletedCount
      ? res.json({ message: "Document deleted" })
      : res.status(404).json({ message: "Document not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// CRUD routes for all collections
['locations', 'eateries', 'events', 'offices', 'users'].forEach(collection => {
  app.get(`/${collection}`, (req, res) => fetchCollection(req, res, collection));
  app.post(`/${collection}`, (req, res) => createDocument(req, res, collection));
  app.get(`/${collection}/:id`, (req, res) => getDocumentById(req, res, collection));
  app.put(`/${collection}/:id`, (req, res) => updateDocument(req, res, collection));
  app.delete(`/${collection}/:id`, (req, res) => deleteDocument(req, res, collection));
});

// Signup route
app.post('/users/signup', async (req, res) => {
  await connectToDb();
  try {
    const { email, password, scope } = req.body;
    // console.log("Signup Request Body:", req.body);
    const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');
    // console.log(encryptedPassword);

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const result = await db.collection('users').insertOne({ email, password: encryptedPassword, scope });
    res.status(201).json({ message: "User created", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
app.post('/users/login', async (req, res) => {
  await connectToDb();
  try {
    const { email, password } = req.body;
    // console.log("Signup Request Body:", req.body);
    const encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');
    // console.log(encryptedPassword);


    const user = await db.collection('users').findOne({ email });
    if (user && user.password === encryptedPassword) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Function to fetch and parse prayer timings from the source
// at top of file, alongside your other requires
// if you're on Node <18 uncomment the next line and run `npm install node-fetch`
// const fetch = require('node‑fetch');

const LATITUDE = 31.469532529069962;   // LUMS Mosque latitude
const LONGITUDE = 74.40934493320935;   // LUMS Mosque longitude

async function fetchPrayerTimingsFromSource() {
  const { data: html } = await axios.get('https://lrs.lums.edu.pk/namazTimings.html');
  
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
  const url     = `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&date=${isoDate}&formatted=0`;
  const resp    = await fetch(url);
  const json    = await resp.json();

  // convert and bump maghrib by 1 minute
  const sunset = new Date(json.results.sunset);
  sunset.setMinutes(sunset.getMinutes() + 1);
  let maghrib = sunset.toLocaleTimeString("en-US", {
    hour12: true,
    hour:   "2-digit",
    minute: "2-digit"
  });

  let sunrise = new Date(json.results.sunrise).toLocaleTimeString("en-US", {
    hour12: true,
    hour:   "2-digit",
    minute: "2-digit"
  });
  sunrise=sunrise.split(" ")[0]+sunrise.split(" ")[1].toLowerCase()
  maghrib=maghrib.split(" ")[0]+maghrib.split(" ")[1].toLowerCase()
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
}


app.get('/prayerTimings', async (req, res) => {

  await connectToDb();
  const coll = db.collection(PRAYER_COLLECTION);
  let latest;
  try{
    latest = await coll.findOne({}, { sort: { updatedAt: -1 } });
  }
  catch(error){
    console.log("error fetching db");
    return res.err(501);
  }
  try {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    if (latest && now - latest.updatedAt < oneDay) {
      // Return cached data
      return res.json(latest.timings);
    }

    // Fetch fresh data
    const timings = await fetchPrayerTimingsFromSource();

    // Update DB (clear old or upsert)
    await coll.deleteMany({});
    await coll.insertOne({ timings, updatedAt: now });

    res.json(timings);
  } catch (error) {
    console.error('Error fetching prayer timings:', error);
    // Fallback: if cache exists, return it
    if (latest) {
      return res.json(latest.timings);
    }
    res.status(500).json({ error: error.message });
  }
});


// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;