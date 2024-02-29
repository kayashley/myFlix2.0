const jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport"); // Local passport file

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you’re encoding in the JWT
    expiresIn: "7d", // This specifies that the token will expire in 7 days
    algorithm: "HS256", // This is the algorithm used to “sign” or encode the values of the JWT
  });
};

/* POST login. */
module.exports = (router) => {
  // Export a function that takes a 'router' as a param
  // Define a route for handling login requests
  router.post("/login", (req, res) => {
    // Authenticate using Passport's local strategy with options to disable session
    passport.authenticate("local", { session: false }, (error, user, info) => {
      // Handle authentication error or if users is not found
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }

      // Login the user without creating a session
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }

        // Generate a JWT token for the authenticated user
        let token = generateJWTToken(user.toJSON());
        // Return with the user information and the generated JWT token
        return res.json({ user, token });
      });
    })(req, res);
  });
};
