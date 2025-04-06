import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const register = catchAsyncErrors(async (req, res, next) => {
  const {
    pinCode,
    address,
    name,
    email,
    phone,
    password,
    addresses,
    employerType,
    role,
    state,
    district,
  } = req.body;

  // Ensure required fields are present
  if (!name || !phone || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please fill full form!",
    });
  }

  // Check if phone already exists
  const isPhone = await User.findOne({ phone });
  if (isPhone) {
    return res.status(400).json({
      success: false,
      message: "Phone number already registered!",
    });
  }

  // Prepare user data
  const userData = {
    pinCode,
    address,
    name,
    phone,
    password,
    role,
    addresses,
    employerType,
    state,
    district,
  };

  // Include email only if Employer
  if (role === "Employer" && email) {
    userData.email = email;
  }

  try {
    console.log(userData);
    const user = await User.create(userData);
    sendToken(user, 201, res, "User Registered Successfully!");
    
  } catch (error) {
    console.log(error);
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register user. Please try again.",
    });
  }
});


export const login = catchAsyncErrors(async (req, res, next) => {
  const { phone, password, role } = req.body;
  if (!phone || !password || !role) {
    return next(new ErrorHandler("Please provide phone, password, and role."));
  }

  const user = await User.findOne({ phone }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found. Please register.", 404));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
console.log(isPasswordMatched);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect password.", 401));
  }

  if (user.role !== role) {
    return next(
      new ErrorHandler(`This user does not have the role '${role}'.`, 403)
    );
  }

  sendToken(user, 200, res, "Logged in successfully!");
});


export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully !",
    });
});

export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateUser = async (req, res) => {
  try {
    const { _id } = req.user;

    // Manually parse non-file form fields (multipart/form-data)
    const { name, phone, address, accountNumber, ifscCode, aadharNumber } =
      req.body;

    // Important: passwords might come as empty strings or undefined
    const oldPassword = req.body.oldPassword?.trim();
    const newPassword = req.body.newPassword?.trim();
    const confirmPassword = req.body.confirmPassword?.trim();

    const userDoc = await User.findById(_id).select("+password");

    if (!userDoc)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ✅ Password update logic
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Please fill all password fields to update password.",
        });
      }

      const isPasswordMatched = await bcrypt.compare(oldPassword, userDoc.password);

      if (!isPasswordMatched) {
        return res.status(401).json({
          success: false,
          message: "Old password is incorrect.",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "New password and confirm password must match.",
        });
      }
      userDoc.password = newPassword;
    }

    // ✅ Prepare update data
    let updateData = {
      name,
      address,
      bankDetails: {
        accountNumber,
        ifscCode,
      },
      kyc: {
        aadharNumber,
      },
    };

    // ✅ File uploads
    const kycDir = path.join(process.cwd(), "kyc_doc");
    const profileDir = path.join(process.cwd(), "profile_photo");
    if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });
    if (!fs.existsSync(profileDir))
      fs.mkdirSync(profileDir, { recursive: true });

    if (userDoc.status !== "active") {
      updateData.phone = phone;

      if (req.files?.aadharFront) {
        const filePath = `kyc_doc/${_id}_aadhar_front.jpg`;
        await req.files.aadharFront.mv(path.join(process.cwd(), filePath));
        updateData.kyc.aadharFront = filePath;
      }

      if (req.files?.aadharBack) {
        const filePath = `kyc_doc/${_id}_aadhar_back.jpg`;
        await req.files.aadharBack.mv(path.join(process.cwd(), filePath));
        updateData.kyc.aadharBack = filePath;
      }
    }

    if (req.files?.profilePhoto) {
      const filePath = `profile_photo/${_id}_profile.jpg`;
      await req.files.profilePhoto.mv(path.join(process.cwd(), filePath));
      updateData.profilePhoto = filePath;
    }

    // ✅ Update fields
    await User.findByIdAndUpdate(_id, updateData);

    // ✅ Save password if it was changed
    if (oldPassword && newPassword && newPassword === confirmPassword) {
      await userDoc.save();
    }

    const updatedUser = await User.findById(_id);
    res.json({
      success: true,
      message: "Updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET AGENTS BASED ON STATE AND CITY
export const getAgents = async (req, res) => {
  try {
    const { state, district: city } = req.query; // 👈 using query instead of body

    const filter = {
      role: "Agent",
      status: "Active",
    };

    if (state) filter.state = state;
    if (city) filter.district = city;

    const agents = await User.find(filter).select("_id name district phone profilePhoto");

    res.status(200).json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error("❌ Error fetching agents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
    });
  }
};

