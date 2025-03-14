const fs = require("fs");
const csv = require("csv-parser");
const { stringify } = require("csv-stringify");

// Log command line arguments
console.log("Command line arguments:", process.argv);
console.log("Arguments passed after script name:", process.argv.slice(2));

// Configuration
const filePath = "../crosstable.csv"; // Path to the crosstable.csv file
console.log("Attempting to read file from:", filePath);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a CFC ID");
  process.exit(1);
}
const cfcId = args[0];
console.log("Looking for player with CFC ID:", cfcId);

const outputFilePath = `../player_winrate_${cfcId}.csv`;
console.log("Will write results to:", outputFilePath);

// Log the first few rows of the CSV to check column names
let sampleRows = [];
let columnNames = null;

// Function to parse the results string and extract wins, losses, and draws
function parseResults(resultsString) {
  if (!resultsString) return { wins: 0, losses: 0, draws: 0 };

  console.log("Parsing results string:", resultsString);

  // Count occurrences of each symbol throughout the string
  let wins = 0,
    losses = 0,
    draws = 0;

  // Loop through each character in the string
  for (let i = 0; i < resultsString.length; i++) {
    const char = resultsString[i];
    if (char === "+") {
      wins++;
    } else if (char === "-") {
      losses++;
    } else if (char === "=") {
      draws++;
    }
  }

  console.log(`Parsed results: wins=${wins}, losses=${losses}, draws=${draws}`);
  return { wins, losses, draws };
}

// Function to generate statistics for a specific player
function generatePlayerStats(cfcId) {
  const playerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDrawn: 0,
  };

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    let matchingRowCount = 0;

    fs.createReadStream(filePath)
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        reject(error);
      })
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("CSV Headers:", headers);
        columnNames = headers;
      })
      .on("data", (row) => {
        rowCount++;

        // Store a few sample rows to inspect
        if (rowCount <= 3) {
          sampleRows.push(row);
          console.log(`Sample row ${rowCount}:`, row);
        }

        // Check column names for case-insensitive match
        const cfcIdColumn = Object.keys(row).find(
          (key) => key.toLowerCase() === "cfc_id"
        );
        const resultsColumn = Object.keys(row).find(
          (key) => key.toLowerCase() === "results"
        );

        if (!cfcIdColumn) {
          if (rowCount === 1) {
            console.log(
              "Warning: Could not find 'Cfc_id' column. Available columns:",
              Object.keys(row)
            );
          }
          return;
        }

        // Check if this row belongs to the player we're interested in
        if (row[cfcIdColumn] === cfcId) {
          matchingRowCount++;
          console.log(
            `Found matching row ${matchingRowCount} for CFC ID ${cfcId}`
          );

          // Parse results string to get wins, losses, and draws
          if (resultsColumn) {
            const results = parseResults(row[resultsColumn]);
            playerStats.gamesWon += results.wins;
            playerStats.gamesLost += results.losses;
            playerStats.gamesDrawn += results.draws;

            // Calculate games played as the sum of wins, losses, and draws
            const rowGamesPlayed =
              results.wins + results.losses + results.draws;
            playerStats.gamesPlayed += rowGamesPlayed;

            console.log(
              `Row ${rowCount}: ${results.wins} wins + ${results.losses} losses + ${results.draws} draws = ${rowGamesPlayed} games played`
            );
          } else {
            console.log(
              `Warning: Could not find 'Results' column in row ${rowCount}`
            );
          }
        }
      })
      .on("end", () => {
        console.log(`Processed ${rowCount} rows in CSV file`);
        console.log(
          `Found ${matchingRowCount} rows for player with CFC ID ${cfcId}`
        );

        if (matchingRowCount === 0) {
          console.log("No data found for the given CFC ID");

          // Log some sample data for debugging
          console.log("Sample rows from CSV:");
          sampleRows.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
          });
        }

        // Double-check the calculation
        console.log("Verification:");
        console.log(`Total games played: ${playerStats.gamesPlayed}`);
        console.log(
          `Sum of W/L/D: ${
            playerStats.gamesWon +
            playerStats.gamesLost +
            playerStats.gamesDrawn
          }`
        );

        resolve(playerStats);
      })
      .on("error", (error) => {
        console.error("Error processing CSV:", error);
        reject(error);
      });
  });
}

// Main function
async function main() {
  try {
    console.log("Starting player statistics generation...");
    const stats = await generatePlayerStats(cfcId);

    console.log("\nPlayer Statistics Summary:");
    console.log(`Games Played: ${stats.gamesPlayed}`);
    console.log(`Games Won: ${stats.gamesWon}`);
    console.log(`Games Lost: ${stats.gamesLost}`);
    console.log(`Games Drawn: ${stats.gamesDrawn}`);

    // Write to CSV file
    const data = [
      {
        games_played: stats.gamesPlayed,
        games_won: stats.gamesWon,
        games_lost: stats.gamesLost,
        games_drawn: stats.gamesDrawn,
      },
    ];

    stringify(data, { header: true }, (err, output) => {
      if (err) {
        console.error("Error writing CSV:", err);
        return;
      }
      fs.writeFileSync(outputFilePath, output);
      console.log(`Statistics saved to ${outputFilePath}`);
    });
  } catch (error) {
    console.error("Error generating player statistics:", error);
  }
}

// Execute the main function
main();
