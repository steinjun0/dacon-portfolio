require("console-stamp")(console, "yyyy/mm/dd HH:MM:ss");
var wildcard = require("wildcard");
var glob = require("glob-fs")({ gitignore: true });

var qs = require("querystring");
var url = require("url");
var fs = require("fs");

var userId = "";

const dataFolder = "./data";

var moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

function convertTimeToDate(standardMilli, standardDate, time, yesterday) {
  var hour = Number(time[0] + time[1]) - Number(9);
  var minute = Number(time[3] + time[4]);
  var date = moment().format("YYYY-MM-DD HH:mm:ss");
  standardDate = new Date();
  //console.log(standardDate);
  standardDate.setTime(standardMilli);
  standardDate.setHours(hour);
  standardDate.setMinutes(minute);
  if (yesterday == 1) {
    standardDate.setTime(
      Number(standardDate.getTime()) - Number(1000 * 60 * 60 * 24)
    );
  }
  return standardDate;
}

function getFormatDate(date) {
  var year = date.getFullYear();
  var month = 1 + date.getMonth();
  month = month >= 10 ? month : "0" + month;
  var day = date.getDate();
  day = day >= 10 ? day : "0" + day;
  return year + "-" + month + "-" + day;
}

function renderAsVisit(res, visited, timelineJson) {
  res.render("timer", {
    userId: global.userData.id,
    userName: global.userData.name,
    userImage: global.userData.image,
    date: getFormatDate(new Date()),
    visited: visited,
    timelineJson: timelineJson,
  });
}

function getNextJsonName(userFolder) {
  var filelist = glob.readdirSync(`${userFolder}/*[0-9].json`, {});
  /*
  -숫자 에 match되는 문자열을 파일 리스트에서 찾기
  console.log(filelist);
  console.log(filelist[filelist.length - 1].match(/-(\d*)/));
  */
  filelist = filelist
    .map(function (fileName) {
      return {
        name: fileName,
        time: fs.statSync(fileName).mtime.getTime(),
      };
    })
    .sort(function (a, b) {
      return a.time - b.time;
    })
    .map(function (v) {
      return v.name;
    });

  var latestFileNumber = filelist[filelist.length - 1].match(/-(\d*)/)[1];

  console.log(
    `{getNextJsonName} Next Json Name: ${filelist[filelist.length - 1].replace(
      /-(\d*)/,
      `-${Number(latestFileNumber) + 1}`
    )}`
  );

  return filelist[filelist.length - 1].replace(
    /-(\d*)/,
    `-${Number(latestFileNumber) + 1}`
  );
}

function getLatestJsonName(userFolder) {
  var filelist = glob.readdirSync(`${userFolder}/*[0-9].json`, {});
  //console.log(`{getLatestJsonName} filelist: ${filelist}`);
  /*
  -숫자 에 match되는 문자열을 파일 리스트에서 찾기
  console.log(filelist);
  console.log(filelist[filelist.length - 1].match(/-(\d*)/));
  */
  filelist = filelist
    .map(function (fileName) {
      return {
        name: fileName,
        time: fs.statSync(fileName).mtime.getTime(),
      };
    })
    .sort(function (a, b) {
      return a.time - b.time;
    })
    .map(function (v) {
      return v.name;
    });

  var latestFileNumber = filelist[filelist.length - 1].match(/-(\d*)/)[1];
  //console.log(`{getLatestJsonName} filelist: ${filelist}`);
  console.log(`{getLatestJsonName} latestFileNumber: ${latestFileNumber}`);

  console.log(
    `{getLatestJsonName} Latest Json Name: ${filelist[
      filelist.length - 1
    ].replace(/-(\d*)/, `-${Number(latestFileNumber)}`)}`
  );

  return filelist[filelist.length - 1].replace(
    /-(\d*)/,
    `-${Number(latestFileNumber)}`
  );
}

