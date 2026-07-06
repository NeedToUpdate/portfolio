#!/usr/bin/env node
// Lambda entrypoint. The Lambda Web Adapter executes this file directly,
// so it carries a node shebang and is marked executable in the zip.
require(require("path").join(__dirname, "server.js"));
