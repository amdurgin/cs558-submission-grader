submission-grader
========================

Takes assignment specific information and builds a grading function.

Usage:
```javascript
//There is a single function exposed, createGrader(), which takes two arguments
//, the first is specifications, a function that takes a solution function and
// a tester object and grades the solution. And the second argument is 
//options, an object with the following members: "time" 
// -- given in ms, "memory" -- given in mb, which are limits to runtime and 
//memory usage for submissions.
//createGrader() returns a grading function which takes two arguments, the 
//first is the path to the submission to grade, the second is a callback
//which is passed an error string as the first argument if there is an error, 
//otherwise the first argument is null and the second is the score received.
var createGrader = require("cs558-submission-grader");

var gradingFunction = createGrader(function(homeworkFunc, tester){//stuff}, {"time": 1000, "memory": 10});
var score = gradingFunction(pathToSubmission, function(err, val){
  if(err){
    //error grading, maybe timeout or crash or something
  }else{
    // val is the score the submission received
  }
});
```
