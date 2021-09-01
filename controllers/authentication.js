const jwt = require("jwt-simple");
const User = require("../models/user");

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode(
    { sub: user.id, iat: timestamp },
    process.env["JWT_SECRET"]
  );
}

exports.signin = function (req, res, next) {
  // User has already had their email and password
  // We just need to give them a token
  res.send({
    token: tokenForUser(req.user),
    name: req.user.name,
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
      console.log("error email is in use");
      return res.status(422).send({ error: "Email is in use" });
    }

    // If a user with email does NOT exist, create and save user record
    const user = new User({
      email: email,
      password: password,
      following: [],
    });

    user.save(function (err) {
      if (err) {
        return next(err);
      }
      console.log("New user account created " + user.email);

      // Respond to request indicating the user was created
      res.json({ token: tokenForUser(user) });
    });
  });
};
