const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const uuid = require('uuid');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// MySQL database connection configuration
const db = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'test'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


// Register a new user
app.post('/register', (req, res) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Save the user and OTP to the database
  const userId = uuid.v4();
  const userData = {
    id: userId,
    firstName,
    lastName,
    email,
    phoneNumber,
    otp,
  };

  db.query('INSERT INTO users SET ?', userData, (err, result) => {
    if (err) {
      console.error('Error saving user data:', err);
      res.status(500).json({ error: 'Error saving user data' });
    } else {
      // Send OTP to the user's email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.GMAIL_USERNAME,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for registration is: ${otp}`,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error('Error sending email:', err);
          res.status(500).json({ error: 'Error sending email' });
        } else {
          res.json({ message: 'User registered successfully', userId });
        }
      });
    }
  });
});

// Verify OTP and log in the user
app.post('/login', (req, res) => {
  const { email, otp } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? AND otp = ?',
    [email, otp],
    (err, result) => {
      if (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Error fetching user data' });
      } else if (result.length === 0) {
        res.status(401).json({ error: 'Invalid email or OTP' });
      } else {
        const user = result[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // TODO: You can generate and return a JWT token here for authentication
        res.json({
          message: 'Login successful',
          user,
          token,
        });
      }
    }
  );
});




// Start the server
app.listen(3001, () => {
  console.log('Server started on port 3001');
});
