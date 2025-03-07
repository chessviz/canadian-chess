const fs = require('fs');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

const filePath = 'player.csv'; // Change this to the actual CSV file path
const outputFilePath = 'active_players.csv';
let highRatingCount = 0;
let activeMembershipCount = 0;
const today = new Date();
const activePlayers = [];

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
