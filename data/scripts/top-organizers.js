const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Function to analyze organizers and arbiters
async function analyzeOrganizersArbiters() {
  // Store the data
  const events = [];
  
  // Parse the events data
  await new Promise((resolve, reject) => {
    fs.createReadStream('../event.csv')
      .pipe(csv())
      .on('data', (data) => {
        events.push({
          id: data.id,
          name: data.name,
          organizer_id: data.organizer_id === '0' ? null : data.organizer_id,
          arbiter_id: data.arbiter_id === '0' ? null : data.arbiter_id,
          n_players: parseInt(data.n_players, 10)
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Load player data
  const players = await loadPlayerData();

  // Analyze roles (organizers and arbiters)
  const organizerStats = analyzeRole(events, 'organizer_id', players);
  const arbiterStats = analyzeRole(events, 'arbiter_id', players);

  // Save results to CSV
  saveToCSV(organizerStats, '../top_organizers.csv');
  saveToCSV(arbiterStats, '../top_arbiters.csv');

  // Print top 10 for each category
  console.log('\nTop 10 Organizers by Number of Tournaments:');
  console.table(organizerStats.slice(0, 10).map(item => ({
    id: item.id,
    name: item.name,
    province: item.province || 'Unknown',
    birth_year: item.birth_year || 'Unknown',
    num_tournaments: item.num_tournaments,
    total_players: item.total_players
  })));
  
  console.log('\nTop 10 Arbiters by Number of Tournaments:');
  console.table(arbiterStats.slice(0, 10).map(item => ({
    id: item.id,
    name: item.name,
    province: item.province || 'Unknown',
    birth_year: item.birth_year || 'Unknown',
    num_tournaments: item.num_tournaments,
    total_players: item.total_players
  })));
}

// Function to load player data from player.csv
async function loadPlayerData() {
  const players = {};
  
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
          
          players[id] = {
            name: name,
            province: province,
            birthYear: birthYear
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

// Function to analyze a specific role (organizer or arbiter)
function analyzeRole(events, roleColumn, players) {
  const roleCounts = {};

  // Count tournaments and players for each person in the role
  events.forEach(event => {
    const personId = event[roleColumn];
    if (personId) {
      if (!roleCounts[personId]) {
        // Get player info if available
        const playerInfo = players[personId] || { name: null, province: null, birthYear: null };
        
        roleCounts[personId] = {
          id: personId,
          num_tournaments: 0,
          total_players: 0,
          name: playerInfo.name || `Person ID ${personId}`,
          province: playerInfo.province || '',
          birth_year: playerInfo.birthYear || ''
        };
      }
      roleCounts[personId].num_tournaments += 1;
      roleCounts[personId].total_players += event.n_players;
    }
  });

  // Convert to array and sort
  const roleStats = Object.values(roleCounts);
  roleStats.sort((a, b) => {
    // Sort by number of tournaments (primary) and total players (secondary)
    if (b.num_tournaments !== a.num_tournaments) {
      return b.num_tournaments - a.num_tournaments;
    }
    return b.total_players - a.total_players;
  });

  // Calculate average players per tournament
  roleStats.forEach(person => {
    person.avg_players_per_tournament = (person.total_players / person.num_tournaments).toFixed(2);
  });

  return roleStats;
}

// Function to load person data
function loadPersonData() {
  const persons = {};
  try {
    const personData = fs.readFileSync(path.join(__dirname, 'data', 'person.csv'), 'utf8');
    const lines = personData.split('\n');
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [id, name] = line.split(',');
        persons[id] = name;
      }
    }
  } catch (error) {
    console.log('Error loading person data:', error);
  }
  return persons;
}

// Function to save data to CSV
function saveToCSV(data, filename) {
  if (data.length === 0) return;
  
  // Create header
  const header = Object.keys(data[0]).join(',');
  
  // Create rows
  const rows = data.map(item => {
    return Object.values(item).map(value => {
      // Handle commas and quotes in strings
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  // Combine header and rows
  const csvContent = [header, ...rows].join('\n');
  
  // Ensure the directory exists
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write to file
  fs.writeFileSync(filename, csvContent);
  console.log(`Data saved to ${filename}`);
}

// Run the analysis
analyzeOrganizersArbiters().catch(console.error);