let express = require('express');
let bodyParser = require('body-parser');
let UserHandler = require('./UserHandler');
let bcrypt = require('bcryptjs');
let session = require('express-session');
let fs = require('fs');
let SHARES_DATA_PATH = "./data/shares.json"
let app = express();

let PORT = process.env.PORT || 3000;

let ushd = new UserHandler();

app.use(express.static("public"))

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    'secret': 'nosecretnomore'
}))

app.use((request, response, next) => {
    if (request.session) {
        console.log(request.session)
        next();
    }
})

app.get("/", (request, response) => {

    fs.readFile(SHARES_DATA_PATH, (error, data) => {
        response.render("home", {
            "shares": JSON.parse(data).reverse()
        });
    })
})

app.get("/signup", (request, response) => {
    if (request.session.userdata) {
        response.redirect("profile")
        response.end()
    } else {
        response.render("signup")
        response.end()
    }
})

app.post("/signup", (request, response) => {

    // Replaces all spaces with nothing
    console.log("Hit Signup!")
    let {
        password,
        confirmpassword
    } = request.body;

    let username = request.body.username.replace(" ", "");

    if (confirmpassword !== password) {
        // Redirect to error page (by request)
        errorHandler("Both passwords does not match!", request, response);
    } else {
        // Check if user exist
        ushd.checkIfExist(username).then(doesExist => {
            console.log(doesExist);
            if (doesExist) {
                // Error!
                errorHandler("User Exists! Try sign-ing up with a different username or logging-in!", request, response);
            } else {
                // Force write user
                console.log("Layer down forcing!")
                ushd.forceWriteUser(username, password);
                response.redirect("/")
                response.end();
            }
        })
    }
})

app.get("/login", (request, response) => {
    console.log(request.session.userdata)
    if (request.session.userdata !== undefined) {
        response.redirect("profile")
        response.end()
    } else {
        response.render("login")
        response.end()
    }
})

app.post("/login", (request, response) => {
    let {
        password,
    } = request.body;

    // Replaces all spaces with nothing
    let username = request.body.username.replace(" ", "");

    console.log(`Username: ${username}`)

    // Check if user exist
    ushd.checkIfExist(username).then(doesExist => {
        console.log(`User Exist? ${doesExist}`)
        if (doesExist) {

            // Get the user!
            ushd.getUser(username).then(user => {
                // Verify the password!
                bcrypt.compare(password, user.password).then(isCorrect => {
                    console.log(isCorrect);
                    if (isCorrect) {
                        // Set the session to the user!
                        request.session.userdata = user;
                        console.log(request.session)

                        // Redirect to profile page
                        response.redirect("profile");
                    } else {
                        errorHandler("Username or Password is incorrect!", request, response);
                    }
                })
            })

        } else {
            // Give an error message!
            errorHandler("User does not exist!", request, response);
        }
    })
})

app.get("/error", (request, response) => {
    response.render("error", {
        "errormessage": encodeURIComponent(request.query.errormessage)
    })
})

app.get("/profile", (request, response) => {
    if (request.session.userdata !== undefined) {
        response.render("user/profile", {
            "userdata": request.session.userdata
        })
    } else {
        response.redirect("login")
    }
})

app.post("/new/share", (request, response) => {
    let {
        share_caption,
        share_track_uri
    } = request.body;

    // Verify the url wheteher it is from spotify or not!
    if (share_track_uri.includes("open.spotify.com")) {
        let type = share_track_uri.split("/")[3];
        let uri = share_track_uri.split("/")[4];

        let embed_link = `https://open.spotify.com/embed/${type}/${uri}`
        // TODO: Write a post handler class! - bring along the fs require
        fs.readFile(SHARES_DATA_PATH, (error, data) => {
            let json = JSON.parse(data);
            json.push({
                "share_caption": share_caption,
                "share_track_uri": share_track_uri,
                "userCreated": request.session.userdata,
                "embedLink": embed_link,
                "dateCreated": new Date(),
            })

            fs.writeFile(SHARES_DATA_PATH, JSON.stringify(json), (err => {
                if (err) console.log(err)
            }))

            response.redirect("/shares")
        })
    } else {
        errorHandler("Invalid Spotify Track URL, Please head on the your preferred Spotify app, Share > Copy Song URL and Paste it again!", request, response);
    }

})

app.get("/shares", (request, response) => {
    fs.readFile(SHARES_DATA_PATH, (error, data) => {
        response.render("shares", {
            "shares": JSON.parse(data)
        });
    })
})

app.post("/logout", (request, response) => {
    request.session.userdata = undefined;
    response.redirect("/")
})


// FIXME: Do the change password route
app.post("/changepassword", (request, response) => {
    let {
        previouspassword,
        newpassword,
        confirmnewpassword
    } = request.body;

    // Verify the old password
    // Set the new password by setting new value!
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`)
})

function errorHandler(errormessage, request, response) {
    response.redirect(`/error?errormessage=${errormessage}`);
    response.end();
}