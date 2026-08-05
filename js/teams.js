/* FormulaOS team liveries — applied when a signed-in user picks a favorite team */
const TEAMS = [
  { id: 'ferrari', name: 'Ferrari', palette: 0, accent: '#e10600', accent2: '#ffc300', car: ['#ff6b5e', '#a81414'] },
  { id: 'mercedes', name: 'Mercedes', palette: 1, accent: '#00d2be', accent2: '#c9d6d4', car: ['#4fc9c0', '#0a3b37'] },
  { id: 'mclaren', name: 'McLaren', palette: 2, accent: '#ff8000', accent2: '#47c7fc', car: ['#ffb066', '#8a3d00'] },
  { id: 'redbull', name: 'Red Bull', palette: 3, accent: '#3671c6', accent2: '#e10600', car: ['#6c9bea', '#0b1030'] },
  { id: 'astonmartin', name: 'Aston Martin', palette: 4, accent: '#229971', accent2: '#ccdc00', car: ['#5fbf94', '#0c2016'] },
  { id: 'neutral', name: 'No Preference', palette: 5, accent: '#e10600', accent2: '#ffc300', car: null }
];
function teamById(id) { return TEAMS.find(t => t.id === id) || null; }
