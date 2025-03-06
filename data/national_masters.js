const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

const filePath = 'player.csv'; 
const outputFilePath = 'active_players.csv';
const crosstablesFilePath = 'crosstable.csv';
const eventsFilePath = 'event.csv'; // Add event file path to get event dates
const nationalMastersOutput = 'national_masters.csv';

let highRatingCount = 0;
let activeMembershipCount = 0;
const today = new Date();
const activePlayers = [];
const performanceRecords = {};
const nationalMasters = new Map();
const regularPlayers = new Map();
const eventDates = new Map(); // Store event dates

// First, load event dates
fs.createReadStream(eventsFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // Store event date information - use date_end as the event date
    eventDates.set(row['id'], row['date_end']);
  })
  .on('end', () => {
    console.log(`Loaded ${eventDates.size} event dates`);
    
    // Continue with processing players
    processPlayers();
  });

function processPlayers() {
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
      
      processCrosstables();
    });
}

function processCrosstables() {
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
      // Get event date from the events map instead of directly from the crosstable
      const eventDate = eventDates.get(eventId) || '';

      if (!performanceRecords[cfcId]) {
        performanceRecords[cfcId] = { 
          count2300: 0, 
          maxIndicator: 0, 
          tournaments: [], 
          totalGames: 0,
          dates: []
        };
      }

      // Only consider tournaments where player played at least 5 games
      if (gamesPlayed >= 5) {
        if (!isNaN(ratingPerf) && ratingPerf >= 2300) {
          // Only store first three norms
          if (performanceRecords[cfcId].count2300 < 3) {
            performanceRecords[cfcId].tournaments.push({ eventId, ratingPerf, eventDate });
            performanceRecords[cfcId].dates.push(eventDate);
          }
          performanceRecords[cfcId].count2300++;
        }
        if (!isNaN(ratingIndicator) && ratingIndicator >= 2300) {
          performanceRecords[cfcId].maxIndicator = Math.max(
            performanceRecords[cfcId].maxIndicator,
            ratingIndicator
          );
        }
      }
    })
    .on('end', () => {
      const nationalMastersArray = [];

      for (const [cfcId, data] of Object.entries(performanceRecords)) {
        if (regularPlayers.get(cfcId) >= 25 && (data.count2300 >= 3 && data.maxIndicator >= 2200 || data.maxIndicator >= 2300)) {
          // Calculate when they achieved the title
          let titleAchieved = '';
          if (data.count2300 >= 3) {
            // Sort dates to find the third norm date
            const sortedDates = [...data.dates].filter(d => d).sort((a, b) => new Date(a) - new Date(b));
            if (sortedDates.length >= 3) {
              titleAchieved = sortedDates[2]; // Third norm date
            }
          } else if (data.maxIndicator >= 2300) {
            // If they achieved it through indicator, use the most recent event date
            const validDates = data.dates.filter(d => d);
            titleAchieved = validDates.length > 0 ? 
              new Date(Math.max(...validDates.map(d => new Date(d).getTime()))).toISOString().split('T')[0] : 
              '';
          }
          
          nationalMastersArray.push({
            cfc_id: cfcId,
            tournaments: data.tournaments
              .filter((t, i) => i < 3) // Ensure only first 3 tournaments are included
              .map(t => `${t.eventId}:${t.ratingPerf}`)
              .join('; '),
            title_achieved: titleAchieved
          });
        }
      }

      stringify(nationalMastersArray, { header: true }, (err, output) => {
        if (err) {
          console.error('Error writing national masters CSV:', err);
          return;
        }
        fs.writeFileSync(nationalMastersOutput, output);
        console.log(`National masters saved to ${nationalMastersOutput}`);
      });
    });
}
