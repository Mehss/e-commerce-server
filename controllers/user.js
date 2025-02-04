const {User} = require('../models/index')
const {compare} = require('../helpers/bcrypt')
const {jwtDecrypt, jwtEncrypt} = require('../helpers/jwt')
const {OAuth2Client} = require('google-auth-library')
const GCLIENT_ID = process.env.GCLIENT_ID
const client = new OAuth2Client(GCLIENT_ID);

class Controller{
    static login(req, res, next){
        if (!req.body.email || !req.body.password) throw ({name:badRequest, message:"No username or password"})
        User.findOne({where: {email: req.body.email}})
            .then(user => {
                if(!user) {throw {name: "notFound"}}
                if(compare(req.body.password, user.password)) {
                    const token = jwtEncrypt({id: user.id})
                    console.log(token)
                    res.status(200).json({message: "Login successful", access_token: token}) 
                } else {throw {name: "unauthorized", message:"Wrong password"}}
            })
            .catch(error => {
                next(error)
            })
    }
    
    static register(req, res, next){
        console.log('enter')
        if (!req.body.email || !req.body.password) throw ({name:badRequest, message:"No username or password"})
        User.create(req.body)
            .then(() => {
                console.log('created')
                res.status(201).json({message: "registration success"})
            })
            .catch(error => {
                next(error)
            })
    }

    static gLogin(req, res, next){
        let gmail = ""
        client.verifyIdToken({
            idToken: req.body.idToken,
            audience: GCLIENT_ID,
        })
        .then(ticket =>{
            const payload = ticket.getPayload();
            gmail = payload['email'];
            return User.findOne({where:{email: gmail}})
        })
        .then(user => {
            if (!user){
                let randPass = String(Math.random())
                return User.create({email:gmail, password:randPass})
            } else return user
        })
        .then(user =>{
            const token = jwtEncrypt({id: user.id})
            res.status(200).json({message: "login successful", access_token: token})
        })
        .catch (err => {next(err)})
    }
}

module.exports = Controller