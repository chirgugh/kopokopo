var express = require("express");
var app = express();
var papa = require("papaparse");
var fs = require("fs");
var moment = require("moment");

var transactions_csv_file_path = "./transaction_data_3.csv";
var n = 3;

app.listen(3000, () => {
  console.log("Server running on port 3000");
  const options = {
    /* options */
  };

  const dataStream = fs.createReadStream(transactions_csv_file_path);
  const parseStream = papa.parse(papa.NODE_STREAM_INPUT, options);

  dataStream.pipe(parseStream);

  let data = [];
  parseStream.on("data", (chunk) => {
    data.push(chunk);
  });

  parseStream.on("finish", () => {
    ////delete the first array item i.e ;Customer ID,Transaction Amount,Transaction Date
    data.shift();

    let newArr = data.map((item) => {
      return item[0];
    });

    //get the unique ids
    var unique = newArr.filter((v, i, a) => a.indexOf(v) === i);

    var finalArray = []; ///push final answers here with the id and the consequtive dates
    var finalLengths = []; ////push consequtive days lengths here for sorting
    unique.map((item) => {
      ////make an array of dates for a specific id
      var dates = data.filter((value) => {
        if (value[0] == item) {
          return value[2];
        }
      });

      ////make dates unique --remove duplicate dates
      var uniqueDates = dates.map((val) => {
        return val[2].replace(" 00:00:00", ""); ////remove the time since all have midnight
      });
      uniqueDates = uniqueDates.filter((v, i, a) => a.indexOf(v) === i);

      /////create timestamps from the unique dates
      var timestamps = uniqueDates.map((object) => {
        var date = object.split("-");
        return new Date(object).valueOf();
      });

      /////find all consequtive days for a specific customer id
      (i = 0), timestamps.sort(); /////sort timestamps to enable better consequtive day alocations
      result = timestamps.reduce(function (stack, b) {
        var cur = stack[i],
          a = cur ? cur[cur.length - 1] : 0;

        if (b - a > 86400000) {
          i++;
        }

        if (!stack[i]) stack[i] = [];

        stack[i].push(b);

        return stack;
      }, []);

      //////////find the largest array of consequtive days
      let max = -Infinity;
      var biggestArray = [];
      result.map((a) => {
        if (a.length > max) {
          max = a.length;
          biggestArray = a;
        }
      });

      //// var jsonObject={'id':item,'length':max,'array':biggestArray}
      finalArray.push([item, max, biggestArray]);
      finalLengths.push(max);
    });

    var maxConsequtive = Math.max(...finalLengths);

    ///find if there are any aray length duplicates so they can be sorted
    var duplicates = finalLengths.filter((value) => {
      return value == maxConsequtive;
    });

    /////display the data from top of the sorted aray
    finalLengths.sort();
    finalLengths.reverse();
    console.log(finalLengths);
    for (var a = 0; a < n; a++) {
      finalArray.map((value) => {
        if (value[1] == finalLengths[a]) {
          console.log("**********************************");
          console.log(a + 1, " Customer => ", value[0]);
          var conDays = value[2].map((val) => {
            return new Date(val).getDate();
          });
          console.log("Consequtive days => ", conDays);
          console.log("**********************************");
        }
      });
    }
  });
});
