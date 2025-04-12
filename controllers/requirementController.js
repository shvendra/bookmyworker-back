import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import {Requirement} from "../models/requirementSchema.js";
import mongoose from "mongoose";

// Insert Requirement (Only Employer Can Create)
export const insertRequirement = catchAsyncErrors(async (req, res, next) => {
  const { role, _id, name, phone } = req.user;

  if (role !== "Employer") {
    return next(new ErrorHandler("Only Employers can create requirements.", 403));
  }

  const requiredFields = [
    "workType",
    "workerQuantitySkilled",
    "state",
    "district",
  ];

  for (let field of requiredFields) {
    if (!req.body[field]) {
      return next(new ErrorHandler(`Missing required field: ${field}`, 400));
    }
  }

  const requirementData = {
    ...req.body,
    employerId: _id,
    employerName: name,
    employerPhone: phone,
  };

  const requirement = await Requirement.create(requirementData);

  res.status(201).json({
    success: true,
    message: "Requirement posted successfully!",
    requirement,
  });
});

export const getFilteredRequirements = catchAsyncErrors(async (req, res, next) => {
  const { role, _id, district } = req.user;
  const query = {};

  // Role-based filtering
  if (role === "Employer") {
    query.employerId = _id;
  } else if (role === "Agent") {
    query.district = district;
  }

  // Query param filtering
  if (req.query.ERN_NUMBER) query.ERN_NUMBER = req.query.ERN_NUMBER;
  if (req.query.state) query.state = req.query.state;
  if (req.query.district) query.district = req.query.district;
  if (req.query.status) query.status = req.query.status;
  if (req.query.workType) query.workType = req.query.workType;

  const requirements = await Requirement.find(query);

  res.status(200).json({
    success: true,
    requirements,
  });
});

export const assignAgentToRequirement = catchAsyncErrors(async (req, res, next) => {
  const { agentId, ern,
    assignedAgentName,
    assignedAgentPhone
  } = req.body;

  if (!agentId || !ern) {
    return next(new ErrorHandler("Missing agentId or ern", 400));
  }

  const requirement = await Requirement.findOne({ ERN_NUMBER: ern });
  if (!requirement) {
    return next(new ErrorHandler("Requirement not found with given ERN", 404));
  }

  requirement.assignedAgentId = agentId;
  requirement.status = "Assigned";
  requirement.assignedAgentName = assignedAgentName;
  requirement.assignedAgentPhone = assignedAgentPhone;
  await requirement.save();

  res.status(200).json({
    success: true,
    message: "Agent assigned successfully",
    requirement,
  });
});

// export const expressInterest = catchAsyncErrors(async (req, res, next) => {
//   const { id } = req.params; // This is a string
//   const agentId = req.user._id; // Also a string or ObjectId

//   // Optional: validate ID format
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ success: false, message: "Invalid requirement ID" });
//   }

//   // Use $addToSet to prevent duplicates — only adds if not already present
//   const updatedRequirement = await Requirement.findByIdAndUpdate(
//     id,
//     { $addToSet: { intrestedAgents: agentId } },
//     { new: true }
//   );

//   if (!updatedRequirement) {
//     return res.status(404).json({ success: false, message: "Requirement not found" });
//   }

//   return res.json({
//     success: true,
//     message: "Interest submitted successfully",
//     data: updatedRequirement.intrestedAgents,
//   });
// });
export const expressInterest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // This is a string
  const agentId = req.user._id; // Also a string or ObjectId
  const { wage } = req.body; // Add wage to support per-head wage

  // Validate inputs
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new Error("Invalid requirement ID"));
  }

  if (!wage || isNaN(wage)) {
    return next(new Error("Invalid wage input"));
  }

  // Use $addToSet to prevent duplicates
  const requirement = await Requirement.findById(id);
  if (!requirement) {
    return next(new Error("Requirement not found"));
  }
  const alreadyInterested = requirement?.intrestedAgents.some(
    (entry) => entry?.agentId?.equals(agentId)
  );
if(!alreadyInterested) {
  const updatedRequirement = await Requirement.findByIdAndUpdate(
    id,
    {
      $addToSet: {
        intrestedAgents: { agentId, agentRequiredWage: wage },
      },
    },
    { new: true }
  );
  if (!updatedRequirement) {
    return next(new Error("Requirement not found"));
  }

  return res.json({
    success: true,
    message: "Interest submitted successfully",
    data: updatedRequirement.intrestedAgents,
  });
} else {
  return res.json({
    success: false,
    message: "You have already expressed interest in this requirement",
  })
  

 
}});
