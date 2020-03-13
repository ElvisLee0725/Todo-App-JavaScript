let express = require('express');
let mongodb = require('mongodb');
let sanitizeHTML = require('sanitize-html');
let app = express();
let db

app.use(express.static('public'));

let connectionString = 'mongodb+srv://elvis0725:Sj6ESJiKmV7IEAYF@cluster0-nlkvn.mongodb.net/TodoApp?retryWrites=true&w=majority'

const port = process.env.PORT || 3000;
mongodb.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  db = client.db();
  app.listen(port);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function passwordProtected(req, res, next) {
  res.set('WWW-Authenticate', 'Basic realm="Simple Todo App"');
  // console.log(req.headers.authorization) to see what you have inputed on the popup become
  if(req.headers.authorization === 'Basic ZWx2aXNsZWUwNzI1OkFtYWxmaTE2MDEySUM=') {
    next();
  }
  else {
    res.status(401).send("Authentication required!");
  }
}

app.use(passwordProtected);   // Tell the app to use passwordProtected function for all routes

app.get('/', passwordProtected, (req, res) => {
    // Get all items and transfer data into array
    db.collection('items').find().toArray((err, items) => {
      res.send(`<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Simple To-Do App</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
        </head>
        <body>
          <div class="container">
            <h1 class="display-4 text-center py-1">To-Do App</h1>
            
            <div class="jumbotron p-3 shadow-sm">
              <form id="create-form" action="/create-item" method="POST">
                <div class="d-flex align-items-center">
                  <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
                  <button class="btn btn-primary">Add New Item</button>
                </div>
              </form>
            </div>
            
            <ul id="item-list" class="list-group pb-5">
             
            </ul>
            
          </div>
          
          <script>
              let items = ${JSON.stringify(items)};
          </script>
          <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
          <script src="/browser.js"></script>
        </body>
        </html>`);
      });
});

app.post('/create-item', (req, res) => {
  const safeText = sanitizeHTML(req.body.text, { allowedTags: [], allowedAttributes: {} }); // Do not allow any tags and attributes
  db.collection('items').insertOne({ text: safeText }, (err, info) => {
    res.json(info.ops[0]);
  });
});

app.post('/update-item', (req, res) => {
  const safeText = sanitizeHTML(req.body.text, { allowedTags: [], allowedAttributes: {} }); 
  // The mongodb ID cannot just be a string. Must use new mongodb.ObjectId() to create
  db.collection('items').findOneAndUpdate({_id: new mongodb.ObjectId(req.body.id)}, {$set: {text: safeText}}, () => {
    res.send("success");
  });
});

app.post('/delete-item', (req, res) => {
  db.collection('items').deleteOne({_id: new mongodb.ObjectId(req.body.id)}, () => {
    res.send("success");
  });
});