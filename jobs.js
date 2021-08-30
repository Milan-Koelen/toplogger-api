const apiHelper = require("./apiHelper");

const tlProfile = require("./models/tlProfile");

const fetchGymLeaderboard = async job => {
  const url =
    "https://api.toplogger.nu/v1/gyms/6/ranked_users.json?climbs_type=boulders&ranking_type=grade";

  const data = await apiHelper.get(url);

  for (let idx in data) {
    const climber = data[idx];
    console.log("updating users", climber.full_name);
    await tlProfile.findOneAndUpdate(
      { TL_ID: climber.id },
      {
        TL_ID: climber.id,
        TL_UID: climber.uid,
        Name: climber.full_name,
        Gender: climber.gender,
        ProfilePictureURL: climber.avatar,
        Grade: Number.parseFloat(climber.score),
      },
      { upsert: true }
    );
  }
  console.log("Update completed");
};

const fetchUserAccends = async job => {
  console.log("Update Accends");
  const climbers = await tlProfile.find({}, null);
  // console.log(climbers);
  for (let idx in climbers) {
    const climber = climbers[idx];
    // console.log(climber.Name);
    const id = climber.TL_UID;
    const url =
      'https://api.toplogger.nu/v1/ascends.json?json_params={"filters":{"used":true,"user":{"uid":' +
      id +
      '%20},"climb":}"gym_id:6}}}';
    const accends = await apiHelper.get(url);
    await tlProfile.findOneAndUpdate(
      { TL_UID: id },
      {
        Accends: accends,
      },
      { upsert: true }
    );
  }
  console.log("Accends updated");
};
// Init agenda and register jobs
const init = async agenda => {
  await agenda.start();
  agenda.define("fetchGymLeaderboard", fetchGymLeaderboard);
  agenda.define("fetchUserAccends", fetchUserAccends);
  await agenda.every("30 minutes", "fetchUserAccends");
  await agenda.every("120 minutes", "fetchGymLeaderboard");
};

module.exports = {
  init,
};
