const asyncHandler = function (fn) {
  return async function (request, response, next) {
    try {
      await fn(request, response, next);
    } catch (error) {
      const status = error.statusCode || 500; 
      response.status(status).json({
        success: false,
        message: error.message,
      });
    }
  };
};

export { asyncHandler };
