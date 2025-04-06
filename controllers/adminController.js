import { createCanvas } from "canvas";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { sendToken } from "../utils/jwtToken.js";

function generateCaptchaText() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let text = "";
  for (let i = 0; i < 6; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateCaptchaImage(text) {
  const canvas = createCanvas(150, 50);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, 150, 50);

  ctx.font = "30px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText(text, 20, 35);

  return canvas.toDataURL(); // base64 PNG
}

export const getCaptcha = (req, res) => {
  const captchaText = generateCaptchaText();
  const captchaImage = generateCaptchaImage(captchaText);
  req.session.captcha = captchaText;
  res.json({ image: captchaImage });
};

// export const loginAdmin = (req, res) => {
//   const { phone, otp, captcha } = req.body;

//   if (!req.session.captcha) {
//     return res.status(400).json({ message: "Captcha not found. Try again." });
//   }

//   if (captcha.toUpperCase() !== req.session.captcha.toUpperCase()) {
//     return res.status(400).json({ message: "Invalid CAPTCHA" });
//   }

//   req.session.captcha = null;

//   if (phone === "9584042741" && otp === "123456") {
//     return res.json({ message: "Login successful!" });
//   }

//   return res.status(401).json({ message: "Invalid phone or OTP" });
// };
export const loginAdmin = catchAsyncErrors(async (req, res, next) => {
    const { phone, password, role } = req.body;
    if (!phone) {
      return next(new ErrorHandler("Please provide phone, password, and role."));
    }
    const user = await User.findOne({ phone }).select("+role");
    console.log(user);
    if (!user) {
      return next(new ErrorHandler("User not found. Please register.", 404));
    }
    if(user.role === "Admin") {
        sendToken(user, 200, res, "Logged in successfully!");
    }
  });