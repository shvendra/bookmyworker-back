import mongoose from "mongoose";

// Function to generate a unique 6-digit ERN_NUMBER
async function generateUniqueERN() {
  let isUnique = false;
  let newERN;

  while (!isUnique) {
    newERN = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    const existingERN = await Requirement.findOne({ ERN_NUMBER: newERN });
    if (!existingERN) isUnique = true;
  }

  return newERN;
}

// Define Schema
const requirementSchema = new mongoose.Schema({
  workType: { type: String, required: true }, // ✅ Required
  workerQuantityUnskilled: { type: Number, required: true }, // ✅ Required
  workerQuantitySkilled: { type: Number, required: true }, // ✅ Required
  workLocation: { type: String, required: true }, // ✅ Required
  workerNeedDate: { type: Date, required: true }, // ✅ Required
  state: { type: String, required: true }, // ✅ Required
  district: { type: String, required: true }, // ✅ Required

  ageGroup: { type: String },
  budgetPerWorker: { type: Number },
  minBudgetPerWorker: { type: Number },
  maxBudgetPerWorker: { type: Number },
  inTime: { type: String },
  outTime: { type: String },
  remarks: { type: String },
  selectedCategories: { type: [String], default: [] },

  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employerName: { type: String, required: true },
  employerPhone: { type: String, required: true },
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "Pending" }, // Default status
  intrestedAgents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  assignedAgentName: { type: String },
  assignedAgentPhone: { type: String },
  ERN_NUMBER: { type: Number, unique: true }
}, { timestamps: true });

// Middleware to ensure unique ERN_NUMBER before saving
requirementSchema.pre("save", async function (next) {
  if (!this.ERN_NUMBER) {
    this.ERN_NUMBER = await generateUniqueERN();
  }
  if (this.workerNeedDate) {
    const dateOnly = new Date(this.workerNeedDate);
    dateOnly.setUTCHours(0, 0, 0, 0); // Reset time
    this.workerNeedDate = dateOnly;
  }
  next();
});

export const Requirement = mongoose.model("Requirement", requirementSchema);


