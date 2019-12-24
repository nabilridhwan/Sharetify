let fs = require('fs');
let bcrypt = require('bcryptjs');
let USER_DATA_PATH = "./data/users.json",
    EMPTY_ARRAY = [];

class UserHandler {
    checkIfExist(username) {
        return new Promise((resolve, reject) => {
            console.log("Checking!")
            let userfound = false;

            fs.readFile(USER_DATA_PATH, (error, data) => {
                let json = JSON.parse(data);

                // FIXME: resolve and rejection
                if (json.length !== 0) {
                    json.forEach(user => {
                        console.log(username == user.username)
                        if (username == user.username) {
                            userfound = true;
                        }
                    })
                }
            })

            setTimeout(() => {
                resolve(userfound)
            }, 100);
        })

    }

    forceWriteUser(username, password) {

        console.log("Forcing!")

        fs.readFile(USER_DATA_PATH, (error, data) => {
            let json = JSON.parse(data);
            let hashedpassword = bcrypt.hashSync(password, 10);

            json.push({
                username: username,
                password: hashedpassword,
                dateCreated: new Date(),
            })

            fs.writeFile(USER_DATA_PATH, JSON.stringify(json), (err) => {
                if (err) console.log(err)
            })
        })
    }


    getUser(username) {
        return new Promise((resolve, reject) => {
            fs.readFile(USER_DATA_PATH, (error, data) => {
                let json = JSON.parse(data);

                if (json.length !== 0) {
                    // Find the user!
                    json.forEach(user => {
                        if (username == user.username) {
                            resolve(user);
                        }
                    })
                } else {
                    resolve(EMPTY_ARRAY);
                }
            })
        })
    }
}

module.exports = UserHandler