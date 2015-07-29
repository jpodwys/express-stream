var fs = require('fs');

exports.write = function(path, encoding){
  return function(req, res, next){
    var headerFile = fs.readFileSync(path, encoding);
    res.write(headerFile);
    next();
  }
}

var streamBefore = ['layout-pre-body'];
var streamAfter = ['layout-post-body'];

exports.setStreamBefore = function(before){
  streamBefore = before;
}

exports.setStreamAfter = function(after){
  streamAfter = after;
}

exports.stream = function(){
  return function (req, res, next){

    res.set = function(){}

    res._render = res.render;
    res.render = function (view, options, callback) {
      this.isFinalChunk = true;
      this._render(view, options, callback);
    }

    res.stream = function (view, options, callback) {
      this.isFinalChunk = false;
      this._render(view, options, callback);
    }

    res._end = res.end;
    res.end = function (chunk, encoding) {
      this.write(chunk, encoding);
      if(this.isFinalChunk){
        for(var i = 0; i < streamAfter.length; i++){
          res.stream(streamAfter[i]);
        }
        this._end();
      }
    }

    for(var i = 0; i < streamBefore.length; i++){
      res.stream(streamBefore[i]);
    }

    next();
  }
}
