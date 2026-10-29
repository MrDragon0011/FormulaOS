# FormulaOS

F1 themed desktop OS that runs in the browser. Plain html/css/js, no build step.

Has a dock, menu bar, windows you can drag around, spotlight, launchpad, a fake file system (saved in localStorage) and a bunch of apps:

- Finder, Notepad, Terminal, Browser, Calculator, Sticky Notes
- Photos, Paint, Media Player, Calendar, Weather, Task Manager
- Track Racer (snake)
- Track Atlas, Pit Strategy, Live Timing (pulls real data from OpenF1)
- Settings, lets you pick a favorite team and the whole thing reskins to their livery

Wallpaper and boot screen follow whatever the next race on the calendar is.

Accounts go through Supabase, the url + anon key are in js/supabase-config.js. Leave them blank and it just runs without logins.

## running it

```
python3 -m http.server 8080
```

then go to localhost:8080. `npx serve .` works too

## deploying

netlify config is in netlify.toml

```
npx netlify-cli deploy --prod
```
