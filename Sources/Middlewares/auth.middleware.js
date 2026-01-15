import { asyncHandler } from "../Utilities/asyncHandler.utility.js";
import { apiError } from "../Utilities/apiError.utility.js";
import JWT from "jsonwebtoken";
import { User } from "../Models/user.model.js";

const verifyJWT = asyncHandler(async (request, _, next) => {
  const accessToken =
    request.cookies?.accessToken ||
    request.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    throw new apiError(401, "Unauthorized request");
  }

  let tokenInfo;
  try {
    tokenInfo = JWT.verify(accessToken, process.env.ACCESSTOKENSECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new apiError(401, "Access token expired");
    }
    throw new apiError(401, "Invalid access token");
  }

  const user = await User.findById(tokenInfo.id).select(
    "-passwordHash -refreshToken"
  );

  if (!user) {
    throw new apiError(401, "Invalid access token");
  }

  request.user = user;
  next();
});

const isApproved = asyncHandler(async (request, _, next) => {
  const user = request.user;

  if (!user) {
    throw new apiError(401, "Session expired, please login again");
  }

  if (!user.isApproved) {
    throw new apiError(403, "Account not approved by admin yet");
  }

  next();
});

const isAdmin = asyncHandler(async (request, _, next) => {
  const user = request.user;

  if (!user) {
    throw new apiError(401, "Session expired, please login again");
  }

  if (user.role !== "admin") {
    throw new apiError(403, "Access denied: Admins only");
  }

  next();
});

export { verifyJWT, isApproved, isAdmin };
