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
    city,
  } = req.body;
  // Ensure that required fields (name, phone, password, and role) are present
  if (!name || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill full form !"));
  }

  // Check if the phone number already exists
  const isPhone = await User.findOne({ phone });
  if (isPhone) {
    return next(new ErrorHandler("Phone number already registered !"));
  }

  // Prepare the user data, including email only if provided
  const userData = {
    address,
    pinCode,
    name,
    phone,
    password,
    role,
    addresses,
    employerType,
    state,
    city,
  };

  // If email is provided, add it to the user data
  if (email) {
    userData.email = email;
  }

  // Create the user with the provided data
  try {
    const user = await User.create(userData);
    sendToken(user, 201, res, "User Registered Successfully !");
  } catch (error) {
    console.error("Error creating user:", error);
    return next(new ErrorHandler("Failed to register user. Please try again."));
  }
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { phone, password, role } = req.body;
  console.log(req.body);
  if (!phone || !password || !role) {
    return next(
      new ErrorHandler("Please provide phone number,password and role !")
    );
  }
  const user = await User.findOne({ phone }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Phone number Or Password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Phone number Or Password !", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(
        `User with provided phone number and ${role} not found !`,
        404
      )
    );
  }
  sendToken(user, 201, res, "User Logged In Sucessfully !");
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
        return res
          .status(400)
          .json({
            success: false,
            message: "All password fields are required",
          });
      }

      const isPasswordMatched = await userDoc.comparePassword(oldPassword);
      if (!isPasswordMatched) {
        return res
          .status(401)
          .json({ success: false, message: "Old password is incorrect" });
      }

      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({
            success: false,
            message: "New password and confirm password do not match",
          });
      }

      userDoc.password = await bcrypt.hash(newPassword, 10);
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
