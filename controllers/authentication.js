const jwt = require("jwt-simple");
const User = require("../models/user");

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode(
    { sub: user.id, iat: timestamp },
    process.env["JWT_SECRET"]
  );
}

exports.signin = async function (req, res, next) {
  // User has already had their email and password
  // We just need to give them a token
  const data = await User.findById(req.user._id)
    .populate("following", "TL_ID")
    .exec();
  // console.log(data);
  res.send({
    token: tokenForUser(req.user),
    following: data.following,
    name: data.name,
    grade: data.TL_Grade,
    profilePicture: data.ProfilePictureURL,
    TL_UID: data.TL_UID,
    TotalTops: data.TL_ID.TotalTops,
  });
  console.log(req.user.email + " logged in");
};

exports.signup = function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res
      .status(422)
      .send({ error: "You must provide email and password" });
  }

  // See if a user with the given email exists
  User.findOne({ email: email }, function (err, existingUser) {
    if (err) {
      return next(err);
    }

    // If a user with email does exist, return an error
    if (existingUser) {
      console.log("Email is in use");
      return res.status(422).send({ error: "Email is in use" });
    }

    // If a user with email does NOT exist, create and save user record
    const user = new User({
      email: email,
      password: password,
      following: [{}],
    });

    user.save(function (err) {
      if (err) {
        return next(err);
      }
      console.log("New user account created " + user.email);

      // Respond to request indicating the user was created
      res.json({
        token: tokenForUser(user),
        following: user.following,
        name: user.name,
        grade: user.TL_Grade,
        TL_UID: user.TL_UID,
      });
    });
  });
};
