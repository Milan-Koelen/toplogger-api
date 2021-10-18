const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// define our model
const tlPofileSchema = new Schema({
  Name: String,
  TL_ID: Number,
  TL_UID: Number,
  Gender: String,
  ProfilePictureURL: String,
  Grade: Number,
  Accends: [
    {
      id: Number,
      user_id: Number,
      climb_id: Number,
      climb: { type: mongoose.Types.ObjectId, ref: "Boulder" },
      date_logged: Date,
    },
  ],
  TotalTops: Number,
});

// create the model class
const model = mongoose.model("tlProfile", tlPofileSchema);

// export the model
module.exports = model;
