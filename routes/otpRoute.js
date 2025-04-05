import express from "express";
import fetch from "node-fetch"; // Use node-fetch for GET requests
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const message = `Your OTP is ${otp}`; // Customize as per DLT template

    const params = new URLSearchParams({
      authorization: process.env.FAST2SMS_API_KEY,
      route: "dlt_manual",
      sender_id: process.env.FAST2SMS_SENDER_ID,
      template_id: process.env.FAST2SMS_TEMPLATE_ID,
      entity_id: process.env.FAST2SMS_ENTITY_ID,
      message,
      numbers: phone,
      flash: "0",
    });

    const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?${params}`);
    const data = await response.json();

    if (data.return) {
      res.status(200).json({ message: "OTP sent successfully", otp }); // 🔒 Don't send OTP in production
    } else {
      res.status(500).json({ message: "Failed to send OTP", detail: data });
    }
  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
