// Artillery processor functions for load testing

module.exports = {
  setAuthToken,
  generateRandomUser,
  logResponse,
  validateResponse
};

// Set a dummy auth token for testing authenticated endpoints
function setAuthToken(context, events, done) {
  // In a real scenario, you'd get this from a login request
  // For testing purposes, we'll use a mock token or get one from registration
  context.vars.authToken = "mock-jwt-token-for-testing";
  return done();
}

// Generate random user data
function generateRandomUser(context, events, done) {
  const randomId = Math.floor(Math.random() * 100000);
  context.vars.username = `testuser_${randomId}`;
  context.vars.email = `test_${randomId}@example.com`;
  context.vars.password = "password123";
  return done();
}

// Log response for debugging
function logResponse(requestParams, response, context, ee, next) {
  if (process.env.DEBUG) {
    console.log(`${requestParams.method} ${requestParams.url} - ${response.statusCode}`);
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.body}`);
    }
  }
  return next();
}

// Validate response structure
function validateResponse(requestParams, response, context, ee, next) {
  try {
    if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
      JSON.parse(response.body);
    }
  } catch (error) {
    console.error(`Invalid JSON response from ${requestParams.url}:`, error.message);
  }
  return next();
}