const fs = require('fs');
let code = fs.readFileSync('src/screens/Altars.jsx', 'utf8');

if (!code.includes('const [profile, setProfile]')) {
  // Add state
  const stateAnchor = `  const [displayedAltar, setDisplayedAltar] = useState('Crown');`;
  const stateInsert = `  const [displayedAltar, setDisplayedAltar] = useState('Crown');
  const [profile, setProfile] = useState(null);`;
  code = code.replace(stateAnchor, stateInsert);

  // Add fetch in loadData
  const fetchAnchor = `      const itemsData = await fetchHydratedItems();`;
  const fetchInsert = `      const { data: userProfile } = await supabase.from('user_profile').select('*').maybeSingle();
      if (userProfile) setProfile(userProfile);
      const itemsData = await fetchHydratedItems();`;
  code = code.replace(fetchAnchor, fetchInsert);

  // Update buildBaseRoutines calls
  code = code.replace(/buildBaseRoutines\(items, \{\}\)/g, 'buildBaseRoutines(items, profile || {})');
  code = code.replace(/buildBaseRoutines\(domainItems, \{\}\)/g, 'buildBaseRoutines(domainItems, profile || {})');
  code = code.replace(/buildBaseRoutines\(itemsInRhythm, \{\}\)/g, 'buildBaseRoutines(itemsInRhythm, profile || {})');

  fs.writeFileSync('src/screens/Altars.jsx', code);
  console.log('Altars.jsx patched for profile fetching.');
} else {
  console.log('Altars.jsx already has profile.');
}
