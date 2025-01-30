// // Local HTTPS setup
// const https = require("https");
// const fs = require("fs");
// const key = fs.readFileSync(__dirname + "/certs/selfsigned.key");
// const cert = fs.readFileSync(__dirname + "/certs/selfsigned.crt");
// const httpsOptions = {
//   key: key,
//   cert: cert,
// };
// Import the required libraries
const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const config = require("./config.json");

// Import the passport Azure AD library
const BearerStrategy = require("passport-azure-ad").BearerStrategy;

// Set the Azure AD B2C options
const options = {
  identityMetadata: `https://${config.credentials.tenantName}.b2clogin.com/${config.credentials.tenantName}.onmicrosoft.com/${config.policies.policyName}/${config.metadata.version}/${config.metadata.discovery}`,
  clientID: config.credentials.clientID,
  audience: config.credentials.clientID,
  policyName: config.policies.policyName,
  isB2C: config.settings.isB2C,
  validateIssuer: config.settings.validateIssuer,
  loggingLevel: config.settings.loggingLevel,
  passReqToCallback: config.settings.passReqToCallback,
  scope: config.resource.scope,
};

// Instantiate the passport Azure AD library with the Azure AD B2C options
const bearerStrategy = new BearerStrategy(options, (token, done) => {
  // Send user info using the second argument
  done(null, {}, token);
});

// Use the required libraries
const app = express();

app.use(morgan("dev"));

app.use(passport.initialize());

passport.use(bearerStrategy);

//enable CORS (for testing only -remove in production/deployment)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// API anonymous endpoint
app.get("/public", (req, res) => res.send({ date: new Date() }));

// API protected endpoint
app.get(
  "/hello",
  passport.authenticate("oauth-bearer", { session: false }),
  (req, res) => {
    console.log("Validated claims: ", req.authInfo);

    // Service relies on the name claim.
    res.status(200).json({ name: req.authInfo["name"] });
  }
);
const port = process.env.PORT || 6000;
const httpsPort = port + 1;

app.listen(port, () => {
  console.log("listening on port " + port);
});

var server = https.createServer(httpsOptions, app);

server.listen(httpsPort, () => {
  console.log("https server starting on port : " + httpsPort);
});
