const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, ObjectID} = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4o6ymh3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect()
        const girlsDressCollection = client.db('fasionHolesales').collection('girlsDress');
        const orderDressCollection = client.db('fasionHolesales').collection('orderDress');
        const paymentDressCollection = client.db('fasionHolesales').collection('payments');

        app.get('/girlsdress', async (req, res) => {
            const query = {};
            const cursor = girlsDressCollection.find(query);
            const dresses = await cursor.toArray();
            res.send(dresses)
        })

        app.get('/girlsdress/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const dress = await girlsDressCollection.findOne(query);
            res.send(dress);
        })
        //////////////////////////////////////////////////////////////order/////////////////////////


        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderDressCollection.insertOne(order);
            res.send(result);
        })
        



        app.get('/order', async (req, res) => {

            const email = req.query.email;
            const query = { email: email };
            const order = await orderDressCollection.find(query).toArray();
            res.send(order)
        })

        // app.get('/booking/:id', async (req, res) => {

        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const booking = await bookingCollection.findOne(query);
        //     res.send(booking)
        //   })
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderDressCollection.deleteOne(query);
            res.send(order)
        })


        app.get('/order/:id', async(req,res)=>{
            const id=req.params.id;
            const query={_id: ObjectId(id)};
            const order=await orderDressCollection.findOne(query)
            res.send(order)
        })

         app.patch('/order/:id', async(req, res)=>{
             const id=req.params.id;
             const payment=req.body;
             const filter={_id: ObjectId(id)};
             const updatedDoc={
                 $set:{
                     paid:true,
                     transactionId:payment.transactionId
                 }

             }

             const result= await paymentDressCollection.insertOne (payment)
             const updatedOrder= await orderDressCollection.updateOne(filter, updatedDoc ) 
             res.send(updatedDoc)
         })

        // payment system
        app.post("/create-payment-intent", async (req, res) => {
            const order = req.body;
            const totalAmount = order.totalAmount;
            const amount = totalAmount * 100;
            console.log(amount);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({ clientSecret: paymentIntent.client_secret });

        });





    }

    finally {

    }
}




run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('running Server')
})

app.listen(port, () => {
    console.log('listening to port', port);
})