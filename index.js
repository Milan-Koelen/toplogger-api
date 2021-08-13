const mongoose = require("mongoose");

const express = require("express");
const apiHelper = require("./apiHelper");

const Agenda = require("agenda");
const Agendash = require("agendash");

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const jobs = require("./jobs");

const agenda = new Agenda({ db: { address: process.env["AGENDA_DB"] } });
agenda.processEvery("30 seconds");

app.use("/agenda", Agendash(agenda));

jobs.init(agenda);

mongoose
  .connect(process.env["TOPLOGGER_DB"], {
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

app.get("/", async (req, res) => {
  // const userData = await apiHelper.get(url);
  // console.log(userData);
  // res.send(userData);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
