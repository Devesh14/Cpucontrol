class Response {
    successResponse(data, message) {
      return {
        success: true,
        errorCode: 0,
        description: message || "SUCCESS",
        info: data
      }
    }
  
    errorResponse(errorCode, description) {
      return {
        success: false,
        errorCode,
        description,
        info: null
      }
    }
  
    somethingWentWrong() {
      return {
        success: false,
        errorCode: 1,
        description: "Something went wrong",
        info: null
      }
    }
  }
  
  module.exports = new Response();