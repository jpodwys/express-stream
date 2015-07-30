var streamBefore = [];
var streamAfter = [];

exports.streamBefore = function(before){
  streamBefore = (typeof before === 'object' && before.length) ? before : [];
}

exports.streamAfter = function(after){
  streamAfter = (typeof after === 'object' && after.length) ? after : [];
}

exports.stream = function(middlewareViews){
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

    if(middlewareViews){
      if(typeof middlewareViews === 'object'){
        for(var i = 0; i < middlewareViews.length; i++){
          res.stream(middlewareViews[i]);
        }
      }
      else if(typeof middlewareViews === 'string'){
        res.stream(middlewareViews);
      }
    }

    next();
  }
}