function routingButton(userFolder, state, res) {
  var now = new Date();

  if (state === "start") {
    console.log(`{routingButton} ${userId} press the start button`);
    new Promise((checkContinueResolve, reject) => {
      // 진행중이던 타이머가 있는지 확인해본다
      checkContinue(`${userFolder}`, checkContinueResolve);
    }).then((continuousAndJson) => {
      if (!continuousAndJson.continuous) {
        // 진행중이던 타이머가 없다면 새로 만든다
        if (continuousAndJson.json !== undefined) {
          console.info(
            `{routingButton} [${userId}]: has no continuous timeline`
          );

          var startData = {
            startTime: `${now.getTime()}`,
            switchTime: [`${now.getTime()}`],
            finishTime: "",
          };
          startData = JSON.stringify(startData);
          fs.writeFileSync(`${getNextJsonName(userFolder)}`, startData);
          console.info(
            `{routingButton} [${userId}]: start the timer\nmake ${getNextJsonName(
              userFolder
            )}`
          );

          //res.setHeader("content-type", "text/html");
          //res.status(204).send({ nextJsonName: getNextJsonName(userFolder) });
          /*.send(
              '<script type="text/javascript"> const promise = this.getTimeline(timelineJson);promise.then((data) => {this.timerChart = setInterval(() => {const promiseTimer = this.getTimeline(timelineJson);promiseTimer.then((timeline) => {            var switchGapArray = this.getSwitchGapArray(timeline);            var config = this.getConfig(switchGapArray);           window.myPie.data.datasets[0].data[              window.myPie.data.datasets[0].data.length - 1            ] = switchGapArray[switchGapArray.length - 1];            window.myPie.destroy();            var ctx = document.getElementById("chart").getContext("2d");            window.myPie = new Chart(ctx, config);         });        }, 10000);      });</script>'
            );*/
          //res.status(204).send(); // to prevent to refresh of the page
          res.send(getLatestJsonName(`data/${userId}`));
        } else {
          console.info(`{routingButton} [${userId}]: has no timeline`);
          var startData = {
            startTime: `${now.getTime()}`,
            switchTime: [`${now.getTime()}`],
            finishTime: "",
          };
          startData = JSON.stringify(startData);
          fs.writeFileSync(`${userFolder}/timeline-1.json`, startData);
          console.info(
            `{routingButton} [${userId}]: start the timer\nmake ${userFolder}/timeline-1.json`
          );
          res.send(getLatestJsonName(`/${userId}`));
        }
      }
    });
  } else if (state === "switch") {
    new Promise((checkContinueResolve, reject) => {
      // 진행중이던 타이머가 있는지 확인해본다
      checkContinue(`${userFolder}`, checkContinueResolve);
    }).then((continuousAndJson) => {
      if (continuousAndJson.continuous) {
        var timeline = JSON.parse(
          fs.readFileSync(`${continuousAndJson.json}`).toString()
        );
        timeline.switchTime.push(`${now.getTime()}`);

        console.log(
          `{routingButton} [${userId}] timeline: ${JSON.stringify(timeline)}`
        );
        console.log(
          `{routingButton} [${userId}] switchTime: ${timeline.switchTime}`
        );

        timeline = JSON.stringify(timeline);
        fs.writeFileSync(`${continuousAndJson.json}`, timeline);
      }
    });
    res.status(204).send();
  } // finish 버튼을 눌렀을 때
  else if (state === "finish") {
    new Promise((checkContinueResolve, reject) => {
      // 진행중이던 타이머가 있는지 확인해본다
      checkContinue(`${userFolder}`, checkContinueResolve);
    }).then((continuousAndJson) => {
      if (continuousAndJson.continuous) {
        var timeline = JSON.parse(
          fs.readFileSync(`${continuousAndJson.json}`).toString()
        );

        timeline.finishTime = `${now.getTime()}`;

        console.log(
          `{routingButton} [${userId}] timeline: ${JSON.stringify(timeline)}`
        );
        console.log(
          `{routingButton} [${userId}] finish: ${timeline.finishTime}`
        );

        timeline = JSON.stringify(timeline);
        fs.writeFileSync(`${continuousAndJson.json}`, timeline);
      }
    });
    res.status(204).send();
  }
}

function getTimeString() {
  return (
    "[" + new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + "] "
  );
}

