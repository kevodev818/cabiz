import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Azure App Service: /home is the persistent, writable storage mount
// Locally: use the project's data/ folder
const DATA_DIR = process.env.WEBSITE_SITE_NAME
  ? path.join('/home', 'data')                    // Azure persistent storage
  : path.join(__dirname, '..', 'data');            // Local dev

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`[DB] Created data directory: ${DATA_DIR}`);
}

export const db = {
  leads: Datastore.create({ filename: path.join(DATA_DIR, 'leads.db'), autoload: true }),
  activity: Datastore.create({ filename: path.join(DATA_DIR, 'activity.db'), autoload: true }),
  settings: Datastore.create({ filename: path.join(DATA_DIR, 'settings.db'), autoload: true }),
  templates: Datastore.create({ filename: path.join(DATA_DIR, 'templates.db'), autoload: true }),
};

// Indexes for performance
db.leads.ensureIndex({ fieldName: 'filingNumber', unique: true });
db.leads.ensureIndex({ fieldName: 'filingDate' });
db.leads.ensureIndex({ fieldName: 'outreachStatus' });
db.activity.ensureIndex({ fieldName: 'timestamp' });

console.log('[DB] NeDB databases loaded from', DATA_DIR);
