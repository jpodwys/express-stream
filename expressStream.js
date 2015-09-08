var globalOptions = {};
var streamBefore = [];
var streamAfter = [];
var openHtmlOpenHead = false;
var closeHeadOpenBody = false;
var closeBodyCloseHtml = false;

function getStreamableValue(view, options, callback){
  if(typeof view === 'string'){
    return [{view: view, options: options, callback: callback}];
  }
  else if(view instanceof Array){
    return streamBefore = view;
  }
  return [];
}

function getAutoTagValue(view, options, callback){
  if(typeof view === 'boolean'){
    return view;
  }
  else if(typeof view === 'string'){
    return {
      view: view,
      options: options,
      callback: callback
    }
  }
  return false;
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

exports.useAllAutoTags = function(val){
  if(val){
    openHtmlOpenHead = true;
    closeHeadOpenBody = true;
    closeBodyCloseHtml = true;
  }
}

exports.openHtmlOpenHead = function(view, options, callback){
  openHtmlOpenHead = getAutoTagValue(view, options, callback);
}

exports.closeHeadOpenBody = function(view, options, callback){
  closeHeadOpenBody = getAutoTagValue(view, options, callback);
}

exports.closeBodyCloseHtml = function(view, options, callback){
  closeBodyCloseHtml = getAutoTagValue(view, options, callback);
}

exports.stream = function(headView, headOptions, headCallback, configView){
  return function (req, res, next){

    var headViews = getStreamableValue(headView, headOptions, headCallback);

    function streamAutoTags(input, html){
      if(input){
        if(typeof input === 'boolean'){
          res.write(html);
        }
        else if(typeof input === 'object' && input.view){
          res.stream(input.view, input.options, input.callback);
        }
      }
    }

    function streamArrayOrString(input){
      if(input){
        if(typeof input === 'string'){
          res.stream(input);
        }
        else if(input instanceof Array){
          for(var i = 0; i < input.length; i++){
            if(typeof input[i] === 'string'){
              res.stream(input[i]);
            }
            else if(typeof input[i] === 'object'){
              res.stream(input[i].view, input[i].options, input[i].callback);
            }
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
      return this;
    }

    res.stream = function (view, options, callback) {
      this.isFinalChunk = false;
      this._render(view, mergeOptions(options), callback);
      return this;
    }

    res._end = res.end;
    res.end = function (chunk, encoding) {
      this.write(chunk, encoding);
      if(this.isFinalChunk){
        streamArrayOrString(streamAfter);
        streamAutoTags(closeBodyCloseHtml, '</body></html>');
        res._end();
      }
    }

    streamAutoTags(openHtmlOpenHead, '<!doctype html><html><head>');
    if(configView){
      res.stream(configView);
    }
    streamArrayOrString(streamBefore);
    streamArrayOrString(headViews);
    streamAutoTags(closeHeadOpenBody, '</head><body>');

    next();
  }
}

var wrapJavascript = false;

exports.wrapJavascript = function(val){
  wrapJavascript = (typeof val === 'boolean') ? val : false;
}

exports.pipe = function(){
  return function (req, res, next){

    function sendOnloadEvent(){
      var chunk = '<script>'
                +  '(function() {'
                +    'var e = document.createEvent("Event");'
                +    'e.initEvent("load", true, false);'
                +    'window.dispatchEvent(e);'
                +  '})();'
                + '</script>';
      res.write(chunk);
    }

    function wrapChunk(chunk){
      if(wrapJavascript){
        chunk = '<script>' + chunk + '</script>';
      }
      return chunk;
    }

    res.set = function(){}

    res._render = res.render;
    res.stream = function (view, options, callback) {
      this.isFinalChunk = false;
      this._render(view, options, callback);
      sendOnloadEvent();
      return this;
    }

    res.pipe = function (chunk, encoding) {
      this.isFinalChunk = false;
      chunk = getChunk(chunk);
      this.end(chunk, encoding);
      return this;
    }

    res.close = function (chunk, encoding) {
      this.isFinalChunk = true;
      chunk = getChunk(chunk);
      this.end(chunk, encoding);
    }

    res._end = res.end;
    res.end = function (chunk, encoding) {
      this.write(chunk, encoding);
      if(this.isFinalChunk){
        res._end();
      }
    }

    next();
  }
}
