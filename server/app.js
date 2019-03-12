const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const User = require('./models/user');
const mongoose = require('./mongoose/mongoose');
const authenticate = require('./middleware/authenticate');

var app = express();
app.use(bodyParser.json());
var port = process.env.PORT || 3000;


app.post('/users/signup', (req, res) => {
    var user = new User(_.pick(req.body, ['name', 'email','password', 'phone']));
    console.log(user);

    user.save().then(() => {
        res.status('200').send(user);

    }).catch((e) => res.status(401).send(e))
});

app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch((e) => {
        console.log(e);
        res.status(401).send();
    });
});

app.post('/users/postphoto', authenticate, (req, res) => {
    console.log('authenticated');
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log('Server listening on port 3000');
});