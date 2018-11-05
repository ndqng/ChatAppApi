var express = require('express');
var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var router = express.Router();
var jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'xxquangnd@gmail.com',
      pass: 'Talactroi01'
    }
  });


const connection = closure => mongoClient.connect(process.env.DATABASE, {
    useNewUrlParser: true
}, (err, client) => {
    if (err) console.log(err);
    const db = client.db('lof_workplace');
    closure(db, client);
});

// CREATE TEAM

// Request body: team {
//     name
//     description
//     avatar
//     business type
// }, 
//     user_creator_id,

router.post("/createTeam",(req,res) =>{
    let team = req.body.team;
    team['creator_id'] = req.body.user_id;
    team['created_at'] = new Date().getTime();
    team['status'] = "pending";

    connection((db,client) => {
        db.collection("teams").insertOne(team);
        client.close();

        // Send response
        res.send("1 team inserted!");
    })
})

// DELETE TEAM
// Request body: {team_id,user_id}
router.post("/destroyTeam",(req,res) =>{
    connection((db,client) => {
        db.collection("teams").findOne({_id: ObjectId(req.body.team_id)}).then(result => {
            if(result.creator_id != req.body.user_id){
                // Send response
                res.send("You don't have permission to delete this Room!");
                client.close();
            } else {
                db.collection("teams").deleteOne(result);
                db.collection("teams_trash").insertOne(result);
                client.close();

                // Send response
                res.send("1 team deleted!");
            }
        })
    })
})   

/** INVITE MEMBERS
Request body {
    user(creator): {_id,name,email,phonenumber},
    team: {_id,name,description,businesstype,status},
    listEmail
} */
router.post("/inviteMembers",(req,res) =>{
    let team_id = ObjectId(req.body.team._id);
    connection((db,client) => {    
        if(req.body.user && req.body.team){
            db.collection("teams").findOne({_id : team_id, creator_id: req.body.user._id}).then(result => {
                if(result){
                    if(req.body.listEmail){
                        req.body.listEmail.forEach(e =>{
                            let token = jwt.sign({
                                email: e,
                                team: req.body.team,
                                sender: req.body.user, 
                            }, process.env.secret_string, // set secret string by env
                            {
                                expiresIn: "1h",
                            });

                            var mailOptions = {
                                from: 'xxquangnd@gmail.com',
                                to: e,
                                subject: 'Sending Email using Node.js',
                                text: req.body.user.name + " has invited you into his team, "+req.body.team.name+" Check this "+process.env.DOMAIN+"/service/team/confirm?tok="+token
                              };
                              
                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                }
                            });
                        })
                    }
                    client.close();
                    // send response
                    res.send("An email has been sent to people who in list invite!");
                } else {
                    client.close();
                    // send response
                    res.send("You don't have permission to invite members in this team!");
                }
            })
        } else {
            res.send("Warning: Bad Request!");
        }
    })
})

// CONFIRM INVITE
/**Confirm by token in the link */
router.get("/confirm",(req,res) =>{
    try {
        let token = req.query.tok;
        let decoded = jwt.verify(token, process.env.secret_string);
        console.log(decoded);
        connection((db,client) => {
            db.collection("users").findOne({email: decoded.email}).then(result=>{
                if(result){
                    db.collection("teams").updateOne(
                        { _id: ObjectId(decoded.team._id)},
                        { $push: {
                            members: {_id: result._id, first_name: result.first_name,last_name: result.last_name,email: result.email, avatar: result.avatar} 
                        }
                    })
                    db.collection("users").updateOne(
                        {_id: ObjectId(result._id)},
                        { $push: { list_teams: req.body.team }}
                    )
                } else {
                    // show Register Form
                    res.render("index.ejs", {decoded: decoded});
                }
                client.close();
            })
        })
    } catch (error) {
        return res.json({
            message: 'Your invite is expired!',
            confirm_status: 0
        });
    }
})

//REMOVE members
/** Request body: user_id,team_id,member_id */
router.post("/removeMember",(req,res) => {
    let team_id = ObjectId(req.body.team_id);
    let member_id = ObjectId(req.body.member_id);
    
    connection((db,client) => {
        db.collection("teams").findOne({
                 _id : team_id,
                 creator_id: req.body.user_id,
                 members: { $elemMatch: {_id: req.body.member_id}}
            }).then(result=>{
                if(result){
                    db.collection("teams").updateOne(
                        {_id: team_id},
                        { $pull: {members: member_id}}
                    );
                    db.collection("users").updateOne(
                        { _id: member_id },
                        { $pull: {list_teams: {_id: req.body.team_id}}}
                    )
                    res.send("1 member has been removed!");
                } else {
                    res.send("Can't remove member!");
                }
            client.close();
        })
    })
})

// GET TEAM
/**Request: team_id */
router.get("/getTeam",(req,res) => {
    let id = ObjectId(req.query.team_id)
    connection((db,client) => {
        db.collection("teams").findOne({_id: id}).then(result => {
            res.json(result);
            client.close();
        })
    })
})

module.exports = router;

