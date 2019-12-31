let fs = require('fs');
let bcrypt = require('bcryptjs');
let USER_DATA_PATH = "./data/users.json",
    EMPTY_ARRAY = [];

let mongoose = require('mongoose')
let userModel = mongoose.model('user', new mongoose.Schema({
    username: String,
    password: String,
    profileCreated: String,
}))

class UserHandler {
    checkIfExist(username) {

        return new Promise((resolve, reject) => {
            userModel.find({
                username: username
            }).then(data => {
                console.log(data)
                if (data.length !== 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })

    }

    forceWriteUser(username, password) {

        console.log("Forcing!")

        new userModel({
            username: username,
            password: bcrypt.hashSync(password, 10),
            profileCreated: new Date().toUTCString()
        }).save()
    }


    getUser(username) {
        return new Promise((resolve, reject) => {
            userModel.findOne({
                username: username
            }).then(data => {
                resolve(data)
            })
        })
    }
}

module.exports = UserHandler