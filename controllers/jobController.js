import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const { role, state, district, page = 1, limit = 10, search = "" } = req.query;

  const query = {
    ...(role && { role }),
    ...(state && { state }),
    ...(district && { district }),
    $or: [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
    ],
  };

  const total = await User.countDocuments(query);
  const jobs = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    jobs,
    total,
  });
});



export const postJob = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    areasOfWork,
    workExperience,
    fixedSalary,
    salaryFrom,
    salaryTo,
    description,
    dob,
    phone,
    aadhar,
    ifscCode,
    bankAccount,
    pinCode,
    address,
    role,
    district,
    state,
    block,
    password,
  } = req.body;

  // Basic validations
  if (!name || !areasOfWork || !description) {
    return next(new ErrorHandler("Please provide complete worker details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(new ErrorHandler("Please either provide fixed wages or ranged wages.", 400));
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(new ErrorHandler("Cannot Enter Fixed and Ranged wages together.", 400));
  }

  // Check if phone already exists
  const isPhoneExist = await User.findOne({ phone });
  if (isPhoneExist) {
    return next(new ErrorHandler("Phone number already registered!", 400));
  }

  let profileImage = "";
  if (req.file) {
    profileImage = req.file.path;
  }

  try {
    const job = await User.create({
      name,
      areasOfWork,
      workExperience,
      fixedSalary,
      salaryFrom,
      salaryTo,
      description,
      dob,
      phone,
      kyc: {
        aadharNumber: aadhar,
      },
      bankDetails: {
        ifscCode,
        accountNumber: bankAccount,
      },
      pinCode,
      address,
      postedBy: req.user._id,
      role,
      district,
      state,
      password,
      block,
      profile: profileImage,
    });

    return res.status(200).json({
      success: true,
      message: "Worker added Successfully!",
      job,
    });
  } catch (error) {
    console.error("Error in postJob:", error);

    // Handle Mongo duplicate key error
    if (error.code === 11000) {
      const key = Object.keys(error.keyValue)[0];
      return next(new ErrorHandler(`${key} already exists!`, 400));
    }

    return next(new ErrorHandler(error.message || "Something went wrong", 500));
  }
});




export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  const { postedBy } = req.query;

  if (role === "Worker") {
    return next(
      new ErrorHandler("Worker not allowed to access this resource.", 400)
    );
  }

  let filter = {};

  if (role !== "Admin") {
    // For non-admins, use user's own ID (override any incoming postedBy)
    filter.postedBy = req.user._id;
  } else if (postedBy) {
    // Admins can filter by postedBy
    filter.postedBy = postedBy;
  }

  const myJobs = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    myJobs,
  });
});


export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Worker") {
    return next(
      new ErrorHandler("Worker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  let job = await User.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  job = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Worker Updated!",
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const job = await User.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await User.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});
