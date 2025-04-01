const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Function to load player data from player.csv
async function loadPlayerData() {
  let players = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, '../player.csv'))
      .pipe(csv())
      .on('data', (data) => {
        const id = data.cfc_id;
        if (id) {
          const firstName = data.name_first || '';
          const lastName = data.name_last || '';
          const name = `${firstName} ${lastName}`.trim();
          const province = data.addr_province || '';
          const birthYear = data.birthyear || '';
          const regularRating = parseInt(data.regular_rating) || 0;
          const quickRating = parseInt(data.quick_indicator) || 0;
          
          players[id] = {
            name: name,
            province: province,
            birthYear: birthYear,
            regularRating: regularRating,
            quickRating: quickRating,
          };
        }
      })
      .on('end', () => resolve(players))
      .on('error', (err) => {
        console.error('Error reading player.csv:', err);
        resolve({}); // Return empty object on error
      });
  });
}
// Function to generate rating distribution
function generateRatingDistribution(players) {
    // Define rating buckets (5 buckets total)
    const ratingBuckets = {
        '0-799': 0,
        '800-1399': 0,
        '1400-1799': 0,
        '1800-2199': 0,
        '2200+': 0
    };
    
    // Count players in each bucket
    Object.values(players).forEach(player => {
        const rating = Math.max(player.regularRating, player.quickRating);
        
        if (rating < 800) {
            ratingBuckets['0-799']++;
        } else if (rating < 1400) {
            ratingBuckets['800-1399']++;
        } else if (rating < 1800) {
            ratingBuckets['1400-1799']++;
        } else if (rating < 2200) {
            ratingBuckets['1800-2199']++;
        } else {
            ratingBuckets['2200+']++;
        }
    });
    
    return ratingBuckets;
}

// Function to output distribution as table
function printDistributionTable(distribution) {
  console.log('Rating Distribution:');
  console.log('-------------------');
  console.log('Rating Range | Count | Percentage');
  console.log('-------------------');
  
  const totalPlayers = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  Object.entries(distribution).forEach(([range, count]) => {
    const percentage = totalPlayers > 0 ? ((count / totalPlayers) * 100).toFixed(2) : '0.00';
    console.log(`${range.padEnd(12)} | ${String(count).padEnd(5)} | ${percentage}%`);
  });
  
  console.log('-------------------');
  console.log(`Total Players: ${totalPlayers}`);
}

// Function to save distribution to CSV
function saveDistributionToCSV(distribution) {
  const totalPlayers = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  let csvContent = 'Rating Range,Count,Percentage\n';
  
  Object.entries(distribution).forEach(([range, count]) => {
    const percentage = totalPlayers > 0 ? ((count / totalPlayers) * 100).toFixed(2) : '0.00';
    csvContent += `${range},${count},${percentage}\n`;
  });
  
  const outputPath = path.join(__dirname, '../rating_distribution.csv');
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Distribution saved to ${outputPath}`);
}

// Run the analysis
async function runAnalysis() {
  try {
    const players = await loadPlayerData();
    console.log(`Loaded data for ${Object.keys(players).length} players`);
    
    const distribution = generateRatingDistribution(players);
    printDistributionTable(distribution);
    saveDistributionToCSV(distribution);
  } catch (error) {
    console.error('Error running analysis:', error);
  }
}

runAnalysis();

