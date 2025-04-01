import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [100, "Name cannot exceed 100 Characters!"],
  },
  email: {
    type: String,
    validate: {
      validator: function (value) {
        // Only validate if email is provided
        return !value || validator.isEmail(value);
      },
      message: "Please provide a valid Email!",
    },
  },
  password: {
    type: String,
    required: [true, "Please provide a Password!"],
    minLength: [8, "Password must contain at least 8 characters!"],
    maxLength: [32, "Password cannot exceed 32 characters!"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please select a role"],
    enum: ["Agent", "Worker", "Employer", "Admin"],
  },
  address: {
    type: String,
  },
  employerType: {
    type: {}, // Array to store multiple employer types if needed
    enum: ["Individual", "Contractor", "Workshop", "Other"],
    default: {},
  },
  addresses: {
    type: [String], // Array of addresses
    default: [],
  },
  status: {
    type: String,
    default: "Inactive",
    enum: ["Inactive", "Active", "Block"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  areasOfWork: {
    type: [String], // An array of areas where the worker is available to work
  },
  dob: {
    type: Date,
  },
  phone: {
    type: String,
    required: [true, "Please provide the mobile number."],
    unique: true,
  },
  aadhar: {
    type: String,
    unique: true,
    sparse: true, // This allows multiple 'null' values for aadhar
  },
  ifscCode: {
    type: String,
  },
  bankAccount: {
    type: String,
  },
  pinCode: {
    type: String,
  },
  postedBy: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  profile: {
    type: String,
  }
});

// ENCRYPTING THE PASSWORD WHEN THE USER REGISTERS OR MODIFIES HIS PASSWORD
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// COMPARING THE USER PASSWORD ENTERED BY USER WITH THE USER SAVED PASSWORD
userSchema.methods.comparePassword = async function (enteredPassword) {
  console.log(enteredPassword);
  return await bcrypt.compare(enteredPassword, this.password);
};

// GENERATING A JWT TOKEN WHEN A USER REGISTERS OR LOGINS
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const User = mongoose.model("User", userSchema);
