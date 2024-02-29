const { default: mongoose } = require("mongoose"); // Import mongoose

// Define movie schema using mongoose
let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
    Birthyear: String,
  },
  // Actors: [String],
  ImagePath: String,
  Feautured: Boolean,
});

// Define user schema using mongoose
let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
});

// Create a Movie model using the movieSchema
let Movie = mongoose.model("Movie", movieSchema);
// Create a User model using the userSchema
let User = mongoose.model("User", userSchema);

// Export Movie
module.exports.Movie = Movie;
// Export User
module.exports.User = User;
