/*
 * This script adds the 2025 F1 races to the database
 */

const races = [
  {
    name: "FORMULA 1 LOUIS VUITTON AUSTRALIAN GRAND PRIX 2025",
    location: "Australia",
    date: "2025-03-16", // Using ISO format string for date
    round: 1
  },
  {
    name: "FORMULA 1 HEINEKEN CHINESE GRAND PRIX 2025",
    location: "China",
    date: "2025-03-23", 
    round: 2
  },
  {
    name: "FORMULA 1 LENOVO JAPANESE GRAND PRIX 2025",
    location: "Japan",
    date: "2025-04-06",
    round: 3
  },
  {
    name: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2025",
    location: "Bahrain",
    date: "2025-04-13",
    round: 4
  },
  {
    name: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2025",
    location: "Saudi Arabia",
    date: "2025-04-20",
    round: 5
  },
  {
    name: "FORMULA 1 CRYPTO.COM MIAMI GRAND PRIX 2025",
    location: "United States",
    date: "2025-05-04",
    round: 6
  },
  {
    name: "FORMULA 1 AWS GRAN PREMIO DEL MADE IN ITALY E DELL'EMILIA-ROMAGNA 2025",
    location: "Italy",
    date: "2025-05-18",
    round: 7
  },
  {
    name: "FORMULA 1 TAG HEUER GRAND PRIX DE MONACO 2025",
    location: "Monaco",
    date: "2025-05-25",
    round: 8
  },
  {
    name: "FORMULA 1 ARAMCO GRAN PREMIO DE ESPAÑA 2025",
    location: "Spain",
    date: "2025-06-01",
    round: 9
  },
  {
    name: "FORMULA 1 PIRELLI GRAND PRIX DU CANADA 2025",
    location: "Canada",
    date: "2025-06-15",
    round: 10
  },
  {
    name: "FORMULA 1 MSC CRUISES AUSTRIAN GRAND PRIX 2025",
    location: "Austria",
    date: "2025-06-29",
    round: 11
  },
  {
    name: "FORMULA 1 QATAR AIRWAYS BRITISH GRAND PRIX 2025",
    location: "Great Britain",
    date: "2025-07-06",
    round: 12
  },
  {
    name: "FORMULA 1 MOËT & CHANDON BELGIAN GRAND PRIX 2025",
    location: "Belgium",
    date: "2025-07-27",
    round: 13
  },
  {
    name: "FORMULA 1 LENOVO HUNGARIAN GRAND PRIX 2025",
    location: "Hungary",
    date: "2025-08-03",
    round: 14
  },
  {
    name: "FORMULA 1 HEINEKEN DUTCH GRAND PRIX 2025",
    location: "Netherlands",
    date: "2025-08-31",
    round: 15
  },
  {
    name: "FORMULA 1 PIRELLI GRAN PREMIO D'ITALIA 2025",
    location: "Italy",
    date: "2025-09-07",
    round: 16
  },
  {
    name: "FORMULA 1 QATAR AIRWAYS AZERBAIJAN GRAND PRIX 2025",
    location: "Azerbaijan",
    date: "2025-09-21",
    round: 17
  },
  {
    name: "FORMULA 1 SINGAPORE AIRLINES SINGAPORE GRAND PRIX 2025",
    location: "Singapore",
    date: "2025-10-05",
    round: 18
  },
  {
    name: "FORMULA 1 MSC CRUISES UNITED STATES GRAND PRIX 2025",
    location: "United States",
    date: "2025-10-19",
    round: 19
  },
  {
    name: "FORMULA 1 GRAN PREMIO DE LA CIUDAD DE MÉXICO 2025",
    location: "Mexico",
    date: "2025-10-26",
    round: 20
  },
  {
    name: "FORMULA 1 MSC CRUISES GRANDE PRÊMIO DE SÃO PAULO 2025",
    location: "Brazil",
    date: "2025-11-09",
    round: 21
  },
  {
    name: "FORMULA 1 HEINEKEN LAS VEGAS GRAND PRIX 2025",
    location: "United States",
    date: "2025-11-22",
    round: 22
  },
  {
    name: "FORMULA 1 QATAR AIRWAYS QATAR GRAND PRIX 2025",
    location: "Qatar",
    date: "2025-11-30",
    round: 23
  },
  {
    name: "FORMULA 1 ETIHAD AIRWAYS ABU DHABI GRAND PRIX 2025",
    location: "Abu Dhabi",
    date: "2025-12-07",
    round: 24
  }
];

// Function to add a race
const addRace = async (race) => {
  try {
    const response = await fetch('/api/admin/races', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(race)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to add race: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Added race: ${data.name} (Round ${data.round})`);
    return data;
  } catch (error) {
    console.error(`Error adding race ${race.name}:`, error);
    throw error;
  }
};

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to add all races sequentially
const addAllRaces = async () => {
  console.log("Starting to add races...");
  const results = [];
  
  for (const race of races) {
    try {
      console.log(`Adding race: ${race.name} (Round ${race.round})...`);
      const result = await addRace(race);
      results.push(result);
      
      // Add a small delay between requests to avoid overwhelming the server
      await sleep(500);
    } catch (error) {
      console.error(`Failed to add race ${race.name}, continuing with next race...`);
      // Still add a delay even if there was an error
      await sleep(500);
    }
  }
  
  console.log(`Successfully added ${results.length} out of ${races.length} races.`);
  return results;
};

// Export the function to be called from the browser console
window.addAllRaces = addAllRaces;

console.log("Race addition script loaded. Run window.addAllRaces() to add all races.");