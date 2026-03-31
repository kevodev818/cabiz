import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

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
