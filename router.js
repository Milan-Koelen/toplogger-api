const Authentication = require("./controllers/authentication");
const passwordService = require("./services/passport");
const passport = require("passport");

const requireAuth = passport.authenticate("jwt", { session: false });
const requireSignin = passport.authenticate("local", { session: false });

const User = require("./models/user");
const tlProfile = require("./models/tlProfile");
const { populate } = require("./models/user");

module.exports = (app) => {
  app.post("/signin", requireSignin, Authentication.signin);
  app.post("/signup", Authentication.signup);

  app.post("/claim", requireAuth, async (req, res, next) => {
    const user = req.user;
    const claimedAccount = req.body.TL_ID;

    console.log({ User: user.email, Account: claimedAccount });
    const account = await tlProfile.findById(claimedAccount);
    tlProfile.findById(claimedAccount, (err, claimedAccount) => {
      console.log(account.Name);
      console.log(account.Grade);

      User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            Profile: claimedAccount,
            name: account.Name,
          },
          upsert: true,
        },

        (err, doc) => {
          if (err) throw err;
          console.log(doc);
          res.send(doc);
        }
      );
      console.log(claimedAccount + " claimed");
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
    console.log("Searching: " + req.Name); //CONSOLE LOG Searching
    const username = {
      Name: {
        $regex: req.query.name,
        $options: "i",
      },
    };

    const filteredUsers = await tlProfile.find(username, {
      Grade: 1,
      Name: 1,
      ProfilePictureURL: 1,
      TL_ID: 1,
    });
    console.log(
      "Search for " +
        req.query.name +
        " returned " +
        filteredUsers.length +
        " results."
    );

    res.send(filteredUsers);
  });

  app.get("/user/:TL_ID", requireAuth, async (req, res) => {
    const TL_ID = req.params;
    console.log("user selected: " + TL_ID);

    const selectedUser = await tlProfile.findOne(TL_ID, {
      Grade: 1,
      Name: 1,
      ProfilePictureURL: 1,
      TL_ID: 1,
      Accends: 1,
      TotalTops: 1,
    });
    res.send(selectedUser);
  });

  app.get("/user", requireAuth, async (req, res) => {
    const user = await User.findById(req.user._id).exec();
    let profile;
    if (user.Profile) {
      profile = await tlProfile.findById(user.Profile).populate({
        path: "Accends",
        populate: {
          path: "climb",
        },
      });
    }

    res.send({
      name: user.name,
      Profile: profile,
    });
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
  app.get("/following", requireAuth, async (req, res, next) => {
    const data = await User.findById(req.user._id)
      .populate("following", "ProfilePictureURL Name TL_ID Grade")
      .exec();

    res.send(data.following);
  });
};
