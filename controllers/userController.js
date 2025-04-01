import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { pinCode, address, name, email, phone, password, addresses, employerType, role, state, city } = req.body;
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
    city
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
  console.log(req.body)
  if (!phone || !password || !role) {
    return next(new ErrorHandler("Please provide phone number,password and role !"));
  }
  const user = await User.findOne({ phone }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Phone number Or Password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  console.log(isPasswordMatched);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Phone number Or Password !", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided phone number and ${role} not found !`, 404)
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