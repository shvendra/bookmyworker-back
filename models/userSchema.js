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
        // If role is Employer, email is required and must be valid
        if (this.role === "Employer") {
          return validator.isEmail(value || "");
        }
        // For other roles, email can be empty or undefined
        return true;
      },
      message: "Please provide a valid Email for Employers!",
    },
  },
  password: {
    type: String,
    required: true,
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
    type: {},
    enum: ["Individual", "Contractor", "Workshop", "Other"],
    default: {},
  },
  addresses: {
    type: [String],
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
  kyc: {
    aadharFront: {
      type: String,
    },
    aadharBack: {
      type: String,
    },
    aadharNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  profilePhoto: {
    type: String,
  },
  areasOfWork: {
    type: [String],
  },
  dob: {
    type: Date,
  },
  phone: {
    type: String,
    required: [true, "Please provide the mobile number."],
    unique: true,
  },
  bankDetails: {
    ifscCode: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
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
  district: {
    type: String,
  },
  block: {
    type: String,
  },
  profile: {
    type: String,
  }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); 
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const User = mongoose.model("User", userSchema);
