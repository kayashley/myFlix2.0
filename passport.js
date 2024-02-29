const passport = require("passport"), // Import passport
  LocalStrategy = require("passport-local").Strategy, // Import passport-local
  Models = require("./models.js"), // Import models
  passportJWT = require("passport-jwt"); // Import passport-jwt

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: "Username",
      passwordField: "Password",
    },
    (username, password, callback) => {
      console.log(username + "  " + password);
      Users.findOne({ Username: username })
        // If the user if found, this function handles the callback
        .then((user) => {
          if (!user) {
            console.log("incorrect username");
            return callback(null, false, {
              message: "Incorrect username or password.",
            });
          }

          console.log("finished");
          return callback(null, user);
        })
        // Handle the error when finding the user in mongodb
        .catch((error) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
        });
    }
  )
);

// Configure Passport to use JWT strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header
      secretOrKey: "your_jwt_secret", // Secret key to verify the JWT
    },
    (jwtPayload, callback) => {
      // Find user in the database based on the JWT payload
      return Users.findById(jwtPayload._id)
        .then((user) => {
          // If the user is found, pass the user to the callback
          return callback(null, user);
        })
        .catch((error) => {
          // If an error occurs during user lookup, pass the error to the callback
          return callback(error);
        });
    }
  )
);
