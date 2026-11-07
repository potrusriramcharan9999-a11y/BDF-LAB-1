const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Determine database file path based on environment variables for Render persistent disk support
let dbPath;
if (process.env.DB_PATH) {
  dbPath = process.env.DB_PATH;
} else if (process.env.DB_DIR) {
  dbPath = path.join(process.env.DB_DIR, 'books.db');
} else {
  dbPath = path.join(__dirname, 'books.db');
}

// Ensure the directory for the database file exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[Database] Connecting to SQLite at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[Database] Connection failed:', err.message);
  } else {
    console.log('[Database] Connected to SQLite database successfully.');
  }
});

// Initialize database schema and initial data
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create books table if it does not already exist
      db.run(`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          price REAL NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('[Database] Failed to create table:', err.message);
          return reject(err);
        }

        // Check if table already contains data to avoid duplicate inserts on restart
        db.get('SELECT COUNT(*) AS count FROM books', [], (countErr, row) => {
          if (countErr) {
            console.error('[Database] Failed to query row count:', countErr.message);
            return reject(countErr);
          }

          if (row.count === 0) {
            console.log('[Database] Inserting initial sample books...');
            const sampleBooks = [
              ['Clean Code', 'Robert C. Martin', 450.00],
              ['The Pragmatic Programmer', 'Andrew Hunt', 550.00],
              ['JavaScript: The Good Parts', 'Douglas Crockford', 300.00],
              ['Learning SQL', 'Alan Beaulieu', 250.00],
              ['Java: The Complete Reference', 'Herbert Schildt', 480.00],
              ['Node.js Web Development', 'David Herron', 380.00],
              ['Effective Java', 'Joshua Bloch', 420.00],
              ['Introduction to Algorithms', 'Thomas H. Cormen', 850.00],
              ['Head First Design Patterns', 'Eric Freeman', 520.00],
              ["You Don't Know JS", 'Kyle Simpson', 200.00]
            ];

            const stmt = db.prepare('INSERT INTO books (title, author, price) VALUES (?, ?, ?)');
            for (const book of sampleBooks) {
              stmt.run(book);
            }
            stmt.finalize((finalizeErr) => {
              if (finalizeErr) {
                console.error('[Database] Error finalizing insert statement:', finalizeErr.message);
                return reject(finalizeErr);
              }
              console.log('[Database] Initial sample books seeded successfully.');
              resolve();
            });
          } else {
            console.log(`[Database] Table already seeded with ${row.count} books. Preserving existing records.`);
            resolve();
          }
        });
      });
    });
  });
}

// Promise wrapper for db.all (multiple rows)
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Promise wrapper for db.get (single row)
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// Promise wrapper for db.run (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  db,
  dbPath,
  initializeDatabase,
  all,
  get,
  run
};

