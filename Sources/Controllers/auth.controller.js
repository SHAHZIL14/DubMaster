import { apiError } from "../Utilities/apiError.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import { User } from "../Models/user.model.js";
import { asyncHandler } from "../Utilities/asyncHandler.utility.js";
import config from "../../Configuration/config.js";
import JWT from "jsonwebtoken";

const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new apiError(404, "User not found");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async function (request, response) {
  const { name, email, password } = request.body;

  if ([name, email, password].some((field) => !field || field.trim() === "")) {
    throw new apiError(400, "All fields are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userInDB = await User.findOne({ email: normalizedEmail });
  if (userInDB) {
    throw new apiError(409, "User with this email already exists");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password,
  });

  const userObject = user.toObject();
  delete userObject.passwordHash;
  delete userObject.refreshToken;

  if (!user) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return response
    .status(201)
    .json(new apiResponse(201, userObject, "User created successfully"));
});

const loginUser = asyncHandler(async function (request, response) {
  const { email, password } = request.body;

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000,
  };

  const existingToken =
    request.cookies?.accessToken ||
    request.get("Authorization")?.replace("Bearer ", "");

  if (existingToken) {
    try {
      const decoded = JWT.verify(existingToken, config.accessTokenSecret);
      const user = await User.findById(decoded.id).select(
        "-passwordHash -refreshToken"
      );

      if (user) {
        return response
          .status(200)
          .json(new apiResponse(200, { user }, "Already logged in"));
      }
    } catch (err) {
      console.log("Existing token invalid");
    }
  }

  if (!email || !password) throw new apiError(400, "Credentials are missing");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new apiError(404, "User does not exist");

  const isPasswordCorrect = await user.passwordCheck(password);
  if (!isPasswordCorrect) throw new apiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = user.toObject();
  delete loggedInUser.passwordHash;
  delete loggedInUser.refreshToken;

  return response
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(200, { user: loggedInUser }, "Login successful"));
});

const getCurrentUser = asyncHandler(async function (request, response) {
  const currentUser = request.user;
  if (!currentUser) throw new apiError(401, "Bad request , no user session");
  response
    .status(200)
    .json(
      new apiResponse(
        200,
        { user: currentUser },
        "User has been fetched successfully"
      )
    );
});

const logoutUser = asyncHandler(async function (request, response) {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  };

  if (request.user?._id) {
    await User.findByIdAndUpdate(
      request.user._id,
      { $unset: { refreshToken: 1 } },
      { new: true }
    );
  }

  response.clearCookie("accessToken", options);
  response.clearCookie("refreshToken", options);

  return response
    .status(200)
    .json(new apiResponse(200, {}, "Logged out successfully"));
});

export { registerUser, loginUser, getCurrentUser, logoutUser };
