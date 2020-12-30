require("console-stamp")(console, "yyyy/mm/dd HH:MM:ss");
const express = require("express");
const app = express();
const port = 3000;
var fs = require("fs");
//var template = require("./lib/template.js");

//route, routing
/*
app.get("/", (req, res) => {
  res.send("Hello World!");
});
*/
var router = require("./router/router")(app);
app.set("views", __dirname);
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);
app.use(express.static("public"));
app.use(express.static("src"));

app.listen(8081, function () {
  console.info(`Someone get in port:8080`);
});
