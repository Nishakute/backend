const express = require("express");
const app = express();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

require("dotenv").config();
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const Port = process.env.PORT || 5000;

const userRoutes = require("./routes/userRoutes");

app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome To login registration system" });
});

let otpStore = {};

// Generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Configure nodemailer transporter (use Gmail as an example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password (if 2FA enabled)
  },
});

// OTP sending route
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  console.log('Received Email:', email);

  // Check if email is provided
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Validate the email format (optional but recommended)
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Generate OTP
  const otp = generateOtp();
  otpStore[email] = otp; // Store OTP in memory for verification later
  console.log('Generated OTP:', otp); // Log the OTP for testing purposes (remove in production)

  // Send OTP email
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('OTP sent successfully to', email);
    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const storedOtp = otpStore[email];

  if (!storedOtp) {
    return res.status(400).json({ message: 'OTP not sent for this email' });
  }

  if (storedOtp === otp) {
    // OTP is correct, proceed with signup or login
    return res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ message: 'Incorrect OTP' });
  }
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Page Not Found"});
});

app.listen(Port, () => {
  console.log(`Listening on port ${Port}`);
});

