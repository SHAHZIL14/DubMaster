import { apiError } from "../Utilities/apiError.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import { User } from "../Models/user.model.js";
import { asyncHandler } from "../Utilities/asyncHandler.utility.js";

const generateTokens = async function (userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      error.message ||
        "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async function (request, response) {
  const { name, email, password } = request.body;
  if (
    [name, email, password].some(function (field) {
      return field?.trim() === "";
    })
  ) {
    console.log("All fields are required");
    throw new apiError(400, "All fields are required.");
  }

  const userInDB = await User.findOne({ email });
  if (userInDB) {
    console.log("User with this email already exists");
    throw new apiError(400, "User with this email already exists");
  }

  const user = await User.create({
    name: name,
    email: email,
    passwordHash: password,
  });

  const isUserCreated = await User.findById(user._id).select(
    "-passwordHash -refreshToken -isApproved"
  );

  if (!isUserCreated) {
    console.log("Something went wrong while registering the user");
    throw new apiError(500, "Something went wrong while registering the user");
  }

  response
    .status(200)
    .json(new apiResponse(200, isUserCreated, "User created successfully"));
});

const loginUser = asyncHandler(async function (request, response) {
  const { email, password } = request.body;

  if (email.toString().trim() === "" || password.toString().trim() === "")
    throw new apiError(400, "Credentials are missing");

  const userInDB = await User.findOne({ email });
  if (!userInDB) throw new apiError(400, "User does not exist");

  const isPasswordCorrect = await userInDB.passwordCheck(password);
  if (!isPasswordCorrect) throw new apiError(401, "Password is incorrect");

  const { accessToken, refreshToken } = await generateTokens(userInDB._id);

  if (!accessToken || !refreshToken)
    throw new apiError(
      500,
      "Something went wrong while generating tokens in controller"
    );

  const loggedInUser = await User.findById(userInDB._id).select(
    "-passwordHash -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  response
    .status(201)
    .cookie("AccessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        201,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export { registerUser, loginUser };
