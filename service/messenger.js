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

//SEND MESSAGE
/**
 *  request: mess: {mess,room_id,sender_id}
 */
router.post("/sendMess",(req,res)=>{
    req.body.mess['created_at'] = new Date().getTime();
    req.body.mess['status'] = "active";
    connection((db,client) => {
        db.collection("messengers").insertOne(req.body.mess);

        //Response Messenger added



        res.send("1 mess inserted!");
        client.close();
    })
})

router.post("/editMess",(req,res)=>{
    req.body.mess['editted_at'] = new Date().getTime();
    connection((db,client) => {
        db.collection("messengers").updateOne(
            {   _id: ObjectId(req.body.mess._id)   },
            { $set: {   mess: req.body.mess.mess,
                        editted: 1,
                        lastEditted_at: new Date().getTime()   }
            });
        console.log("1 mess updated!");

        // Response Messenger editted



        res.send("1 mess updated!");
        client.close();
    })
})

router.post("/dropMess",(req,res)=>{
    connection((db,client) => {
        db.collection("messengers").updateOne(
            {_id: ObjectId(req.body.mess._id)},
            { $set: { 
                status: "dropped",
                dropped_at: new Date().getTime(),
            }})
        
        // Response 
            res.send("1 mess dropped!");
            client.close();
    })
})

router.post("/getMess",(req,res)=>{
    connection( async (db,client) => {
        db.collection("messengers").find(
            { room_id: req.body.room_id }
        ).limit(req.body.limit).skip(req.body.skip).toArray((err,result)=>{
            console.log(result);
            res.json(result);
        });
        client.close();
    })
})

router.post("/findMess",(req,res) =>{
    console.log(req.body);
    connection((db,client) => {
        db.collection("messengers").find(req.body.conditions).toArray((err,result)=>{
            res.json(result);
            client.close();
        })
     })
 })


module.exports = router;
