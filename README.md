# express-stream

Response streaming middleware for Express 4.

# Basic Usage

```javascript
//app.js or routes.js file

var stream = require(express-stream);

//Set the templates to be streamed before and after your `res.render()` call
stream.streamBefore(['pre-body-layout']);
stream.streamAfter(['post-body-layout']);

app.get('/', stream.stream(), function (req, res) {
  res.render('landing');
});
```

This example could fire off `pre-body-layout` as soon as the middleware is run, and then `landing` and `post-body-layout` as soon as `res.render()` is called.

# More!

More documentation is coming soon. See this [demo app](https://express-stream-demo.herokuapp.com/) until then.
