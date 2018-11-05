var express = require('express');
var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;
var router = express.Router();

const connection = closure => mongoClient.connect(process.env.DATABASE, {
    useNewUrlParser: true
}, (err, client) => {
    if (err) console.log(err);
    const db = client.db('lof_workplace');
    closure(db, client);
});

// Create Room
    //request body: room:{ name, list members (id,name,avatar, co the co role),creator(id,name), team_id } 
router.post("/createRoom",(req,res) => {
    req.body.room.team_id = req.body.team_id;
    req.body.room['created_at'] = new Date().getTime();
    connection((db,client) =>{
        db.collection("rooms").insertOne(req.body.room);
        client.close();
        
        // Send response

        res.send("1 room created!");
    })
})

// Remove Room to room_trash
    // Request body: room._id
router.post("/dropRoom",(req,res)=>{
    connection((db,client) => {
        db.collection("rooms").findOne({
            _id: ObjectId(req.body.room._id)
        }).then(result =>{
            db.collection("rooms_trash").insertOne(result);
            db.collection("rooms").deleteOne(result);
            client.close();
        })
        // send response
        res.send("1 room deleted!");
    })
})

//Edit Room
    //Request body: room
router.post("/editRoom",(req,res)=>{
    req.body.room.lastUpdated_at = new Date().getTime();
    let id = ObjectId(req.body.room._id);
    delete req.body.room._id;
    connection((db,client) => { 
        db.collection("rooms").updateOne(
            { _id: id},
            {$set: req.body.room}
        );

        // send response

        res.send("1 room updated!");
        client.close();
    })})


// Add members 
    // Request body: room_id,listMembers

router.post("/addMembers",(req,res)=>{
    connection((db,client)=>{
        db.collection("rooms").updateOne(
            { _id: ObjectId(req.body.room_id) },
            { $push: { members: { $each: req.body.listMembers}}}
        )
        client.close();
        
        // Send response
        res.send(req.body.listMembers.length + "user added to room!");
    })
})
// Remove members
    // Request body: room_id, listMembers
router.post("/removeMembers",(req,res)=> {
    connection((db,client) => {
        db.collection("rooms").updateOne(
            { _id: ObjectId(req.body.room_id) },
            { $pull: { members: { $in: req.body.listMembers}}}
        )
        client.close();

        // Send response
        res.send(req.body.listMembers.length + " members has been remove from room!");
    })
})

// GET ROOM
    // request body: room_id
    router.get("/getRoom",(req,res)=>{
        let id = ObjectId(req.query.room_id);
        connection((db,client) => {
            db.collection("rooms").findOne({_id: id}).then(result =>{
                res.json(result);
                client.close();
            })
        })
    })
module.exports = router;