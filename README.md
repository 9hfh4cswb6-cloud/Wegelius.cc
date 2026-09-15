# Rider Race Calendar

A resource-timeline view (rows = riders, bars = race assignments) over the team's
Airtable base, for the cases Airtable's own Calendar view and Interfaces can't render
— a per-rider row Gantt grid. Airtable stays the database; this is just the missing
view. Read-only for now — editing (drag to reassign, add/remove entries) comes next.

Built with Next.js (App Router, TypeScript), [vis-timeline](https://visjs.github.io/vis-timeline/docs/timeline/)
(MIT licensed) for the grid, and Tailwind for layout. All Airtable calls happen
server-side; the Personal Access Token never reaches the browser.

## Running locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values:

   ```bash
   cp .env.local.example .env.local
   ```

   - `AIRTABLE_PAT` — a [Personal Access Token](https://airtable.com/create/tokens) with
     `data.records:read` and `data.records:write` scopes on the base below.
   - `AIRTABLE_BASE_ID` — `apphjQDK3xvqQiTFc`.
   - `APP_PASSWORD` — the shared password for the login gate (see below). Pick something
     real — the scaffolded value is `changeme`.
   - `AUTH_SECRET` — a random string used to sign the login cookie. Generate one with
     `openssl rand -hex 32`.

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and log in with `APP_PASSWORD`.

## How it's deployed

Deploys to [Vercel](https://vercel.com) as a standard Next.js app — connect the repo
and set `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `APP_PASSWORD`, and `AUTH_SECRET` as
Environment Variables in the Vercel project settings (values are never committed;
`.env.local` is gitignored).

The app sits behind a shared-password gate ([`src/proxy.ts`](src/proxy.ts)) since it's
a public Vercel URL holding real roster data but isn't meant to be publicly accessible.
There's no per-user auth — everyone with the password sees and can eventually edit
everything.

## Data model notes

Field/table IDs for the Airtable base are pinned in [`src/lib/airtable/schema.ts`](src/lib/airtable/schema.ts),
confirmed against the live schema rather than assumed:

- **Race Entries** (`tbldf1cU7idU7nMgZ`) is the join table: one record per
  rider-on-a-race. Only `Race Block`, `Rider`, and `Role` (Starter/Reserve) are
  writable. `Start Date`, `End Date`, and `Status` are lookups from the linked Race
  Block/Rider — the API rejects writes to them, so this app never attempts to.
- Because a Race Entry's dates come entirely from its linked **Race Block**
  (`tblX5sq6vUmL9eKHe`), every rider assigned to a race shares the same dates.
  Dragging a rider's bar to a new position reassigns which Race Block it links to
  (snapping to that block's existing dates) rather than free-editing the entry's own
  dates. To actually move or resize a race, edit the Race Block itself — which shifts
  every rider in that lineup, which is the correct behavior for a team-wide schedule
  change.
- **Google Calendar Event ID** on Race Entries is owned by an existing sync job and is
  never written to by this app.
- **Race Calendar Days** (`tblFznv28eHBJ937S`) is a manually-expanded workaround table
  this app doesn't read or write. Once this app is the primary way the calendar gets
  edited, it's likely safe to retire — worth confirming nothing else in the base still
  depends on it being populated.
- Airtable's API rate limit (5 requests/sec per base) is enforced by a simple
  in-memory request queue in [`src/lib/airtable/client.ts`](src/lib/airtable/client.ts).
