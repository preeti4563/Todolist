const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// MySQL database connection configuration
const db = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'test'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// JWT Secret Key
const JWT_SECRET = 'your_secret_key';

// Middleware for JWT Authorization
const authorize = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Create a new JWT token when a user logs in
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Authenticate user (replace with your authentication logic)
  if (username === 'user123' && password === 'password123') {
    const user = { id: 1, username: 'user123' };
    const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Create a new Todo item
app.post('/todos', authorize, (req, res) => {
  const { title, description } = req.body;

  const newTodo = {
    title,
    description,
    status: 'not completed',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  db.query('INSERT INTO todos SET ?', newTodo, (err, result) => {
    if (err) {
      console.error('Error creating Todo:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(201).json({ message: 'Todo created successfully', id: result.insertId });
    }
  });
});

// Fetch all Todo items
app.get('/todos', authorize, (req, res) => {
  db.query('SELECT * FROM todos', (err, results) => {
    if (err) {
      console.error('Error fetching todos:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});

// Fetch Todo item by ID
app.get('/todos/:id', authorize, (req, res) => {
  const todoId = req.params.id;

  db.query('SELECT * FROM todos WHERE id = ?', todoId, (err, results) => {
    if (err) {
      console.error('Error fetching todo:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'Todo not found' });
    } else {
      res.json(results[0]);
    }
  });
});

// Update Todo item by ID
app.put('/todos/:id', authorize, (req, res) => {
  const todoId = req.params.id;
  const { title, description, status } = req.body;

  const updatedTodo = {
    title,
    description,
    status,
    updatedAt: new Date()
  };

  db.query('UPDATE todos SET ? WHERE id = ?', [updatedTodo, todoId], (err, result) => {
    if (err) {
      console.error('Error updating todo:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Todo not found' });
    } else {
      res.json({ message: 'Todo updated successfully' });
    }
  });
});

// Delete Todo item by ID
app.delete('/todos/:id', authorize, (req, res) => {
  const todoId = req.params.id;

  db.query('DELETE FROM todos WHERE id = ?', todoId, (err, result) => {
    if (err) {
      console.error('Error deleting todo:', err);
      res.status(500).json({ message: 'Internal server error' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Todo not found' });
    } else {
      res.json({ message: 'Todo deleted successfully' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
