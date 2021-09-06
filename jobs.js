const apiHelper = require("./apiHelper");

const tlProfile = require("./models/tlProfile");

const fetchGymLeaderboard = async job => {
  const url =
    "https://api.toplogger.nu/v1/gyms/6/ranked_users.json?climbs_type=boulders&ranking_type=grade";

  const data = await apiHelper.get(url);

  for (let idx in data) {
    const climber = data[idx];
    //     console.log("updating users", climber.full_name);
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
  console.log("User update completed");
};

const fetchUserAccends = async job => {
  console.log("Update Accends");
  const climbers = await tlProfile.find({}, null);
  // console.log(climbers);
  for (let idx in climbers) {
    const climber = climbers[idx];
    console.log("Fetching accends for" + climber.Name);
    const id = climber.TL_UID;
    const url =
      "https://api.toplogger.nu/v1/ascends.json?json_params={%22filters%22:{%22used%22:true,%22user%22:{%22uid%22:" +
      id +
      "}}}";
    const accends = await apiHelper.get(url);
    console.log("Request Send");

    await tlProfile.findOneAndUpdate(
      { TL_UID: id },
      {
        Accends: accends,
        TotalTops: accends.length,
      }
    );
  }
  console.log("Accends updated");
};
// Init agenda and register jobs
const init = async agenda => {
  await agenda.start();
  agenda.define("fetchGymLeaderboard", fetchGymLeaderboard);
  agenda.define("fetchUserAccends", fetchUserAccends);
  await agenda.every("120 minutes", "fetchUserAccends");
  await agenda.every("300 minutes", "fetchGymLeaderboard");
};

module.exports = {
  init,
};
