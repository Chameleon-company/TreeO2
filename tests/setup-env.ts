// Runs (via jest setupFiles) before each test file, ahead of any imports.
//
// Suites authenticate with the AUTH_DEV_MODE bypass tokens, which the auth
// middleware only honours when NODE_ENV is "development". Previously a few
// integration suites set these on process.env at the top of their own file,
// which made a --runInBand run order-dependent: process.env is shared across
// the process, so suites running before the first mutating file saw jest's
// default NODE_ENV="test" and received 401s for every dev token. Setting the
// values here gives every suite the same environment in every order.
process.env.NODE_ENV = "development";
process.env.AUTH_DEV_MODE = "true";
