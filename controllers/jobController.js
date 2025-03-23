import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await User.find({ expired: false });
  res.status(200).json({
    success: true,
    jobs,
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  // if (req.body?.role === "Worker") {
  //   return next(
  //     new ErrorHandler("worker is not allowed to access this resource.", 400)
  //   );
  // }

  // Get the data sent from the frontend
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
    password
  } = req.body;
  console.log('reached');

  // Validation
  if (!name || !areasOfWork || !description) {
    return next(new ErrorHandler("Please provide complete worker details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed waages or ranged wages.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot Enter Fixed and Ranged wages together.", 400)
    );
  }

  // Collect additional fields as necessary
  const postedBy = req.user._id;

  // Create the job post object based on the frontend data
  const job = await User.create({
    name,
    areasOfWork,
    workExperience,
    fixedSalary,
    salaryFrom,
    salaryTo,
    description,
    dob, // If necessary, you can store dob as well
    phone, // Mobile number of the worker
    aadhar, // Aadhar number
    ifscCode, // IFSC code
    bankAccount, // Bank account number
    pinCode, // Pin code of the address
    address, // Address of the worker
    postedBy,
    role,
    password
  });
console.log(job)
  res.status(200).json({
    success: true,
    message: "Worker added Successfully!",
    job,
  });
});


export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const myJobs = await User.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
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
