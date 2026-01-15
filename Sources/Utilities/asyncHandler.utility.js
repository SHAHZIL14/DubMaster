const asyncHandler = function (fn) {
  return async function (request, response, next) {
    try {
      await fn(request, response, next);
    } catch (error) {
      response.status(error.code || 500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

export { asyncHandler };
