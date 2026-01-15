import { apiError } from "../Utilities/apiError.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import { User } from "../Models/user.model.js";
import { asyncHandler } from "../Utilities/asyncHandler.utility.js";

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

const approveUser = asyncHandler(async function (request, response) {
  const { id } = request.params;
  if (id.toString().trim().length <= 0)
    throw new apiError(
      401,
      "Missing param , 'id' is required for user to approve"
    );
  const user = await User.findOne({ _id: id }).select(
    "_id name email isApproved"
  );
  if (!user) throw new apiError(401, `User with _id:${id} does not exist`);
  if (user.isApproved) {
    response
      .status(200)
      .json(new apiResponse(200, null, "User with given id is already approved"));
  } else {
    user.isApproved = true;
    await user.save({ validateBeforeSave: true });
    response
      .status(200)
      .json(
        new apiResponse(
          200,
          { user },
          `User with _id:${id} has been approved successfully`
        )
      );
  }
});

export { getAdmin, getPendingUsers, approveUser };
