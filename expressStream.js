/*
 * Output html to the client
 */
function stream(res, html){
  res.write(html);
  if(res.flush) res.flush();
}

/*
 * BigPipe (client-side render) implementation
 */
exports.pipe = function(req, res, next){
  // var onloadSent = false;

  // function sendOnloadEvent(){
  //   if(onloadSent) return;
  //   var html = '<script>'
  //             +  '(function() {'
  //             +    'var e = document.createEvent("Event");'
  //             +    'e.initEvent("load", true, false);'
  //             +    'window.dispatchEvent(e);'
  //             +  '})();'
  //             + '</script>';
  //   stream(res, html);
  //   onloadSent = true;
  // }

  res.stream = function(view, data){
    res.render(view, data, function (err, html){
      stream(res, html);
      // sendOnloadEvent();
    });
  }

  res.streamText = function(text){
    stream(res, text);
  }

  next();
}

/*
 * Server-side render implementation
 */
var globalOptions = {};
var streamBefore = [];
var streamAfter = [];
var openHtmlOpenHead = false;
var closeHeadOpenBody = false;
var closeBodyCloseHtml = false;

function getStreamableValue(view, options){
  if(typeof view === 'string'){
    return [{view: view, options: options}];
  }
  else if(view instanceof Array){
    return streamBefore = view;
  }
  return [];
}

function getAutoTagValue(view, options){
  if(typeof view === 'boolean'){
    return view;
  }
  else if(typeof view === 'string'){
    return {
      view: view,
      options: options
    }
  }
  return false;
}

exports.globalOptions = function(opts){
  globalOptions = (typeof opts === 'object') ? opts : {};
}

exports.streamBefore = function(view, options){
  streamBefore = getStreamableValue(view, options);
}

exports.streamAfter = function(view, options){
  streamAfter = getStreamableValue(view, options);
}

exports.useAllAutoTags = function(val){
  if(val){
    openHtmlOpenHead = true;
    closeHeadOpenBody = true;
    closeBodyCloseHtml = true;
  }
}

exports.openHtmlOpenHead = function(view, options){
  openHtmlOpenHead = getAutoTagValue(view, options);
}

exports.closeHeadOpenBody = function(view, options){
  closeHeadOpenBody = getAutoTagValue(view, options);
}

exports.closeBodyCloseHtml = function(view, options){
  closeBodyCloseHtml = getAutoTagValue(view, options);
}

exports.stream = function(headView, headOptions, configView){
  return function (req, res, next){

    var headViews = getStreamableValue(headView, headOptions);

    function streamAutoTags(input, html){
      if(input){
        if(typeof input === 'boolean'){
          stream(res, html);
        }
        else if(typeof input === 'object' && input.view){
          res.stream(input.view, input.options);
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
              res.stream(input[i].view, input[i].options);
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

    res.stream = function (view, options) {
      this.render(view, mergeOptions(options), function (err, html){
        stream(res, html);
      });
    }

    res.streamText = function (text) {
      stream(res, text);
    }

    res._end = res.end;
    res.end = function () {
      streamArrayOrString(streamAfter);
      streamAutoTags(closeBodyCloseHtml, '</body></html>');
      res._end();
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
