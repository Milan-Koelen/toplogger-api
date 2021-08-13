const apiHelper = require("./apiHelper");

const { User } = require("./models");

const fetchGymLeaderboard = async job => {
  const url =
    "https://api.toplogger.nu/v1/gyms/6/ranked_users.json?climbs_type=boulders&ranking_type=grade";

  const data = await apiHelper.get(url);

  for (let idx in data) {
    const climber = data[idx];
    console.log("updating", climber.full_name);
    await User.findOneAndUpdate(
      { TL_ID: climber.id },
      {
        TL_ID: climber.id,
        Name: climber.full_name,
        ProfilePictureURL: climber.avatar,
        Grade: Number.parseFloat(climber.score),
      },
      { upsert: true }
    );
  }

  // console.log(data);

  // console.log("fetchGymLeaderboard", data.length);
};

// Init agenda and register jobs
const init = async agenda => {
  await agenda.start();
  agenda.define("fetchGymLeaderboard", fetchGymLeaderboard);
  await agenda.every("2 minutes", "fetchGymLeaderboard");
  //   agenda.define("run job 2", job2);
  //   await agenda.every("7 days", "run job 2");
  //   agenda.define("run job 3", job3);
  //   await agenda.every("30 minutes", "run job 3");
};

module.exports = {
  init,
};
