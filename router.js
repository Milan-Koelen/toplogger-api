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
          },
        },
        { upsert: true },
        (err, doc) => {
          if (err) throw err;

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
      totalAccends: 1,
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
    let data = await User.findById(req.user._id).populate("following").exec();

    // console.log(data);

    // app.post("/follow");
    // tlProfile.findById("6117cc189515bb98cab8cc84", (err, profile) => {
    //   tlProfile.findByIdAndUpdate(req.user._id, {
    //     $push: { following: profile._id },
    //   });
    //   // req.user.following.push(profile);
    //   req.user.save();
    // });

    res.send({
      status_koe: "gemolken",
      following: data.following,
      name: data.name,
      grade: data.TL_Grade,
      TL_UID: data.TL_UID,
    });
  });
};
