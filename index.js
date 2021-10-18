const mongoose = require("mongoose");

require("dotenv").config();

const express = require("express");
const apiHelper = require("./apiHelper");

const cors = require("cors");
const bodyParser = require("body-parser");

const Agenda = require("agenda");
const Agendash = require("agendash");

const errorhandler = require("./errorhandler");

const app = express();
const port = process.env.PORT;
const AGENDA_DB = process.env.AGENDA_DB;
const TOPLOGGER_DB = process.env.TOPLOGGER_DB;
app.use(errorhandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const jobs = require("./jobs");
const router = require("./router");

const agenda = new Agenda({ db: { address: AGENDA_DB } });
agenda.processEvery("30 seconds");

app.use("/agenda", Agendash(agenda));

jobs.init(agenda);

mongoose
  .connect(TOPLOGGER_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Toplogger DB connected");
  })
  .catch(err => {
    console.log("Toplogger DB Error");
    console.log(err);
  });

app.use(cors());
app.use(bodyParser.json({ type: "*/*" }));
router(app);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
