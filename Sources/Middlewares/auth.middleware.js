import { asyncHandler } from "../Utilities/asyncHandler.utility.js";
import { apiError } from "../Utilities/apiError.utility.js";
import { apiResponse } from "../Utilities/apiResponse.utility.js";
import JWT from "jsonwebtoken";
import { User } from "../Models/user.model.js";

const verifyJWT = asyncHandler(async function (request, response, next) {
  try {
    const accessToken =
      request.cookies?.accessToken ||
      request.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new apiError(401, "Unauthorized request");
    }

    const tokenInfo = JWT.verify(accessToken, process.env.ACCESSTOKENSECRET);

    if (!tokenInfo) {
      throw new apiError(401, "Invalid Access Token");
    }

    const user = await User.findById(tokenInfo?.id).select(
      "-passwordHash -refreshToken -isApproved"
    );

    if (!user) throw new apiError(401, "Invalid access token");

    request.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token");
  }
});

export { verifyJWT };
