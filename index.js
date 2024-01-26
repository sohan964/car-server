const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
//.env
require('dotenv').config();

//middle wares
app.use(cors());
app.use(express.json());

app.get('/',(req, res)=>{
    res.send('genius car server');
});
//console.log(process.env.DB_USER) this is for user
//console.log(process.env.DB_PASSWORD) this is for password


//const uri = "mongodb://localhost:27017";
const uri = "mongodb+srv://userDB2:APF2jqL5HcrcM2JF@cluster0.8v7eukl.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function verifyJWT(req,res, next ){
  //console.log(req.headers.authorization);
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'unauthorized access'})
  }
  //
  const token = authHeader.split(' ')[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      res.status(403).send({message: 'unauthorized access'});
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try{
    const servicesCollection = client.db('geniusCar').collection('services');
    const orderCollection = client.db('geniusCar').collection('orders');
    
    //for jwt
    app.post('/jwt', (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
      res.send({token});
    })

    //get all server from database by find() for services
    app.get('/services', async(req, res)=>{
        const query = {};
        const cursor = servicesCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
    })

    //get a Data from mongodb by findOne() for services
    app.get('/services/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const service = await servicesCollection.findOne(query);
        res.send(service);
    })

    //orders API for placing order
    app.get('/orders',verifyJWT, async(req, res) =>{
        const decoded = req.decoded;
        console.log('in orders api',decoded)
        let query ={};

        if(decoded.email != req.query.email){
          res.status(403).send({message: 'unauthorized access'})
        }

        if(req.query.email){
            query ={
                email: req.query.email
            }
        }
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
    })
    app.post('/orders',  async(req, res)=>{
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);

    })

    //update order
    app.patch('/orders/:id',async(req,res)=>{
      const id = req.params.id;
      const status =req.body.status;
      const filter = {_id: new ObjectId(id) }
      const updateDoc ={
        $set:{
          status: status
        }
      }
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //delete orders
    app.delete('/orders/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    })
  }
  finally{

  }
}
run().catch(console.dir);



app.listen(port,()=>{
    console.log(`server is running on Port:${port}`);
})