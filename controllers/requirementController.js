import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import {Requirement} from "../models/requirementSchema.js";

// Insert Requirement (Only Employer Can Create)
export const insertRequirement = catchAsyncErrors(async (req, res, next) => {
  const { role, _id, name, phone } = req.user;

  if (role !== "Employer") {
    return next(new ErrorHandler("Only Employers can create requirements.", 403));
  }

  const requiredFields = [
    "workType",
    "workerQuantityUnskilled",
    "workerQuantitySkilled",
    "workLocation",
    "workerNeedDate",
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

// Get Requirements by Employer ID
export const getRequirementsByEmployerId = catchAsyncErrors(async (req, res, next) => {
  const { employerId } = req.params;

  const requirements = await Requirement.find({ employerId });

  res.status(200).json({
    success: true,
    requirements,
  });
});

// Get All Requirements
export const getAllRequirements = catchAsyncErrors(async (req, res, next) => {
  const requirements = await Requirement.find();

  res.status(200).json({
    success: true,
    requirements,
  });
});
