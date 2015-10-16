# express-stream

Response streaming middleware for Express 4.

# What is This?

express-stream exposes two middleware functions.
* `stream.pipe()` is the least opinionated BigPipe implementation around and is ideal for client-side rendering
* `stream.stream()` is ideal for server-side rendering

Both methods allow you to get content in front of your users as fast as possible by taking forms of latency that generally occur sequentially and making them occur in parallel.

# Basic Client-Side Render/BigPipe Usage

```javascript
//Requires
var express = require('express');
var ejs = require('ejs');
var stream = require('express-stream');
var superagent = require('superagent');

//App setup
var app = express();
app.set('views', './views');
app.set('view engine', 'ejs');

//Add the middleware to the desired routes
app.get('/', stream.pipe(), function (req, res) {
  res.stream('landing'); //Stream the landing page
  superagent
    .get(uri)
    .end(function (err, response){
      res.stream('landing-data', {response.body.data}); //Stream data to populate the landing page
      res.close();
    }
  );
});
```

This example would immediately stream 'landing' to the browser while the superagent call fetches the dynamic parts of the page. As soon as the superagent call resolves, it is streamed within a self-executing JavaScript block from which it injects some data into the already-rendered view.

# Basic Server-Side Render Usage

```javascript
//Requires
var express = require('express');
var ejs = require('ejs');
var stream = require('express-stream');

//App setup
var app = express();
app.set('views', './views');
app.set('view engine', 'ejs');

//App-wide streaming setup
stream.useAllAutoTags(true);
stream.streamBefore('pre-body-view');
stream.streamAfter('post-body-view');

//Add the middleware to the desired routes
app.get('/', stream.stream(), function (req, res) {
  res.render('landing'); //This route will now stream
});
```

This example streams the `pre-body-layout` view as soon as the `stream.stream()` middleware is run, and then `landing` and `post-body-layout` as soon as `res.render()` is called.




# API

## A note about the API section

Because express-stream's two middleware functions patch express's res object differently, the API section is divided into two portions--one for each middleware function. Any functions you see within a section are only applicable when used with the middleware from the same portion of the API. `stream.pipe()`'s API is simpler so it's in a table. `stream.stream()`'s API is more complex so it's written out with examples.

# stream.pipe()

| Function  | Scope  | Description  | Arguments   |
|---|---|---|---|---|
| stream.pipe()  | middleware   | This middleware function is written for client-side rendering. It can be used as a loose BigPipe implementation.  | N/A   |
|res.stream(view, options, callback)   | res   | When you use `.pipe()`, this funciton is added to the `res` object. It is the same as `res.render()` except that it does not close the HTTP connection.   | Same as express   |
| res.pipe(output, encoding)  | res  | Send a string of JavaScrpit to the client | `Output`: JavaScript output as a string `Encoding`: defaults to 'UTF-8' |
| res.close(output, encoding)  | res | Same as `res.pipe()`, but closes the connection when finished. | Same as `res.pipe()`  |
| stream.wrapJavascript(val)  | stream | Whether to wrap all `res.pipe()` and `res.close()` output with '<script>' and '</script>'  | `val`: boolean stating whether to use this feature, defaults to false |

# stream.stream()

## .globalOptions(options)

> **_App-wide API Call_**

Set an app-wide options object to be merged with the `options` param passed to all `res.render()` and `res.stream()` calls.

#### Arguments

* options: type: object, default: {}

## .streamBefore(view, options, callback)

> **_App-wide API Call_**

Set an app-wide view, or array of views, to stream as soon as the `stream.stream()` middleware is run. It's recommended that the views passed to `.streamBefore()` be used to open the `<html>` and `<head>` tags and list site-wide dependencies.

If `view` is an array, all other passed params will be ignored.

#### Arguments

* view: type: string || array of strings || array of objects
* options: same as express's `options` param
* callback: same as express's `callback` param

#### Examples

With `view` as a string
```javascript
stream.streamBefore('global-head', {custom: data});
```

With `view` as an array of strings
```javascript
stream.streamBefore(['global-head-one', 'global-head-two']);
```

