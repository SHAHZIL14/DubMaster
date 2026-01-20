import { apiError } from "../Utilities/apiError.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import { User } from "../Models/user.model.js";
import { asyncHandler } from "../Utilities/asyncHandler.utility.js";
import mongoose from "mongoose";

const getAdmin = asyncHandler(async function (request, response) {
  const user = request.user;
  if (!user) throw new apiError(400, "session do not exist");
  response
    .status(200)
    .json(
      new apiResponse(
        200,
        { user },
        "Admin panel has been fetched successfully"
      )
    );
});

const getPendingUsers = asyncHandler(async function (request, response) {
  const pendingUsers = await User.find({ isApproved: false }).select(
    "_id name email role"
  );
  if (!pendingUsers)
    throw new apiError(
      500,
      "Something went wrong while fetching unapproved users"
    );
  response
    .status(200)
    .json(
      new apiResponse(
        200,
        { pending_users: pendingUsers },
        "Pending users have been fetched successfully"
      )
    );
});

const approveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new apiError(400, "Missing param: 'id' is required");
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(400, "Invalid user id format");
  }

  const user = await User.findById(id).select("_id name email isApproved");
  if (!user) {
    throw new apiError(404, `User with id ${id} does not exist`);
  }

  if (user.isApproved) {
    return res.status(200).json(
      new apiResponse(200, { user }, "User already approved")
    );
  }

  user.isApproved = true;
  await user.save();

  return res.status(200).json(
    new apiResponse(200, { user }, "User approved successfully")
  );
});


export { getAdmin, getPendingUsers, approveUser };
