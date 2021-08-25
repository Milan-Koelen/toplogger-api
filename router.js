const Authentication = require("./controllers/authentication");
const passwordService = require("./services/passport");
const passport = require("passport");

const requireAuth = passport.authenticate("jwt", { session: false });
const requireSignin = passport.authenticate("local", { session: false });

const User = require("./models/user");
const tlProfile = require("./models/tlProfile");

module.exports = app => {
  app.post("/signin", requireSignin, Authentication.signin);
  app.post("/signup", Authentication.signup);

  app.post("/search", async (req, res, next) => {
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
    });
    console.log(filteredUsers);

    res.send(filteredUsers);
    console.log("search done");
  });

  app.get("/", requireAuth, async (req, res, next) => {
    const data = await User.findOne(req.body.email);
    console.log(req.user);

    // tlProfile.findById("6117cc189515bb98cab8cc84", (err, profile) => {
    //   tlProfile.findByIdAndUpdate(req.user._id, {
    //     $push: { following: profile._id },
    //   });
    //   // req.user.following.push(profile);
    //   req.user.save();
    // });

    res.send(
      {
        status_koe: "gemolken",
        following: req.user.following,
        name: req.user.name,
        grade: req.user.TL_Grade,
      },
      filteredUsers
    );
  });
};
