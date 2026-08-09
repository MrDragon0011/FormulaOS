/* FormulaOS team liveries — applied when a signed-in user picks a favorite team.
   `palette` reuses the closest-matching wallpaper color family (only 6 exist);
   `accent`/`car` carry each team's real distinct identity regardless. */
const TEAMS = [
  { id: 'ferrari', name: 'Ferrari', palette: 0, accent: '#e8002d', accent2: '#fff200', car: ['#ff6b5e', '#a81414'] },
  { id: 'mercedes', name: 'Mercedes', palette: 1, accent: '#27f4d2', accent2: '#0a0a0a', car: ['#4fe4cd', '#0a3b37'] },
  { id: 'redbull', name: 'Red Bull Racing', palette: 3, accent: '#3671c6', accent2: '#1e1e27', car: ['#6c9bea', '#0b1030'] },
  { id: 'mclaren', name: 'McLaren', palette: 2, accent: '#ff8000', accent2: '#47c7fc', car: ['#ffb066', '#8a3d00'] },
  { id: 'astonmartin', name: 'Aston Martin', palette: 4, accent: '#229971', accent2: '#cedc00', car: ['#5fbf94', '#0c2016'] },
  { id: 'alpine', name: 'Alpine', palette: 3, accent: '#0090ff', accent2: '#ff87bc', car: ['#4fb3ff', '#0a2a52'] },
  { id: 'williams', name: 'Williams', palette: 1, accent: '#64c4ff', accent2: '#00a0de', car: ['#8fd6ff', '#0d3c66'] },
  { id: 'racingbulls', name: 'Racing Bulls', palette: 3, accent: '#6692ff', accent2: '#c8102e', car: ['#8fb0ff', '#101a40'] },
  { id: 'haas', name: 'Haas', palette: 5, accent: '#b6babd', accent2: '#e6002b', car: ['#d5d8da', '#3a3d40'] },
  { id: 'audi', name: 'Audi', palette: 5, accent: '#bb0a30', accent2: '#c8ccd0', car: ['#dfe2e6', '#1a1a1c'] },
  { id: 'cadillac', name: 'Cadillac', palette: 3, accent: '#0a2240', accent2: '#c9a227', car: ['#4a6188', '#0a1830'] },
  { id: 'neutral', name: 'No Preference', palette: 5, accent: '#e10600', accent2: '#ffc300', car: null }
];
function teamById(id) { return TEAMS.find(t => t.id === id) || null; }

/* Current grid, for Spotlight driver lookup — number + team only (no points, so it never goes stale). */
const DRIVERS = [
  { name: 'Max Verstappen', number: 1, team: 'redbull' },
  { name: 'Yuki Tsunoda', number: 22, team: 'redbull' },
  { name: 'Lewis Hamilton', number: 44, team: 'ferrari' },
  { name: 'Charles Leclerc', number: 16, team: 'ferrari' },
  { name: 'Lando Norris', number: 4, team: 'mclaren' },
  { name: 'Oscar Piastri', number: 81, team: 'mclaren' },
  { name: 'George Russell', number: 63, team: 'mercedes' },
  { name: 'Kimi Antonelli', number: 12, team: 'mercedes' },
  { name: 'Fernando Alonso', number: 14, team: 'astonmartin' },
  { name: 'Lance Stroll', number: 18, team: 'astonmartin' },
  { name: 'Pierre Gasly', number: 10, team: 'alpine' },
  { name: 'Franco Colapinto', number: 43, team: 'alpine' },
  { name: 'Alex Albon', number: 23, team: 'williams' },
  { name: 'Carlos Sainz', number: 55, team: 'williams' },
  { name: 'Isack Hadjar', number: 6, team: 'racingbulls' },
  { name: 'Liam Lawson', number: 30, team: 'racingbulls' },
  { name: 'Esteban Ocon', number: 31, team: 'haas' },
  { name: 'Oliver Bearman', number: 87, team: 'haas' },
  { name: 'Nico Hulkenberg', number: 27, team: 'audi' },
  { name: 'Gabriel Bortoleto', number: 5, team: 'audi' }
];
function driverByName(q) { return DRIVERS.find(d => d.name.toLowerCase() === q.toLowerCase()) || null; }
