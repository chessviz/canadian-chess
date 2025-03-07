const fs = require('fs');
const csv = require('csv-parser');

const filePath = 'player.csv'; // Change this to the actual CSV file path
let count = 0;

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    const regularRating = parseInt(row['regular_rating'], 10);
    if (!isNaN(regularRating) && regularRating > 2200) {
      count++;
    }
  })
  .on('end', () => {
    console.log(`Number of people with regular ratings greater than 2200: ${count}`);
  });
