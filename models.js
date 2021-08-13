const { Schema, model } = require("mongoose");

// const ascendSchema = new mongoose.Schema({});

const userSchema = new Schema({
  Name: String,
  TL_ID: Number,
  ProfilePictureURL: String,
  Grade: Number,
  // StrengthHistory: Object,
  // Ascends: Object,
  // PersonalBest: Number,
});

// const gymSchema = new mongoose.Schema({
//   Name: String,
//   ID: Number,
//   Logo: String,
//   City: String,
//   ClimberCount: Number,
//   BoulderCount: Number,
// });

module.exports.User = model("User", userSchema);
