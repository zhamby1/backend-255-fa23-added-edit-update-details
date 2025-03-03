const express = require("express");
const Song = require("./models/song");
var cors = require('cors')
const jwt = require('jwt-simple');
const app = express();
const User = require("./models/users");
const bcrypt = require("bcryptjs")


app.use(cors())

// Middleware that parses HTTP requests with JSON body
app.use(express.json());

const router = express.Router();
//create a secret word that the server will use to encode and decode the token
const secret = "supersecret"

//we can create a way to add a new person to a database
//post
router.post("/user", async(req,res) =>{
   if(!req.body.username || !req.body.password){
      res.status(400).json({error: "Missing username or passwword"})
   }

   //create a hash to encrypt the password
   const hash = bcrypt.hashSync(req.body.password, 10)
   const newUser = await new User({
      username: req.body.username,
      password: hash,
      status: req.body.status
   })
   try{
      await newUser.save()
      res.sendStatus(201) //created
   }
   catch(err){
      res.status(400).send
   }
})

//authenticate a user to sign in
router.post("/auth", async(req,res) =>{
   if(!req.body.username || !req.body.password){
      res.status(401).json({error: "Missing username or password"})
      return
   }
   //find the user in the database
   try{
      const user = await User.findOne({username: req.body.username})
      if (!user){
         res.status(401).json({error: "User not found"})
     
      }
      else{
         //check the username and password to see if they match
        if(bcrypt.compareSync(req.body.password,user.password)){
            //create a token
            const token = jwt.encode({username: user.username}, secret)
            res.json({token: token, username: user.username, userID: user._id})
         }
         else{
            res.status(401).json({error: "Invalid password"})
         }
      }
   }
   catch(err){
      res.status(400).send(err.message)
   }

      
   })



// Get list of all songs in the database
router.get("/songs", async(req,res) =>{
   try{
      const songs = await Song.find({})
      res.send(songs)
      console.log(songs)
   }
   catch (err){
      console.log(err)
   }

})

//Grab a single song in the database
router.get("/songs/:id", async (req,res) =>{
   try{
      const song = await Song.findById(req.params.id)
      res.json(song)
   }
   catch (err){
      res.status(400).send(err)
   }
})

//added a song to the database
router.post("/songs", async(req,res) =>{
   try{
      const song = await new Song(req.body)
      await song.save()
      res.status(201).json(song)
      console.log(song)
   }
   catch(err){
      res.status(400).send(err)

   }
      
   
})

//update is to update an existing record/resource/database entry..it uses a put request
router.put("/songs/:id", async(req,res) =>{
   //first we need to find and update the song the front end wants us to update.
   //to do this we need to request the id of the song from request
   //and the find it in the database and update it
   try{
      const song = req.body
      await Song.updateOne({_id: req.params.id},song)
      console.log(song)
      res.sendStatus(204)


   }
   catch(err){
      res.status(400).send(err)
   }
})

router.delete("/songs/:id", async(req,res) =>{
   try{
      const song = await Song.findById(req.params.id)
      console.log(song)
      await Song.deleteOne({_id: song._id})
      res.sendStatus(204) //deleted status code
   }
   catch(err){
      res.status(400).send(err)
   }
})

router.put("/playlist", async(req,res) =>{
   try{
      const user = await User.findById(req.body.userID)
      await user.updateOne({$push: {playlist: req.body.songID}})
      console.log(user)
      
      
      res.sendStatus(204)
   }
   catch(err){
      res.status(400).send(err)
   }
})

app.use("/api", router);

app.listen(process.env.PORT || 3000);