const Authentication = require("./controllers/authentication");
const passwordService = require("./services/passport");
const passport = require("passport");

const requireAuth = passport.authenticate("jwt", { session: false });
const requireSignin = passport.authenticate("local", { session: false });

const User = require("./models/user");

module.exports = app => {
  app.post("/signin", requireSignin, Authentication.signin);
  app.post("/signup", Authentication.signup);

  app.get("/", requireAuth, async (req, res, next) => {
    const data = await User.findOne(req.body.email);
    console.log(data);

    res.send({
      status_koe: "gemolken",
      friends: ["karel pietjes", "barry balzak"],
      name: data.name,
    });
  });
};
