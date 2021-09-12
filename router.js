const Authentication = require("./controllers/authentication");
const passwordService = require("./services/passport");
const passport = require("passport");

const requireAuth = passport.authenticate("jwt", { session: false });
const requireSignin = passport.authenticate("local", { session: false });

const User = require("./models/user");
const tlProfile = require("./models/tlProfile");
const { populate } = require("./models/user");

module.exports = app => {
  app.post("/signin", requireSignin, Authentication.signin);
  app.post("/signup", Authentication.signup);

  app.post("/claim", requireAuth, async (req, res, next) => {
    const user = req.user;
    console.log("User: " + user.email);
    const claimedAccount = req.body.TL_ID;
    console.log("Account: " + claimedAccount);
    const account = await tlProfile.findById(claimedAccount);
    tlProfile.findById(claimedAccount, (err, claimedAccount) => {
      console.log(account.Name);
      console.log(account.Grade);

      User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            TL_ID: claimedAccount,
            name: account.Name,
            TL_Grade: account.Grade,
            profilePicture: account.ProfilePictureURL,
          },
          upsert: true,
        },

        (err, doc) => {
          if (err) throw err;
          console.log(doc);
          res.send(doc);
        }
      );
      console.log("account claimed");
    });
  });

  app.post("/follow", requireAuth, async (req, res, next) => {
    const user = req.user;
    console.log("user: " + user.email);
    const follow_id = req.body.follow;
    console.log("follow_id: " + follow_id);

    tlProfile.findById(follow_id, (err, follow) => {
      User.findByIdAndUpdate(
        user._id,
        {
          $addToSet: { following: follow._id },
        },
        {},
        (err, doc) => {
          if (err) throw err;

          res.send(doc);
        }
      );
    });
  });

  app.post("/unfollow", requireAuth, async (req, res, next) => {
    const user = req.user;
    console.log("user: " + user.email);
    const unfollow_id = req.body.unfollow;
    console.log("follow_id: " + unfollow_id);

    tlProfile.findById(unfollow_id, (err, unfollow) => {
      User.findByIdAndUpdate(
        user._id,
        {
          $pull: { following: unfollow._id },
        },
        {},
        (err, doc) => {
          if (err) throw err;

          res.send(doc);
        }
      );
    });
  });

  app.get("/search", async (req, res, next) => {
    console.log("Searching"); //CONSOLE LOG Searching
    console.log(req); //consolelog request
    const username = {
      Name: {
        $regex: req.query.name,
        $options: "i",
      },
    };
    console.log(req.query.name);
    console.log(username);

    const filteredUsers = await tlProfile.find(username, {
      Grade: 1,
      Name: 1,
      ProfilePictureURL: 1,
      TL_ID: 1,
    });
    // console.log(filteredUsers);

    res.send(filteredUsers);
    console.log("search done");
  });

  app.get("/user/:TL_ID", async (req, res, next) => {
    console.log("user selected");
    const TL_ID = req.params;
    console.log(TL_ID);

    const selectedUser = await tlProfile.findOne(TL_ID, {
      Grade: 1,
      Name: 1,
      ProfilePictureURL: 1,
      TL_ID: 1,
      Accends: 1,
      TotalTops: 1,
    });
    // console.log(selectedUser);

    res.send(selectedUser);
    console.log("user requested");
  });

  // app.get("/accends/:TL_ID", async (req, res, next) => {
  //   console.log("user accends");
  //   const TL_ID = req.params;
  //   console.log(TL_ID);

  //   const selectedUser = await tlProfile.findOne(TL_ID, {});
  //   // console.log(selectedUser);
  //   // console.log(selectedUser.Accends);

  //   res.send(selectedUser);
  //   // console.log("user requested");
  // });
  app.get("/", requireAuth, async (req, res, next) => {
    const data = await User.findById(req.user._id).populate("following").exec();
    const TL_data = await tlProfile.findById(req.user.TL_ID).populate().exec();
    console.log("_+_+");
    // console.log(data.TL_ID);
    console.log("following", data.following);

    res.send({
      status_koe: "gemolken",
      following: data.following,
      name: data.name,
      grade: data.TL_Grade,
      profilePicture: TL_data.ProfilePictureURL,
      TL_UID: data.TL_UID,
      TotalTops: TL_data.TotalTops,
    });
  });
};
