const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

const filePath = 'player.csv'; // Change this to the actual CSV file path
const outputFilePath = 'active_players.csv';
const crosstablesFilePath = 'crosstable.csv'; // Change this to the actual crosstables CSV file path
const nationalMastersOutput = 'national_masters.csv';

let highRatingCount = 0;
let activeMembershipCount = 0;
const today = new Date();
const activePlayers = [];
const performanceRecords = {};
const nationalMasters = new Map();
const regularPlayers = new Map();

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
    const ratingPost = row['rating_post'];

    if (!performanceRecords[cfcId]) {
      performanceRecords[cfcId] = { count2300: 0, maxIndicator: 0, tournaments: [], totalGames: 0 };
    }

    if (!isNaN(ratingPerf) && ratingPerf >= 2300) {
      performanceRecords[cfcId].count2300++;
      performanceRecords[cfcId].tournaments.push({ eventId, ratingPerf });
    }
    if (!isNaN(ratingIndicator) && ratingIndicator >= 2300) {
      performanceRecords[cfcId].maxIndicator = Math.max(
        performanceRecords[cfcId].maxIndicator,
        ratingIndicator
      );
    }
  })
  .on('end', () => {
    const nationalMastersArray = [];

    for (const [cfcId, data] of Object.entries(performanceRecords)) {
      if (regularPlayers.get(cfcId) >= 25 && (data.count2300 >= 3 && data.maxIndicator >= 2200 || data.maxIndicator >= 2300)) {
        nationalMastersArray.push({
          cfc_id: cfcId,
          tournaments: data.tournaments.map(t => `${t.eventId}:${t.ratingPerf}`).join('; ')
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