// isFinished send True/False to Resolve
function isFinished(dataFolder, outerResolve) {
  //var files = glob.readdirSync(`${timeFolder}\*[0-9].json`, {});

  var isFinishedPromise = new Promise((resolve, reject) => {
    glob.readdir(`${dataFolder}/*[0-9].json`, function (error, filelist) {
      filelist = filelist
        .map(function (fileName) {
          return {
            name: fileName,
            time: fs.statSync(fileName).mtime.getTime(),
          };
        })
        .sort(function (a, b) {
          return a.time - b.time;
        })
        .map(function (v) {
          return v.name;
        });

      console.log(
        `{isFinished} latest timeline of [${userId}]: <${
          filelist[filelist.length - 1]
        }>`
      );

      var timeline = JSON.parse(
        fs.readFileSync(`${filelist[filelist.length - 1]}`).toString()
      );

      resolve({
        isFinished: timeline.finishTime !== "",
        filelist: filelist,
      });
    });
  });

  isFinishedPromise.then((value) => {
    if (value.isFinished) {
      console.log(
        `{isFinishedPromise.then }[${userId}] <${
          value.filelist[value.filelist.length - 1]
        }>: finished`
      );
      outerResolve(true);
    } else {
      console.log(
        `{isFinishedPromise.then} [${userId}] <${
          value.filelist[value.filelist.length - 1]
        }>: continuous`
      );
      outerResolve(false);
    }
  });
}

function checkContinue(userFolder, outerResolve) {
  const promise = new Promise(function (resolve, reject) {
    console.log(`{checkContinue} userFolder: ${userFolder}`);

    var files = glob.readdirSync(`${userFolder}/*[0-9].json`, {});
    // timeline 파일이 하나라도 있는가?
    if (files != "") {
      //console.info(
      //  `{checkContinue} [${userData.id}] has the timeline ${files}`
      //);

      fs.readdir(`${userFolder}`, function (error, filelist) {
        filelist = filelist
          .map(function (fileName) {
            return {
              name: fileName,
              time: fs
                .statSync(`${userFolder}` + "/" + fileName)
                .mtime.getTime(),
            };
          })
          .sort(function (a, b) {
            return a.time - b.time;
          })
          .map(function (v) {
            return v.name;
          });

        var timeline = JSON.parse(
          fs
            .readFileSync(`${userFolder}/${filelist[filelist.length - 1]}`)
            .toString()
        );

        var isFinishedPromise = new Promise((resolveFinish, reject) => {
          isFinished(userFolder, resolveFinish);
        });

        isFinishedPromise.then((isFinished) => {
          if (!isFinished) {
            console.log(`{checkContinue} [${userId}] has not yet finished`);
            resolve({
              continuous: true,
              json: `./data/${userId}/${filelist[filelist.length - 1]}`,
            });
          } else {
            console.log(
              `{checkContinue}[${userId}] is finished of at <${timeline.finishTime}>`
            );
            resolve({
              continuous: false,
              json: `./data/${userId}/${filelist[filelist.length - 1]}`,
            });
          }
        });
      });
    } else {
      console.info(`{checkContinue} [${userId}] doesn't have the timeline`);
      resolve({
        continuous: false,
        json: undefined,
      });
    }
  });

  promise.then((continuousAndJson) => {
    console.log(
      `{checkContinue} print in then \ncontinuous: ${continuousAndJson.continuous}\njson: ${continuousAndJson.json}`
    );
    outerResolve(continuousAndJson);
  });
}

var global = this;

