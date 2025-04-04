const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

const crosstablesFilePath = '../crosstable.csv'; // Change this to the actual crosstables CSV file path
const eventsFilePath = '../event.csv'; // Change this to the actual events CSV file path

// Command line argument or default CFC ID
const argCfcID = process.argv[2];
const cfcID = argCfcID || '167084';
const ratingHistoriesDir = '../rating_histories';
const ratingHistoryOutput = `${ratingHistoriesDir}/rating_history_${cfcID}.csv`;

// For processing multiple national masters
const nationalMastersInput = '../national_masters.csv';
let nationalMasterIds = [];
let processSinglePlayer = true;

// Create the rating histories directory if it doesn't exist
if (!fs.existsSync(ratingHistoriesDir)) {
  fs.mkdirSync(ratingHistoriesDir, { recursive: true });
  console.log(`Created directory: ${ratingHistoriesDir}`);
}

// Check if we should process all national masters
if (process.argv[2] === '--all-masters') {
  processSinglePlayer = false;
  console.log('Processing rating history for all national masters');
  
  // Read national masters file if it exists
  if (fs.existsSync(nationalMastersInput)) {
    nationalMasterIds = fs.readFileSync(nationalMastersInput)
      .toString()
      .split('\n')
      .slice(1) // Skip header
      .filter(line => line.trim())
      .map(line => line.split(',')[0]); // Extract CFC ID
    
    console.log(`Found ${nationalMasterIds.length} national masters to process`);
  } else {
    console.log(`${nationalMastersInput} not found`);
  }
}

const performanceRecords = {};
const regularPlayers = new Map();
const ratingHistory = [];
const eventsData = {};

// Load event data
fs.createReadStream(eventsFilePath)
  .pipe(csv())
  .on('data', (row) => {
    eventsData[row['id']] = row;
  })
  .on('end', () => {
    console.log('Events data loaded.');
  });

// Store rating history by player ID
const playerRatingHistories = {};

fs.createReadStream(crosstablesFilePath)
  .pipe(csv())
  .on('data', (row) => {

    const cfcId = row['cfc_id'];
    // if ( row['rating_type'] !== 'R') return; // Ensure only regular rated games are counted

    const gamesPlayed = parseInt(row['games_played'], 10) || 0;
    // regularPlayers.set(cfcId, regularPlayers.get(cfcId) + gamesPlayed);

    const ratingPerf = parseInt(row['rating_perf'], 10);
    const ratingIndicator = parseInt(row['rating_indicator'], 10);
    const eventId = row['event_id'];

    const eventDetails = eventsData[eventId] || {};
    const eventDate = eventDetails['date_end'] || '';
    const eventName = eventDetails['name'] || '';
    const eventLocation = eventDetails['province'] || '';
    const numPlayers = eventDetails['n_players'] || '';
    const rating_type = eventDetails['rating_type'] || '';
    const organizer = eventDetails['organizer_id'] || '';
    const score = row['score'];
    const ratingPost = row['rating_post'];

    // Capture rating history for the specified player or all national masters
    if (processSinglePlayer && cfcId === cfcID) {
      // For single player mode
      console.log("Single player processing")
      if (!ratingHistory[cfcId]) ratingHistory[cfcId] = [];
        ratingHistory.push({ eventId, eventDate, eventName, eventLocation, numPlayers, organizer, score, ratingPerf, ratingPost, rating_type });
    } else if (!processSinglePlayer) {
      // For all masters mode
      if (!playerRatingHistories[cfcId]) {
        playerRatingHistories[cfcId] = [];
      }
      playerRatingHistories[cfcId].push({ 
        eventId, eventDate, eventName, eventLocation, numPlayers, organizer, score, ratingPerf, ratingPost, rating_type
      });
    }
    else{
      console.log("Could not find player")
    }
  })
  .on('end', () => {
    // const nationalMastersArray = [];

    // for (const [cfcId, data] of Object.entries(performanceRecords)) {
    //   if (regularPlayers.get(cfcId) >= 25 && (data.count2300 >= 3 && data.maxIndicator >= 2200 || data.maxIndicator >= 2300)) {
    //     nationalMastersArray.push({
    //       cfc_id: cfcId,
    //       tournaments: data.tournaments.map(t => `${t.eventId}:${t.eventDate}:${t.eventName}:${t.eventLocation}:${t.numPlayers}:${t.organizer}:${t.ratingPerf}`).join('; ')
    //     });
    //   }
    // }

    // Save national masters list
    // stringify(nationalMastersArray, { header: true }, (err, output) => {
    //   if (err) {
    //     console.error('Error writing national masters CSV:', err);
    //     return;
    //   }
    //   // fs.writeFileSync(nationalMastersOutput, output);
    //   console.log(`National masters saved to ${nationalMastersOutput}`);
    // });

    if (processSinglePlayer) {
      // Save rating history for single player
      stringify(ratingHistory, { header: true }, (err, output) => {
        if (err) {
          console.error('Error writing rating history CSV:', err);
          return;
        }
        fs.writeFileSync(ratingHistoryOutput, output);
        console.log(`Rating history for CFC ID ${cfcID} saved to ${ratingHistoryOutput}`);
      });
    } else {
      // Save rating histories for all national masters
      console.log(`Saving rating histories for ${Object.keys(nationalMasterIds).length} players...`);

      // Process national masters that were identified in the CSV file
      nationalMasterIds.forEach(masterId => {
        const playerHistory = playerRatingHistories[masterId] || [];
        if (playerHistory.length > 0) {
          const playerOutputPath = `${ratingHistoriesDir}/rating_history_${masterId}.csv`;
          stringify(playerHistory, { header: true }, (err, output) => {
            if (err) {
              console.error(`Error writing rating history CSV for ${masterId}:`, err);
              return;
            }
            fs.writeFileSync(playerOutputPath, output);
            console.log(`Rating history for CFC ID ${masterId} saved to ${playerOutputPath}`);
          });
        } else {
          console.log(`No rating history found for CFC ID ${masterId}`);
        }
      });
      
      console.log('All rating histories have been processed');
    }
  });
