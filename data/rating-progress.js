const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

const filePath = 'player.csv'; // Change this to the actual CSV file path
const outputFilePath = 'active_players.csv';
const crosstablesFilePath = 'crosstable.csv'; // Change this to the actual crosstables CSV file path
const eventsFilePath = 'event.csv'; // Change this to the actual events CSV file path
const nationalMastersOutput = 'national_masters.csv';

// Command line argument or default CFC ID
const argCfcID = process.argv[2];
const cfcID = argCfcID || '167084';
const ratingHistoriesDir = 'rating_histories';
const ratingHistoryOutput = `${ratingHistoriesDir}/rating_history_${cfcID}.csv`;

// For processing multiple national masters
const nationalMastersInput = 'national_masters.csv';
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
    console.log(`${nationalMastersInput} not found, will create it first`);
  }
}

let highRatingCount = 0;
let activeMembershipCount = 0;
const today = new Date();
const activePlayers = [];
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

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    const regularRating = parseInt(row['regular_rating'], 10);
    if (!isNaN(regularRating) && regularRating > 2200) {
      highRatingCount++;
    }

    const cfcExpiry = row['cfc_expiry'];
    if (cfcExpiry) {
      const expiryDate = new Date(cfcExpiry);
      if (!isNaN(expiryDate) && expiryDate > today) {
        activeMembershipCount++;
        activePlayers.push(row);
      }
    }

    if (regularRating > 0) {
      regularPlayers.set(row['cfc_id'], 0);
    }
  })
  .on('end', () => {
    console.log(`Number of people with regular ratings greater than 2200: ${highRatingCount}`);
    console.log(`Total number of players with an active CFC membership: ${activeMembershipCount}`);

    stringify(activePlayers, { header: true }, (err, output) => {
      if (err) {
        console.error('Error writing CSV:', err);
        return;
      }
      fs.writeFileSync(outputFilePath, output);
      console.log(`Active players saved to ${outputFilePath}`);
    });
  });

// Store rating history by player ID
const playerRatingHistories = {};

fs.createReadStream(crosstablesFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const cfcId = row['cfc_id'];
    if (!regularPlayers.has(cfcId) || row['rating_type'] !== 'R') return; // Ensure only regular rated games are counted

    const gamesPlayed = parseInt(row['games_played'], 10) || 0;
    regularPlayers.set(cfcId, regularPlayers.get(cfcId) + gamesPlayed);

    const ratingPerf = parseInt(row['rating_perf'], 10);
    const ratingIndicator = parseInt(row['rating_indicator'], 10);
    const eventId = row['event_id'];

    const eventDetails = eventsData[eventId] || {};
    const eventDate = eventDetails['date_end'] || '';
    const eventName = eventDetails['name'] || '';
    const eventLocation = eventDetails['province'] || '';
    const numPlayers = eventDetails['n_players'] || '';
    const organizer = eventDetails['organizer_id'] || '';
    const score = row['score'];
    const ratingPost = row['rating_post'];

    if (!performanceRecords[cfcId]) {
      performanceRecords[cfcId] = { count2300: 0, maxIndicator: 0, tournaments: [], totalGames: 0 };
    }

    if (!isNaN(ratingPerf) && ratingPerf >= 2300) {
      performanceRecords[cfcId].count2300++;
      performanceRecords[cfcId].tournaments.push({ eventId, eventDate, eventName, eventLocation, numPlayers, organizer, ratingPerf });
    }
    if (!isNaN(ratingIndicator) && ratingIndicator >= 2300) {
      performanceRecords[cfcId].maxIndicator = Math.max(
        performanceRecords[cfcId].maxIndicator,
        ratingIndicator
      );
    }

    // Capture rating history for the specified player or all national masters
    if (processSinglePlayer && cfcId === cfcID) {
      // For single player mode
      if (!ratingHistory[cfcId]) ratingHistory[cfcId] = [];
      ratingHistory.push({ eventId, eventDate, eventName, eventLocation, numPlayers, organizer, score, ratingPerf, ratingPost });
    } else if (!processSinglePlayer) {
      // For all masters mode
      if (!playerRatingHistories[cfcId]) {
        playerRatingHistories[cfcId] = [];
      }
      playerRatingHistories[cfcId].push({ 
        eventId, eventDate, eventName, eventLocation, numPlayers, organizer, score, ratingPerf, ratingPost 
      });
    }
  })
  .on('end', () => {
    const nationalMastersArray = [];

    for (const [cfcId, data] of Object.entries(performanceRecords)) {
      if (regularPlayers.get(cfcId) >= 25 && (data.count2300 >= 3 && data.maxIndicator >= 2200 || data.maxIndicator >= 2300)) {
        nationalMastersArray.push({
          cfc_id: cfcId,
          tournaments: data.tournaments.map(t => `${t.eventId}:${t.eventDate}:${t.eventName}:${t.eventLocation}:${t.numPlayers}:${t.organizer}:${t.ratingPerf}`).join('; ')
        });
      }
    }

    // Save national masters list
    stringify(nationalMastersArray, { header: true }, (err, output) => {
      if (err) {
        console.error('Error writing national masters CSV:', err);
        return;
      }
      fs.writeFileSync(nationalMastersOutput, output);
      console.log(`National masters saved to ${nationalMastersOutput}`);
    });

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
      console.log(`Saving rating histories for ${Object.keys(playerRatingHistories).length} players...`);
      
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
