const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new sqlite3.Database('./interactions.db', (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      console.error('❌ Failed to send index.html:', err.message);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Create table
db.run(`CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_command TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) {
    console.error('❌ Table creation failed:', err.message);
  } else {
    console.log('✅ Table created or already exists');
  }
});

// Save interaction
app.post('/save', (req, res) => {
  const { user_command, assistant_response } = req.body;
  if (!user_command || !assistant_response) {
    return res.status(400).send('Missing required fields');
  }

  db.run(`INSERT INTO interactions (user_command, assistant_response) VALUES (?, ?)`,
    [user_command, assistant_response],
    function (err) {
      if (err) {
        console.error('❌ Failed to save interaction:', err.message);
        return res.status(500).send(err.message);
      }
      res.send({ id: this.lastID });
    });
});

// Get history
app.get('/history', (req, res) => {
  db.all(`SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 20`, [], (err, rows) => {
    if (err) {
      console.error('❌ Failed to fetch history:', err.message);
      return res.status(500).send(err.message);
    }
    res.send(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
