# Lunora

**Not just tracking. Guiding.** A gentle daily companion for menstrual and hormonal health: PCOS or PCOD, period tracking, menopause, fertility and pregnancy.

Built for Next Byte Hacks V5 by Srishti Singh.

## Features
Sign up and login (Supabase Auth), a personalised plan from a short profile, a five-step daily plan with progress and streak, a daily log (mood, skin, sleep, water, weight, period, sugar), an insights page, a meal checker and a printable doctor report. Each user's data is private through Row Level Security.

## Run it
1. Create a free project at supabase.com.
2. In **SQL Editor**, paste and run `schema.sql`.
3. In **Authentication > Providers > Email**, turn off "Confirm email" for easy demos.
4. In **Project Settings > API**, copy the Project URL and the `anon` public key into `config.js`. Never use the `service_role` key.
5. Also run `schema_update.sql` (cycle calendar and community).
6. Open `index.html` (or run `python -m http.server`). On the **Log** tab, load sample data to see Insights.

## Deploy
Push to GitHub, then **Settings > Pages**, branch `main`, folder `/ (root)`. Site: `https://YOUR-USERNAME.github.io/lunora/`

## Tech
HTML, CSS, vanilla JavaScript, Supabase (Auth and Postgres).

## Disclaimer
General lifestyle guidance, not medical advice.
