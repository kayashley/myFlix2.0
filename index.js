//This piece of code configures an Express application with various modules and middleware to handle HTTP requests, user authentication, request body parsing, and connection to a MongoDB database using Mongoose. It also sets up a request log using the morgan module and creates a write stream to store the logs in a log file.

const bodyParser = require("body-parser"); // Import the body-parser module to parse HTTP request bodies.
const express = require("express"); // Import the Express module to build the web application.
const dotenv = require("dotenv");
// const dotenv = require("dotenv").config().parsed;
const app = express(); // Create an instance of the Express application.
const cors = require("cors");
const uuid = require("uuid"); // Import the uuid module to generate unique identifiers.
const morgan = require("morgan"); // Import the morgan module for HTTP request logging.
const fs = require("fs"); // Import the fs module to work with the file system.
const path = require("path"); // Import the path module to manipulate file paths.
const mongoose = require("mongoose"); // Import the mongoose module to interact with MongoDB.
const Models = require("./models.js"); // Import a local file that contains the data models.
const PORT = process.env.PORT || 8080;

// .env to hide sensitive data
dotenv.config();
// dotenv.CONNECTION_URI;

const Movies = Models.Movie; // Get the movie model from the models file.
const Users = Models.User; // Get the user model from the models file.

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
}); // Create a write stream for the request log.

// CORS
// app.use(
//   cors({
//     origin: "mongodb://localhost:27017/test",
//   })
// );

mongoose.connect(
  "mongodb+srv://itskaychay:dbadmin123@test.w0fysci.mongodb.net/test?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

console.log(require("dotenv").config());
//   .then(() => console.log("Connected successfully."))
//   .catch((err) => {
//     console.error(err);
//   });

// Connect to the MongoDB database using mongoose, with the connection URL and configuration options.
// mongoose.connect("mongodb://127.0.0.1:27017/test", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

app.use(cors());

app.use(morgan("common", { stream: accessLogStream })); // Use morgan as middleware to log requests to the log file.
app.use(express.static("public")); // Set the "public" folder as a static folder to serve static files.

app.use(bodyParser.json()); // Use body-parser to parse JSON-formatted request bodies.
app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser to parse URL-encoded request bodies.

let auth = require("./auth")(app); // Import and execute an authentication module, passing the Express application as a parameter.
const passport = require("passport"); // Import the passport module for user authentication.
require("./passport"); // Import the passport configuration from a local file.

// GET requests

//This code sets up a route for the root URL ("/") of the application. When a GET request is made to the root URL, the callback function is executed. In this case, the function sends a response back to the client with the message "Welcome to my movie API!".
app.get("/", (req, res) => {
  res.send("Welcome to my movie API!");
});

// Get all users
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// POST request

//Create User
app.post("/users", (req, res) => {
  Users.findOne({ Username: req.body.Username }) // Find a user in the database based on the provided Username from the request body
    .then((user) => {
      // Execute the following code block if the user is found
      if (user) {
        // If a user with the given Username already exists
        return res.status(400).send(req.body.Username + " already exists"); // Return a response with status 400 (Bad Request) and an error message
      } else {
        // If the user doesn't exist
        Users.create({
          // Create a new user in the database with the provided user information from the request body
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        })
          .then((user) => {
            // Execute the following code block if the user is successfully created
            res.status(201).json(user); // Return a response with status 201 (Created) and the created user object in JSON format
          })
          .catch((error) => {
            // Catch any error that occurs during user creation
            console.error(error); // Log the error to the console
            res.status(500).send("Error: " + error); // Return a response with status 500 (Internal Server Error) and an error message
          });
      }
    })
    .catch((error) => {
      // Catch any error that occurs during user retrieval
      console.error(error); // Log the error to the console
      res.status(500).send("Error: " + error); // Return a response with status 500 (Internal Server Error) and an error message
    });
});

// Get a user by username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// no callback, uses .then()
// updating user info
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validate that all parameters exist in the request
    if (
      req.body &&
      req.body.Username &&
      req.body.Password &&
      req.body.Email &&
      req.body.Birthday
    ) {
      // Define the user object to update
      const updatedUser = {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      };

      // Call `findOneAndUpdate` to pass the updatedUser Object
      Users.findOneAndUpdate({ Username: req.params.Username }, updatedUser, {
        new: true,
      })
        // Handle the data object returned from mongodb
        .then((user) => {
          res.json(user);
        })
        // Handle the error returned
        .catch((error) => {
          console.error(error);
          res.status(500).send("Error: " + error);
        });
    } else {
      res.status(400).send("Invalid parameters");
    }
  }
);

// POST allows users to add to their fav movie list
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $addToSet: { FavoriteMovies: req.params.MovieID },
      },
      { new: true } //This line makes sure the updated document is returned
    )
      .then((updatedUser) => {
        if (!updatedUser) {
          return res.status(404).send("Error: User doesn't exist");
        } else {
          res.json(updatedUser);
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// DELETE a movie to a user's list of favorites
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true } // This line makes sure that the updated document is returned
    )
      .then((updatedUser) => {
        if (!updatedUser) {
          return res.status(404).send("Error: User doesn't exist.");
        } else {
          res.json(updatedUser);
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Delete a user by username
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get all movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a movie by title
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get a Movie by Genre
app.get(
  "/movies/genres/:genreName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName })
      .then((movie) => {
        res.json(movie.Genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);
// READ Director

// Get a Movie by Director
app.get(
  "/movies/directors/:directorName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.directorName })
      .then((movie) => {
        res.json(movie.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

// Error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("There was an error. Please try again later.");
});

// Looks for pre-configured port number
app.listen(PORT, () => {
  console.log("Listening on Port " + PORT);
});

// listen for requests
// app.listen(8080, () => {
//     console.log("Your app is listening on port 8080.");
// });
