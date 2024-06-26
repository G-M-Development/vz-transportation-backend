const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const cors = require("cors");
const { config } = require("dotenv");
const fs = require("fs").promises;

config();

const { PORT, FROM_MAIL, TO_MAIL, MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_RASS } = process.env;
const app = express();
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: Number(MAIL_PORT),
  secure: MAIL_SECURE === "true",
  auth: {
    user: MAIL_USER,
    pass: MAIL_RASS,
  },
});

app.post("/send-email", upload.array("images", 3), async (req, res) => {
  try {
    const images = req.files;

    const attachments = images.map((img) => ({
      filename: img.originalname,
      path: img.path,
    }));

    const mailOptions = {
      from: FROM_MAIL,
      to: TO_MAIL,
      subject: req.body.subject,
      attachments: attachments,
      html: generateEmailHtml(req.body),
    };

    await transporter.sendMail(mailOptions);

    const deleteFilePromises = images.map((img) =>
      fs
        .unlink(img.path)
        .then(() => {})
        .catch((err) => {})
    );

    await Promise.all(deleteFilePromises);
    res.send("Email sent and files deleted successfully");
  } catch (error) {
    res.status(500).send("Error sending email");

    const images = req.files;
    const deleteFilePromises = images.map((img) =>
      fs
        .unlink(img.path)
        .then(() => {})
        .catch((err) => {})
    );

    await Promise.all(deleteFilePromises);
  }
});

function generateEmailHtml(body) {
  let htmlContent = "";

  if (body.FirstName) {
    htmlContent += `<p>Name: ${body.FirstName}</p>`;
  }
  if (body.LastName) {
    htmlContent += `<p>LastName: ${body.LastName}</p>`;
  }
  if (body.phone) {
    htmlContent += `<p>Phone: ${body.phone}</p>`;
  }
  if (body.dateOfBirth) {
    htmlContent += `<p>Date of Birth: ${body.dateOfBirth}</p>`;
  }
  if (body.truck) {
    htmlContent += `<p>Truck: ${body.truck}</p>`;
  }
  if (body.experience) {
    htmlContent += `<p>Experience: ${body.experience}</p>`;
  }
  if (body.comment) {
    htmlContent += `<p>Comment: ${body.comment}</p>`;
  }
  if (body.preferredTruck) {
    htmlContent += `<p>Preferred Truck: ${body.preferredTruck}</p>`;
  }

  return htmlContent || "<p>No data provided.</p>";
}

app.listen(PORT);
