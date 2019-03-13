const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const url = require('url');

const User = require('./models/user');
const mongoose = require('./mongoose/mongoose');
const authenticate = require('./middleware/authenticate');

var app = express();
app.use(bodyParser.json());
var port = process.env.PORT || 3000;

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};


app.post('/users/signup', (req, res) => {
    var user = new User(_.pick(req.body, ['name', 'email', 'password', 'phone']));
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
    var imagepath = req.body.imgpath;
    var photo = fs.readFileSync(imagepath);
    var basename = path.posix.basename(imagepath);

    if (!photo) {
        return res.status(401).send();
    }

    req.user.photo = { image: photo, name: basename };

    req.user.save().then(() => {
        res.status(200).send();
    }).catch(e => res.status(401).send());

});

app.get('/profile/:email', (req, res) => {
    User.findByEmail(req.params.email).then((user) => {
        res.render('profile.hbs', {
            name: user.name,
            path: 'http://' + req.headers.host + url.parse(req.url).pathname + '/photo'
        });
    }, (e) => {
        res.sendStatus(400);
    });
});

app.get('/profile/:email/photo', (req, res) => {
    User.findByEmail(req.params.email).then((user) => {
        var x = path.extname(user.photo.name).slice(1);
        res.type(mime[x]);
        res.send(user.photo.image);
    }, (e) => {
        res.sendStatus(400);
    });
});

// app.patch('/profile/update', authenticate, (req, res) => {
//     var { name, email, phone, password, imgpath } = req.body;

//     if (name) {
//         req.user.name = name;
//     }

//     if (email) {
//         req.user.email = email;
//     }

//     if (phone) {
//         req.user.email = phone;
//     }

//     if (password) {
//         req.user.password = password;
//     }

//     if (imgpath) {
//         var photo = fs.readFileSync(imgpath);
//         var basename = path.posix.basename(imagepath);

//         if (!photo) {
//             return res.status(401).send();
//         }
//         req.user.photo = { image: photo, name: basename };
//     }

//     req.user.save().then(() => {
//         res.status(200).send();
//     }).catch(e => res.status(401).send());
// });

app.listen(port, () => {
    console.log('Server listening on port 3000');
});