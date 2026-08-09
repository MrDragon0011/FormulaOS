/* FormulaOS accounts — thin wrapper around Supabase Auth + a `profiles` table
   with a single `favorite_team` column. Degrades to "not configured" cleanly
   when js/supabase-config.js is left blank. */
const Auth = (() => {
  let client = null, user = null, profile = null, ready = false;
  const listeners = [];

  function configured() {
    return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
  }

  function notify() { listeners.forEach(cb => cb({ user, profile, ready })); }
  function onChange(cb) { listeners.push(cb); }

  async function loadProfile() {
    const { data } = await client.from('profiles').select('*').eq('id', user.id).single();
    profile = data || null;
    if (!profile || !profile.username) {
      const pendingUsername = user.user_metadata && user.user_metadata.username;
      if (pendingUsername) {
        const { data: upserted, error } = await client.from('profiles')
          .upsert({ id: user.id, username: pendingUsername, updated_at: new Date().toISOString() })
          .select().single();
        if (upserted) profile = upserted;
        else if (error) console.warn('FormulaOS: could not save username to profile —', error.message);
      }
    }
    ready = true;
    notify();
  }

  function init() {
    if (!configured() || typeof supabase === 'undefined') { ready = true; notify(); return; }
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    client.auth.onAuthStateChange((_event, session) => {
      user = session ? session.user : null;
      if (user) loadProfile(); else { profile = null; ready = true; notify(); }
    });
  }

  function validateCredentials(email, password) {
    if (!email) throw new Error('Enter an email address.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    if (!password) throw new Error('Enter a password.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  }
  function validateUsername(username) {
    if (!username) throw new Error('Choose a username.');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) throw new Error('Username must be 3-20 characters: letters, numbers, underscores.');
  }
  async function signUp(email, password, username) {
    if (!client) throw new Error('Supabase is not configured yet.');
    validateUsername(username);
    validateCredentials(email, password);
    const { error } = await client.auth.signUp({ email, password, options: { data: { username } } });
    if (error) {
      if (/duplicate|already exists/i.test(error.message)) throw new Error('That username is taken.');
      throw error;
    }
  }
  async function signIn(email, password) {
    if (!client) throw new Error('Supabase is not configured yet.');
    validateCredentials(email, password);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  async function signOut() {
    if (client) await client.auth.signOut();
  }
  async function signInWithGoogle() {
    if (!client) throw new Error('Supabase is not configured yet.');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) throw error;
    // On success the browser navigates away to Google, then back — nothing more to do here.
  }
  async function setFavoriteTeam(teamId) {
    if (!client || !user) throw new Error('Sign in first.');
    const { error } = await client.from('profiles').upsert({ id: user.id, favorite_team: teamId, updated_at: new Date().toISOString() });
    if (error) throw error;
    profile = Object.assign({}, profile, { favorite_team: teamId });
    notify();
  }

  function currentUser() { return user; }
  function currentProfile() { return profile; }
  function isReady() { return ready; }

  return { configured, init, onChange, signUp, signIn, signOut, signInWithGoogle, setFavoriteTeam, currentUser, currentProfile, isReady };
})();
