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
console.log(requirement);
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

