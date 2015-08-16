var globalOptions = {};
var streamBefore = [];
var streamAfter = [];
var closeHeadOpenBody = false;

function getStreamableValue(view, options, callback){
  if(typeof view === 'string'){
    return [{view: view, options: options, callback: callback}];
  }
  else if(view instanceof Array){
    return streamBefore = view;
  }
  return [];
}

exports.globalOptions = function(opts){
  globalOptions = (typeof opts === 'object') ? opts : {};
}

exports.streamBefore = function(view, options, callback){
  streamBefore = getStreamableValue(view, options, callback);
}

exports.streamAfter = function(view, options, callback){
  streamAfter = getStreamableValue(view, options, callback);
}

exports.closeHeadOpenBody = function(view, options, callback){
  if(typeof view === 'boolean'){
    closeHeadOpenBody = view;
  }
  else if(typeof view === 'string'){
    closeHeadOpenBody = {
      view: view,
      options: options,
      callback: callback
    }
  }
}

exports.stream = function(headViews, configView){
  return function (req, res, next){

    function streamArrayOrString(input){
      if(input){
        if(typeof input === 'string'){
          res.stream(input);
        }
        else if(input instanceof Array){
          for(var i = 0; i < input.length; i++){
            res.stream(input[i].view, input[i].options, input[i].callback);
          }
        }
      }
    }

    function mergeOptions(opts){
      if(typeof opts === 'object'){
        for(key in globalOptions){
          if(globalOptions.hasOwnProperty(key)){
            opts[key] = globalOptions[key];
          }
        }
        return opts;
      }
      return globalOptions;
    }

    res.set = function(){}

    res._render = res.render;
    res.render = function (view, options, callback) {
      this.isFinalChunk = true;
      this._render(view, mergeOptions(options), callback);
    }

    res.stream = function (view, options, callback) {
      this.isFinalChunk = false;
      this._render(view, mergeOptions(options), callback);
    }

    res._end = res.end;
    res.end = function (chunk, encoding) {
      this.write(chunk, encoding);
      if(this.isFinalChunk){
        streamArrayOrString(streamAfter);
        res._end();
      }
    }

    if(configView){
      res.stream(configView);
    }
    streamArrayOrString(streamBefore);
    streamArrayOrString(headViews);

    if(closeHeadOpenBody){
      var chob = closeHeadOpenBody;
      if(typeof chob === 'boolean'){
        res.write('</head><body>');
      }
      else{
        res.stream(chob.view, chob.options, chob.callback)
      }
    }

    next();
  }
}