module.exports = function (app) {
  app.get("/", function (req, res) {
    res.render("index.html");
  });

  app.post("/timer", function (req, res) {
    var body = "";
    var userData = "";
    req.on("data", function (data) {
      body = body + data;
    });
    req.on("end", function () {
      global.userData = qs.parse(body);
      userId = global.userData.id;
      console.log(`when page /timer open at first, get userId as: ${userId}`);
      console.info("userdata: ");
      console.info(global.userData);

      fs.readdir(dataFolder, function (error, filelist) {
        //console.log("dataFolder filelist: " + filelist);
        // 처음 온 유저라면
        if (!fs.existsSync(`${dataFolder}/${global.userData.id}`)) {
          console.log(`[${global.userData.id}] is First User`);
          fs.mkdirSync(`${dataFolder}/${global.userData.id}`); // 유저 폴더 생성
          fs.writeFileSync(
            // 유저 데이터 json파일 생성
            `${dataFolder}/${global.userData.id}/${global.userData.id}-userData.json`,
            JSON.stringify(global.userData)
          );

          renderAsVisit(res, false);
        }
        //온적 있다면
        else {
          console.log(`[${global.userData.id}] is Existing User`);
          /*fs.writeFileSync(
            // 유저 데이터 json파일 생성
            `${dataFolder}/${global.userData.id}/${global.userData.id}-userData.json`,
            JSON.stringify(global.userData)
          );*/
          //오늘 처음 방문했다면

          var checkContinuePromise = new Promise((resolve, reject) => {
            var continuous = checkContinue(
              `${dataFolder}/${global.userData.id}`,
              resolve
            );
          });

          checkContinuePromise.then((continuousAndJson) => {
            console.log(continuousAndJson);
            // 최근 타이머가 끝나지 않았다면
            if (continuousAndJson.continuous) {
              console.log(`continue the <${continuousAndJson.json}>`);
              renderAsVisit(res, true, continuousAndJson.json);
            } // 최근 타이머가 끝났다면
            else {
              console.log(`start new <${continuousAndJson.json}>`);
              renderAsVisit(res, false, continuousAndJson.json);
            }
          });
        }
      });
    });
  });

  app.get("/timer", function (req, res) {
    now = new Date();
    var date = getFormatDate(now);
    var _url = req.url;
    var queryData = url.parse(_url, true).query;
    //userData = fs.readFileSync(userData.json);
    //userData = JSON.parse(userData);

    var timeFolder = `${dataFolder}/${queryData.id}`;

    console.log(queryData.id);
    console.log(getFormatDate(now));
    console.log(timeFolder);
    console.log(!fs.existsSync(timeFolder));
    // start 버튼을 눌렀을 때
    if (
      queryData.state === "start" &&
      !fs.existsSync(`${timeFolder}/timeline.json`)
    ) {
      var startData = {
        startTime: `${now.getTime()}`,
        switch: [`${now.getTime()}`],
        finishTime: "",
      };
      startData = JSON.stringify(startData);
      fs.writeFileSync(`${timeFolder}/timeline.json`, startData);
    } // switch 버튼을 눌렀을 때
    else if (
      queryData.state === "switch" &&
      fs.existsSync(`${timeFolder}/timeline.json`)
    ) {
      var timeline = JSON.parse(
        fs.readFileSync(`${timeFolder}/timeline.json`).toString()
      );
    }
  });

  app.post("/button", function (req, res) {
    //console.log(req);
    //res.send(getNextJsonName(`data/${userId}`));
    console.log(`when button is pressed, userId: ${userId}`);
    var state = "";
    req.on("data", function (data) {
      state = state + data;
    });
    req.on("end", function () {
      routingButton(`data/${userId}`, state, res);
    });
  });

  app.post("/edit", function (req, res) {
    console.log(`route /edit, userId: ${userId}`);
    var changes = "";
    req.on("data", function (data) {
      changes = changes + data;
    });
    req.on("end", function () {
      changes = JSON.parse(changes);
      changes.standardDate = new Date(changes.standardTime);
      console.log(`look here!!!!!1`);
      console.log(changes);
      //console.log(`changes.data ${Number(changes.data[1])}`);
      console.log(
        `new Date().getTime() - 9hour ${Number(
          new Date().getTime() - 9 * 1000 * 60 * 60
        )}`
      );
      new Promise((checkContinueResolve, reject) => {
        // 진행중이던 타이머가 있는지 확인해본다
        checkContinue(`data/${userId}`, checkContinueResolve);
      }).then((continuousAndJson) => {
        if (continuousAndJson.continuous) {
          var timeline = JSON.parse(
            fs.readFileSync(`${continuousAndJson.json}`).toString()
          );
          console.log(JSON.stringify(changes));
          if (changes.option === "showChartEditText") {
            var timeData = {
              startTime: timeline.switchTime[Number(changes.idx)],
              finishTime: timeline.switchTime[Number(changes.idx + 1)],
            };
            timeData = JSON.stringify(timeData);
            res.send(timeData);
          } else if (changes.option === "editTime") {
            changes.data[0] = convertTimeToDate(
              timeline.switchTime[Number(changes.idx)],
              changes.standardDate,
              changes.data[0],
              changes.yesterday[0]
            ).getTime();
            changes.data[1] = convertTimeToDate(
              timeline.switchTime[Number(changes.idx)],
              changes.standardDate,
              changes.data[1],
              changes.yesterday[1]
            ).getTime();
            console.log(`changes.data[0]: ${changes.data[0]}`);
            console.log(
              `timeline.switchTime[changes.idx - 1]: ${
                timeline.switchTime[changes.idx - 1]
              }`
            );

            console.log(`changes.data ${Number(changes.data[1])}`);
            console.log(
              `new Date().getTime() - 9hour ${Number(
                new Date().getTime() - 9 * 1000 * 60 * 60
              )}`
            );
            if (
              changes.idx != 0 &&
              changes.data[0] < timeline.switchTime[changes.idx - 1]
            ) {
              console.log(`입력시간이 앞선 일정 시작시간보다 더 빠릅니다.`);
              res.send(
                JSON.stringify({
                  type: `error`,
                  body: `입력시간이 앞선 일정 시작시간보다 더 빠릅니다.`,
                })
              );
            } else if (
              Number(changes.data[1]) > Number(new Date().getTime()) //-9*1000*60*60)
            ) {
              console.log(`입력시간이 현재 시간보다 더 빠릅니다.`);
              res.send(
                JSON.stringify({
                  type: `error`,
                  body: `입력시간이 현재 시간보다 더 빠릅니다.`,
                })
              );
            } else if (
              timeline.switchTime.length >
              Number(changes.idx) + Number(3)
            ) {
              if (
                timeline.switchTime[Number(changes.idx) + Number(3)] <
                changes.data[1]
              ) {
                console.log(`입력시간이 뒤의 종료 시간보다 더 빠릅니다.`);
                res.send(
                  JSON.stringify({
                    type: `error`,
                    body: `입력시간이 뒤의 종료 시간보다 더 빠릅니다.`,
                  })
                );
              }
            } else if (changes.idx == timeline.switchTime.length - 1) {
              console.log(
                "맨 끝의 친구를 변경하시는 군요. 시작시간만 바뀝니다"
              );
              timeline.switchTime.splice(changes.idx, 1, changes.data[0]);
              if (changes.idx === 0) {
                timeline.startTime = changes.data[0];
              }
              console.log(
                `{routingButton/edit} [${userId}] get in "editStartTime"}`
              );
              res.status(204).send();
            } else {
              console.log(`정상적인 입력입니다.`);
              console.log(`changes.data[0]: ${changes.data[0]}`);
              console.log(
                `timeline.switchTime[changes.idx - 1]: ${
                  timeline.switchTime[changes.idx - 1]
                }`
              );
              timeline.switchTime.splice(
                changes.idx,
                2,
                changes.data[0],
                changes.data[1]
              );
              if (changes.idx === 0) {
                timeline.startTime = changes.data[0];
              }
              console.log(
                `{routingButton/edit} [${userId}] get in "editStartTime"}`
              );
              res.status(204).send();
            }
          } else if (changes.option === "addTimeBlock") {
            timeline.switchTime.push(changes.data[0], changes.data[1]);
            timeline.switchTime.sort(function (a, b) {
              // 오름차순
              return a - b;
              // 1, 2, 3, 4, 10, 11
            });
            console.log(
              `{routingButton/edit} [${userId}] get in "addTImeBlock"}`
            );
            res.status(204).send();
          } else if (changes.option === "deleteTimeBlock") {
            if (changes.idx == 0) {
              if (timeline.switchTime.length == 1) {
                res.send(
                  JSON.stringify({
                    type: `error`,
                    body: `타임블럭이 하나밖에 없습니다.`,
                  })
                );
                return;
              } else {
                timeline.switchTime.splice(changes.idx, 1);
                timeline.startTime = timeline.switchTime[0];
              }
            } else {
              timeline.switchTime.splice(changes.idx, 2);
            }
            console.log(
              `{routingButton/edit} [${userId}] get in "deleteTimeBlock"}`
            );
            res.status(204).send();
          }
          console.log(
            `{routingButton/edit} [${userId}] timeline: ${JSON.stringify(
              timeline
            )}`
          );
          console.log(
            `{routingButton/edit} [${userId}] switchTime: ${timeline.switchTime}`
          );

          timeline = JSON.stringify(timeline);
          fs.writeFileSync(`${continuousAndJson.json}`, timeline);
        }
      });
    });
  });
};