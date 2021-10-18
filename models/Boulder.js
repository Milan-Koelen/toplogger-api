const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// define our model
const boulderSchema = new Schema({
  id: Number,
  grade: Number,
  hold_id: Number,
  opinion: Number,
  nr_of_ascends: Number,
  end_date: Date,
});

// create the model class
const model = mongoose.model("Boulder", boulderSchema);

// export the model
module.exports = model;
