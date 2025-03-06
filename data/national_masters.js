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
const nationalMasters = new Set();

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
    const ratingPerf = parseInt(row['rating_perf'], 10);
    const ratingIndicator = parseInt(row['rating_indicator'], 10);

    if (!performanceRecords[cfcId]) {
      performanceRecords[cfcId] = { count2300: 0, maxIndicator: 0 };
    }

    if (!isNaN(ratingPerf) && ratingPerf >= 2300) {
      performanceRecords[cfcId].count2300++;
    }
    if (!isNaN(ratingIndicator) && ratingIndicator >= 2300) {
      performanceRecords[cfcId].maxIndicator = Math.max(
        performanceRecords[cfcId].maxIndicator,
        ratingIndicator
      );
    }

    if (
      performanceRecords[cfcId].count2300 >= 3 &&
      performanceRecords[cfcId].maxIndicator >= 2200
    ) {
      nationalMasters.add(cfcId);
    } else if (performanceRecords[cfcId].maxIndicator >= 2300) {
      nationalMasters.add(cfcId);
    }
  })
  .on('end', () => {
    const nationalMastersArray = Array.from(nationalMasters).map((id) => ({ cfc_id: id }));

    stringify(nationalMastersArray, { header: true }, (err, output) => {
      if (err) {
        console.error('Error writing national masters CSV:', err);
        return;
      }
      fs.writeFileSync(nationalMastersOutput, output);
      console.log(`National masters saved to ${nationalMastersOutput}`);
    });
  });
