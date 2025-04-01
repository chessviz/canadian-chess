const fs = require("fs");
const csv = require("csv-parser");
const { stringify } = require("csv-stringify");
const path = require("path");

// Configuration
const nationalsFilePath = "../national_masters.csv";
const postalCodesFilePath = "../CA-postal.csv";
const outputFilePath = "../masters_locations.csv";

console.log("Starting postal code mapping script...");
console.log(`Reading national masters from: ${nationalsFilePath}`);
console.log(`Reading postal codes from: ${postalCodesFilePath}`);

// Function to count postal codes from national masters
async function countPostalCodes() {
  return new Promise((resolve, reject) => {
    const postalCodeCounts = new Map();

    fs.createReadStream(nationalsFilePath)
      .on("error", (error) => {
        console.error("Error reading national masters CSV:", error);
        reject(error);
      })
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("National Masters CSV Headers:", headers);
        if (!headers.includes("postal_code")) {
          console.warn(
            "Warning: No 'postal_code' column found in national_masters.csv"
          );
        }
      })
      .on("data", (row) => {
        const postalCode = row.postal_code;
        if (postalCode) {
          // Standardize postal code format (remove spaces, uppercase)
          const standardizedPostalCode = postalCode
            .replace(/\s/g, "")
            .toUpperCase();

          // Increment counter for this postal code
          postalCodeCounts.set(
            standardizedPostalCode,
            (postalCodeCounts.get(standardizedPostalCode) || 0) + 1
          );
        }
      })
      .on("end", () => {
        console.log(
          `Processed national masters file, found ${postalCodeCounts.size} unique postal codes`
        );
        resolve(postalCodeCounts);
      });
  });
}

// Function to load postal code coordinates
async function loadPostalCodeCoordinates() {
  return new Promise((resolve, reject) => {
    const postalCodeCoordinates = new Map();

    fs.createReadStream(postalCodesFilePath)
      .on("error", (error) => {
        console.error("Error reading postal codes CSV:", error);
        reject(error);
      })
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("Postal Codes CSV Headers:", headers);
        const requiredColumns = [
          "postal_code",
          "latitude",
          "longitude",
          "place_name",
        ];
        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          console.warn(
            `Warning: Missing required columns in CA-postal.csv: ${missingColumns.join(
              ", "
            )}`
          );
        }
      })
      .on("data", (row) => {
        if (row.postal_code && row.latitude && row.longitude) {
          // Standardize postal code format
          const standardizedPostalCode = row.postal_code
            .replace(/\s/g, "")
            .toUpperCase();

          postalCodeCoordinates.set(standardizedPostalCode, {
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            place_name: row.place_name || "", // Capture place_name
          });
        }
      })
      .on("end", () => {
        console.log(
          `Loaded coordinates for ${postalCodeCoordinates.size} postal codes`
        );
        resolve(postalCodeCoordinates);
      });
  });
}

// Main function
async function main() {
  try {
    // Get postal code counts from national masters
    const postalCodeCounts = await countPostalCodes();

    // Get coordinates for postal codes
    const postalCodeCoordinates = await loadPostalCodeCoordinates();

    // Combine the data
    const results = [];
    let matchCount = 0;
    let missingCount = 0;

    for (const [postalCode, count] of postalCodeCounts.entries()) {
      const coordinates = postalCodeCoordinates.get(postalCode);

      if (coordinates) {
        results.push({
          postal_code: postalCode,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          place_name: coordinates.place_name,
          count: count,
        });
        matchCount++;
      } else {
        console.warn(`No coordinates found for postal code: ${postalCode}`);
        missingCount++;
      }
    }

    console.log(`Successfully mapped ${matchCount} postal codes`);
    console.log(`Missing coordinates for ${missingCount} postal codes`);

    // Write to CSV file
    stringify(results, { header: true }, (err, output) => {
      if (err) {
        console.error("Error writing CSV:", err);
        return;
      }
      fs.writeFileSync(outputFilePath, output);
      console.log(`Results saved to ${outputFilePath}`);
    });
  } catch (error) {
    console.error("Error in postal code mapping:", error);
  }
}

// Execute the main function
main();
