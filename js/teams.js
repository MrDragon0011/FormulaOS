/* FormulaOS team liveries — applied when a signed-in user picks a favorite team.
   `palette` reuses the closest-matching wallpaper color family (only 6 exist);
   `accent`/`car` carry each team's real distinct identity regardless. */
const TEAMS = [
  { id: 'ferrari', name: 'Ferrari', palette: 0, accent: '#e8002d', accent2: '#fff200', car: ['#ff6b5e', '#a81414'] },
  { id: 'mercedes', name: 'Mercedes', palette: 1, accent: '#27f4d2', accent2: '#0a0a0a', car: ['#4fe4cd', '#0a3b37'] },
  { id: 'redbull', name: 'Red Bull', palette: 3, accent: '#3671c6', accent2: '#1e1e27', car: ['#6c9bea', '#0b1030'] },
  { id: 'mclaren', name: 'McLaren', palette: 2, accent: '#ff8000', accent2: '#47c7fc', car: ['#ffb066', '#8a3d00'] },
  { id: 'astonmartin', name: 'Aston Martin', palette: 4, accent: '#229971', accent2: '#cedc00', car: ['#5fbf94', '#0c2016'] },
  { id: 'alpine', name: 'Alpine', palette: 3, accent: '#0090ff', accent2: '#ff87bc', car: ['#4fb3ff', '#0a2a52'] },
  { id: 'williams', name: 'Williams', palette: 1, accent: '#64c4ff', accent2: '#00a0de', car: ['#8fd6ff', '#0d3c66'] },
  { id: 'racingbulls', name: 'Racing Bulls', palette: 3, accent: '#6692ff', accent2: '#c8102e', car: ['#8fb0ff', '#101a40'] },
  { id: 'sauber', name: 'Kick Sauber', palette: 4, accent: '#52e252', accent2: '#0a0a0a', car: ['#7ef07e', '#0e2e10'] },
  { id: 'haas', name: 'Haas', palette: 5, accent: '#b6babd', accent2: '#e6002b', car: ['#d5d8da', '#3a3d40'] },
  { id: 'neutral', name: 'No Preference', palette: 5, accent: '#e10600', accent2: '#ffc300', car: null }
];
function teamById(id) { return TEAMS.find(t => t.id === id) || null; }
