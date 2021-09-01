const passport = require("passport");
const User = require("../models/user");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local");

const JWT_SECRET = process.env.JWT_SECRET;

// create local strategy
const localOptions = {
  usernameField: "email",
};
const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
  // verify this email and password, call 'done' with the user
  // if it is the correct email and password
  // otherwise, call done with false

  User.findOne(
    {
      email: email,
    },
    (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }

      // compare passwords - is `password` equal to user.password?
      user.comparePassword(password, (err, isMatch) => {
        if (err) {
          return done(err);
        }
        if (!isMatch) {
          return done(null, false);
        }

        return done(null, user);
      });
    }
  );
});

// setup options for JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader("authorization"),
  secretOrKey: JWT_SECRET,
};

// create JWT strategy
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  // see if the user id in the payload exits in our database
  // if it does, call 'done' with that
  // otherwise, call 'done' without a user object
  // User.find({ _id: payload.sub }, (err, user) => {
  User.findById(payload.sub, (err, user) => {
    if (err) {
      console.error(err);
      return done(err, false);
    }

    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  });
});

// tell passport to use this strategy
passport.use(jwtLogin);
passport.use(localLogin);
