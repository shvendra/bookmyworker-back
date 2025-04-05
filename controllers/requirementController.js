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

export const getFilteredRequirements = catchAsyncErrors(async (req, res, next) => {
  const { role, _id } = req.user;
  const query = {};

  // Role-based filtering
  if (role === "Employer") {
    query.employerId = _id;
  } else if (role === "Agent") {
    query.assignedAgentId = _id;
  }

  // Query param filtering
  if (req.query.ERN_NUMBER) query.ERN_NUMBER = req.query.ERN_NUMBER;
  if (req.query.state) query.state = req.query.state;
  if (req.query.status) query.status = req.query.status;
  if (req.query.workType) query.workType = req.query.workType;

  const requirements = await Requirement.find(query);

  res.status(200).json({
    success: true,
    requirements,
  });
});