With `view` as an array of objects
```javascript
var globalHeadList = [
  {view: 'global-head-one', options: {custom: data}},
  {view: 'global-head-two'}
]
stream.streamBefore(globalHeadList);
```

## .streamAfter(view, options, callback)

> **_App-wide API Call_**

Set an app-wide view, or array of views, to stream as soon as the `res.render()` call completes. It's recommended that the views passed to `.streamAfter()` be used to close the `<body>` and `<html>` tags.

If `view` is an array, all other passed params will be ignored.

#### Arguments

* view: type: string || array of strings || array of objects
* options: same as express's `options` param
* callback: same as express's `callback` param

#### Examples

With `view` as a string
```javascript
stream.streamAfter('global-footer', {custom: data});
```

With `view` as an array of strings
```javascript
stream.streamAfter(['global-footer-one', 'global-footer-two']);
```

With `view` as an array of objects
```javascript
var globalHeadList = [
  {view: 'global-footer-one', options: {custom: data}},
  {view: 'global-footer-two'}
]
stream.streamAfter(globalHeadList);
```

## .openHtmlOpenHead(view, options, callback)

> **_App-wide API Call_**

If `view` is `true`, this will simply stream a `<!doctype html><html><head>` string to the client. If `view` is a string, this will stream the associated view with optional `options` and `callback`.

#### Arguments

* view: boolean or string
* options: same as express's `options` param
* callback: same as express's `callback` param

## .closeHeadOpenBody(view, options, callback)

> **_App-wide API Call_**

If `view` is `true`, this will simply stream a `</head><body>` string to the client. If `view` is a string, this will stream the associated view with optional `options` and `callback`.

#### Arguments

* view: boolean or string
* options: same as express's `options` param
* callback: same as express's `callback` param

## .closeBodyCloseHtml(view, options, callback)

> **_App-wide API Call_**

If `view` is `true`, this will simply stream a `</body></html>` string to the client. If `view` is a string, this will stream the associated view with optional `options` and `callback`.

#### Arguments

* view: boolean or string
* options: same as express's `options` param
* callback: same as express's `callback` param

## .useAllAutoTags(val)

> **_App-wide API Call_**

A convenience method to set the same boolean value for `openHtmlOpenHead`, `closeHeadOpenBody`, and `closeBodyCloseHtml` in a single call.

#### Arguments

* val: boolean or string

## .stream(headView, headOptions, headCallback)

> **_Middleware-only API Call_**

Set an optional route-specific view, or list of views, to be rendered after the `.streamBefore()` array and before any `res.stream()`/`res.render()` views. It's recommended that your `.streamBefore()` views not close the `<head>` tag so that route-specific blocking dependencies can be injected into the `<head>` here.

If `headView` is an array, all other passed params will be ignored.

#### Arguments

* headView: type: string || array of strings || array of objects
* headOptions: same as express's `options` param
* headCallback: same as express's `callback` param

#### Examples

With `headView` as a string

```javascript
app.get('/stream-route', stream.stream('render-blocking-assets', {custom: data}), function (req, res){
  res.render('stream-body');
});
```

With `headView` as an array of strings

```javascript
app.get('/stream-route', stream.stream(['blocking-one', 'blocking-two']), function (req, res){
  res.render('stream-body');
});
```

With `headView` as an array of objects

```javascript
var blockingList = [
  {view: 'blocking-one', options: {custom: data}},
  {view: 'blocking-two'}
]
app.get('/stream-route', stream.stream(blockingList), function (req, res){
  res.render('stream-body');
});
```

## res.render(view, options, callback)

> **_Route-specific API Call_**

Compiles and streams a view, then compiles and streams the views set by `.streamAfter()`, then closes the connection.

#### Arguments

* All arguments are identical to `express`'s `res.render()` call

## res.stream(view, options, callback)

> **_Route-specific API Call_**

Compiles and streams a view just like `res.render()`, but does not trigger the `.streamAfter()` array and does not close the connection.

#### Arguments

* All arguments are identical to `express`'s `res.render()` call

# More!

Usage examples are coming. In the mean time, see this [demo app](https://express-stream-demo.herokuapp.com/).
