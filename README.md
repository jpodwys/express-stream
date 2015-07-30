# express-stream

Response streaming middleware for Express 4.

# Basic Usage

```javascript
//app.js or routes.js file
var stream = require(express-stream);

//Set the templates to be streamed before and after your `res.render()` call
stream.streamBefore(['pre-body-layout']);
stream.streamAfter(['post-body-layout']);

//Add the middleware to the desired routes
app.get('/', stream.stream(), function (req, res) {
  res.render('landing');
});
```

This example streams the `pre-body-layout` view as soon as the `stream.stream()` middleware is run, and then `landing` and `post-body-layout` as soon as `res.render()` finishes.

# API

## .streamBefore(before)

Set an app-wide array of views to stream as soon as the `stream.stream()` middleware is run. It's recommended that this be used to open the `<html>` and `<head>` tags and list site-wide dependencies.

* before: type: array of strings, default: []

## .streamAfter(after)

Set an app-wide array of views to stream as soon as the `re.render()` call completes. It's recommended that this be used to close the `<body>` and `<html>` tags.

* after: type: array of strings, default: []

## .stream(middlewareViews)

> This is a middleware-only function

Set an optional route-specific list of views to be rendered after the `.streamBefore()` array and before the `res.render()` view. It's recommended that your `.streamBefore()` views not close the `<head>` tag so that route-specific blocking dependencies can be injected into the `<head>` here. It is acceptable for the final view in `middlewareViews` to close the `<head>` tag.

* middlewareViews: type: array of strings || single string, default: undefined

## res.render(view, options, callback)

Compiles and streams a view, then compiles and streams the views set by `.streamAfter()`, then closes the connection.

* All arguments are identical to `express`

## res.stream(view, options, callback)

Compiles and streams a view just like `res.render()`, but does not trigger the `.streamAfter()` array and does not close the connection.



# More!

More documentation is coming soon. See this [demo app](https://express-stream-demo.herokuapp.com/) until then.
