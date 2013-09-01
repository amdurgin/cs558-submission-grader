"use strict"
var vm = require("vm");
var fs = require("fs");
var fork = require("child_process").fork;

var _require = require;

//XXX: I didn't think this would get so big... should really be its own js file...
var toRun = ''
+'"use strict" \n'
+'var vm = require("vm");'
+'var fs = require("fs");'
+'var fork = require("child_process").fork;'
+'var _require = require;'
+''//searches through the included js files in the submissiona '
+''//and takes them as the legal modules to require'
+'var buildModWhiteList = function(path, modList){'
+'  var dir  = fs.readdirSync(path);'
+'  for(var i = 0; i < dir.length; i++)'
+'  {'
+'    var ext = (dir[i].split("\."))[dir[i].split("\.").length - 1];'
+'    if(ext.localeCompare("js") == 0){'
+'      modList.push(path + "/" + dir[i]);'
+'    }'
+'    else if(fs.statSync(path + "/" + dir[i]).isDirectory()){'
+'      buildModWhiteList(path + "/" + dir[i], modList);'
+'    }'
+'  }'
+'};'
+''
+''
+''//NOTE: module requires package json file to be in'
+''// pathToSub, and that all other directories are' 
+''//subdirectories of pathToSub'
+''
+''//userFiles is array of file names in submission'
+''//"path" is the main directory, with package.json'
+''//callback(err,val) where val will be user function'
+'var buildFunction = function(path, callback){'
+''  //build initial whitelist of js files in submission'
+'  var modWhiteList = new Array();'
+'  buildModWhiteList(path, modWhiteList); '
+''  //NOTE: here you can add extra modules to whiteList'
+'  '
+''  //the require function to expose in vm context, just 
+'' // checks if module being required is whitelisted.'
+'  var require = function(modStr){'
+'    var flag = false;'
+'    for(var i = 0; i < modWhiteList.length; i++){'
+'      if(modStr.localeCompare(modWhiteList[i] == 0)){'
+'        flag = true;'
+'      }'
+'    }'
+'    if(flag){'
+'      return _require(modStr)'
+'    }else{'
+'      return "Error: Illegal module";'
+'    }'
+'  };'
+'  '
+'  fs.readFile(path + "/package.json", function(err, val){'
+'    if(err){'
+'      console.log(err);'
+'      callback(err);'
+'    }'
+'    else{'
+'      var pkgJson = JSON.parse(String(val));'
+'      var expose = {"userFunc": undefined, "require": require, "console": console};'
+'      var mainPath = path + "/" + pkgJson["main"];'
+'      fs.readFile(mainPath, function(err, mainSrc){'
+'        if(err){'
+'          console.log(err);'
+'          callback(err);'
+'        }'
+'        else{'
+'          vm.runInNewContext("userFunc = require(\'" + mainPath  + "\');", expose);'
+'          callback(null, expose.userFunc);'
+'        }'
+'      });'
+'    }'
+'  });'
+'}\n'
+'var Tester = function(result){'
+'  this.result = result;'
+'  this.assert = function(a, score){'
+'    if(a){'
+'      result.score += score;'
+'    }'
+'  };'
+'  this.end = function(){'//i dont think this is what this is supposed to do...TODO
+'    return result;'
+'  };'
+'};'
+'process.on("message", function(m){'//passed = {"path", "specificaiton"}
+'  buildFunction(m.path, function(err, func){'
+'    if(err){'
+'      console.log(err);'
//+'      process.send("Error:" + err);
+'    }else{'
+'      var results = {"score": 0, "time": 0, "memory": 0 };'
+'      var tester = new Tester(results);'
+'      vm.runInNewContext("var spec =" + m.spec + ";" + "spec(func, tester);", '
+'        {"results": results, "tester": tester, "func": func, "console":console'
+'      });'
+'      process.send(results);'
+'    }'
+'  });'
+'})';


//spec(hw,tester)
var createGrader = function(specification, options){
  //callback(err, result)
  return function gradeSubmission(path, callback){
    fs.writeFile(path + "/tmp.js", toRun, function(err){
      if(err){
        callback(err);
      }else{
        var proc = fork(path + "/tmp.js");
        var failed = true;
        proc.on("message", function(m){
          failed = false;
          callback(null, m);
          proc.kill(); //it doesnt automatically kill itself
        });
        proc.send({"path": path, "spec": specification.toString()});
        //Now start time
        var timeCB = function(){
          if(failed){
            proc.kill();
            callback("TimeOut");
          }
        }
        setTimeout(timeCB, options.time);
      }
    });
  }
}

module.exports = createGrader
