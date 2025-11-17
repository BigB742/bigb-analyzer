# Fantasy Analyzer

## Environment

Configure the backend (`server/.env`) with the following variables:

- `MONGO_URI` – connection string for the stats database
- `DATA_SOURCE` – stats provider key (default: `sleeper`)
- `SEASON` – default season year used by the API (e.g., `2025`)

Configure the client (`client/.env`) with:

- `VITE_API_URL` – base URL for the backend (e.g., `http://localhost:5001`)
- `VITE_SEASON` – season year to display in the UI
- `VITE_INITIAL_WEEK` – optional override for the default week selector

## Backfill & Sync

Run a one-off backfill for the current season:

```sh
cd server
npm run stats:backfill -- --season 2025 --fromWeek 1 --toWeek <currentWeek>
```

Fetch or refresh a single week on demand:

```sh
cd server
npm run stats:sync:week -- --season 2025 --week <weekNumber>
```

## Diagnostics

- `GET /api/stats/weekly?season=2025&week=W` – weekly normalized stats with caching
- `GET /api/stats/season?season=2025` – season totals with last-updated timestamps
- `GET /api/debug/missing-stats?season=2025&week=W` – players without a matching stats row
- `GET /api/health` – verifies database connectivity and reports the most recent stat ingest

The frontend refresh button re-requests the active endpoint and displays “Last updated” based on the latest ingest timestamp returned by the API.
