const apiHelper = require("./apiHelper");

const tlProfile = require("./models/tlProfile");
const Boulder = require("./models/Boulder");
const User = require("./models/user");

const fetchGymLeaderboard = async job => {
  const url =
    "https://api.toplogger.nu/v1/gyms/6/ranked_users.json?climbs_type=boulders&ranking_type=grade";

  console.log("[JOB] Fetch leaderboards");

  const data = await apiHelper.get(url);

  await tlProfile.bulkWrite(
    data.map(climber => ({
      updateOne: {
        filter: { TL_ID: climber.id },
        update: {
          $set: {
            TL_ID: climber.id,
            TL_UID: climber.uid,
            Name: climber.full_name,
            Gender: climber.gender,
            ProfilePictureURL: climber.avatar,
            Grade: Number.parseFloat(climber.score),
          },
        },
        upsert: true,
      },
    }))
  );

  console.log("[JOB] Leaderboards fetched");
};

const fetchUserAccends = async job => {
  const allUsers = job.attrs.data?.allUsers ?? false;

  let climbers = [];

  if (allUsers) climbers = await tlProfile.find({}, null).exec();
  else climbers = await findUsedProfiles();

  // console.log(climbers);
  console.log(`[JOB] Updating accends for ${climbers.length} climbers`);
  for (let idx in climbers) {
    const climber = climbers[idx];
    const id = climber.TL_UID;
    const url =
      "https://api.toplogger.nu/v1/ascends.json?json_params={%22filters%22:{%22used%22:true,%22user%22:{%22uid%22:" +
      id +
      "}}}";
    const accends = await apiHelper.get(url);
    if (idx % 10 == 0)
      console.log(`[JOB] Updating accends ${idx}/${climbers.length}`);

    const accendsObjects = await Promise.all(
      accends.map(async accend => {
        try {
          const climb = await Boulder.findOne({ id: accend.climb_id }).exec();

          const data = {
            id: accend.id,
            user_id: accend.user_id,
            climb_id: accend.climb_id,
            date_logged: accend.date_logged,
          };
          if (climb) data["climb"] = climb;

          return data;
        } catch (e) {
          console.error(e);
        }
      })
    );

    await tlProfile.findOneAndUpdate(
      { TL_UID: id },
      {
        Accends: accendsObjects,
        TotalTops: accendsObjects.length,
      }
    );
  }
  console.log("[JOB] Accends updated");
};

const findUsedProfiles = async job => {
  const users = await User.find().exec();

  const ids = users
    .filter(user => !!user.Profile)
    .reduce((list, user) => {
      return [
        ...list,
        user.Profile.toString(),
        ...user.following.map(following => following.toString()),
      ];
    }, []);

  const climbers = await tlProfile.find({ _id: { $in: ids } }).exec();

  return climbers;
};

const findClimbedRoutes = async () => {
  const usedProfiles = await findUsedProfiles();

  const ids = usedProfiles.reduce((list, user) => {
    return [...list, ...user.Accends.map(accend => accend.climb_id)];
  }, []);

  return await tlProfile.find({ _id: { $in: ids } }).exec();
};

const fetchBoulders = async job => {
  const recents = job.attrs.data?.recents ?? true;

  const url = `https://api.toplogger.nu/v1/gyms/6/climbs.json?json_params=${JSON.stringify(
    recents
      ? {
          filters: { deleted: false, live: true },
        }
      : {}
  )}`;

  console.log(`[JOB] Fetching ${(recents && "recent") || "all"} boulders`);

  const climbs = await apiHelper.get(url);

  console.log(`[JOB] Writing ${climbs.length} boulders to db`);

  await Boulder.bulkWrite(
    climbs.map(climb => ({
      updateOne: {
        filter: { id: climb.id },
        update: {
          $set: {
            id: climb.id,
            grade: climb.grade,
            hold_id: climb.hold_id,
            opinion: climb.opinion,
            nr_of_ascends: climb.nr_of_ascends,
            end_date: climb.end_date,
          },
        },
        upsert: true,
      },
    }))
  );

  console.log(`[JOB] Boulders updated`);

  return;
};

const withLogging = func => {
  return (...atrs) => {
    try {
      func(...atrs);
    } catch (e) {
      console.error(e);
    }
  };
};

// Init agenda and register jobs
const init = async agenda => {
  await agenda.start();
  agenda.define("fetchGymLeaderboard", withLogging(fetchGymLeaderboard));
  agenda.define("fetchUserAccends", withLogging(fetchUserAccends));
  agenda.define("fetchBoulders", withLogging(fetchBoulders));

  await agenda.every("30 minutes", "fetchUserAccends", { allUsers: false });
  await agenda.every("1 day", "fetchUserAccends", { allUsers: true });
  await agenda.every("2 hours", "fetchGymLeaderboard");
  await agenda.every("30 minutes", "fetchBoulders", { recents: true });

  await agenda.now("fetchUserAccends", { allUsers: true });
  await agenda.now("fetchBoulders", { recents: false });
};

module.exports = {
  init,
};
