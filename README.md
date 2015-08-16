# express-stream

Response streaming middleware for Express 4.

# Features

* Get your render-blocking assets to the browser so the browser can fetch them while you process and send the rest of your response!
* Stream as many views per route as you want
* Robust API
* Tiny footprint

# Basic Usage

```javascript
//app.js or routes.js file
var stream = require(express-stream);

//Set the templates to be streamed before and after your `res.render()` call
stream.streamBefore('pre-body-layout');
stream.streamAfter('post-body-layout');

//Add the middleware to the desired routes
app.get('/', stream.stream(), function (req, res) {
  res.render('landing');
});
```

This example streams the `pre-body-layout` view as soon as the `stream.stream()` middleware is run, and then `landing` and `post-body-layout` as soon as `res.render()` is called.

# How Does It Work?

When the `stream.stream()` middleware is used, `express-stream` patches `express`'s `res` object so that the calls you make within the affected route will now stream data in several responses rather than build up one massive HTML string and send it as a single response.

# Order of Calls

As the API section below demonstrates, there are five different stream events you can hook into. While this is not the order in which you will call each of these functions, `express-stream` will output the value of each of the following functions in the following order:

1. `stream.streamBefore()`
2. `stream.stream()` (the middleware function)
3. `stream.closeHeadOpenBody()`
4. `res.stream()`/`res.render()`
5. `stream.streamAfter()`

# API

> App-wide API calls

## .globalOptions(options)

Set an app-wide options object to be merged with the `options` param passed to all `res.render()` and `res.stream()` calls.

* options: type: object, default: {}

## .streamBefore(view, options, callback)

Set an app-wide view, or array of views, to stream as soon as the `stream.stream()` middleware is run. It's recommended that the views passed to `.streamBefore()` be used to open the `<html>` and `<head>` tags and list site-wide dependencies.

#### Arguments

* view: type: string || array of objects
* options: same as express's `options` param
* callback: same as express's `callback` param

#### Examples

With `view` as a string
```javascript
stream.streamBefore('global-head', {custom: data});
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

Set an app-wide view, or array of views, to stream as soon as the `res.render()` call completes. It's recommended that the views passed to `.streamAfter()` be used to close the `<body>` and `<html>` tags.

#### Arguments

* view: type: string || array of objects
* options: same as express's `options` param
* callback: same as express's `callback` param

#### Examples

With `view` as a string
```javascript
stream.streamAfter('global-footer', {custom: data});
```

With `view` as an array of objects
```javascript
var globalHeadList = [
  {view: 'global-footer-one', options: {custom: data}},
  {view: 'global-footer-two'}
]
stream.streamAfter(globalHeadList);
```

## .closeHeadOpenBody(view, options, callback)

If `view` is `true`, this will simply stream a `</head><body>` string to the client. If `view` is a string, this will stream the associated view with optional `options` and `callback`.

* view: boolean or string
* options: same as express's `options` param
* callback: same as express's `callback` param

> Middleware-only API calls

## .stream(middlewareViews)

Set an optional route-specific list of views to be rendered after the `.streamBefore()` array and before the `res.render()` view. It's recommended that your `.streamBefore()` views not close the `<head>` tag so that route-specific blocking dependencies can be injected into the `<head>` here. It is acceptable for the final view in `middlewareViews` to close the `<head>` tag.

* middlewareViews: type: array of strings || single string, default: undefined

> Route-only API calls

## res.render(view, options, callback)

Compiles and streams a view, then compiles and streams the views set by `.streamAfter()`, then closes the connection.

* All arguments are identical to `express`

## res.stream(view, options, callback)

Compiles and streams a view just like `res.render()`, but does not trigger the `.streamAfter()` array and does not close the connection.



# More!

More documentation is coming soon. See this [demo app](https://express-stream-demo.herokuapp.com/) until then.
