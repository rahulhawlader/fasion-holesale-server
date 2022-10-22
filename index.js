const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4o6ymh3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });





function verifyJWT(req, res, next) {
    // console.log('abc');
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}




async function run() {
    try {
        await client.connect()
        const girlsDressCollection = client.db('fasionHolesales').collection('girlsDress');
        const orderDressCollection = client.db('fasionHolesales').collection('orderDress');
        const paymentDressCollection = client.db('fasionHolesales').collection('payments');
        const userCollection = client.db('fasionHolesales').collection('users');
        const reviewCollection = client.db('fasionHolesales').collection('reviews');
        const employeeCollection = client.db('fasionHolesales').collection('employees');






        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }



        ////////////////////////////////////////////////////////////////////////////////////////////      
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        });

        // app.get('/user',  async (req, res) => {
        //     const users = await userCollection.find().toArray();
        //     res.send(users)
        //   })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })





        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;


            const filter = { email: email };


            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);

            res.send(result)


        })







        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
            res.send({ result, token })


        });

        /////////////////////////////////////////////////////////////////////////////////////////////// 
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


        app.post('/girlsdress', async (req, res) => {
            const newGirlsdress = req.body;
            const result = await girlsDressCollection.insertOne(newGirlsdress);
            res.send(result)
        })


        app.delete('/girlsdress/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const dress = await girlsDressCollection.deleteOne(query);
            res.send(dress)
        })
        // app.delete('/product/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await productCollection.deleteOne(query);
        //     res.send(result)
        // })




        // ///////////////////////////////////////////////////////////////////////////////
        app.get('/employee', verifyJWT, verifyAdmin, async (req, res) => {
            const employees = await employeeCollection.find().toArray();
            res.send(employees);
        })


        app.post('/employee', verifyJWT, verifyAdmin, async (req, res) => {
            const employee = req.body;
            const result = await employeeCollection.insertOne(employee);
            res.send(result);
        });

        app.delete('/employee/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await employeeCollection.deleteOne(filter);
            res.send(result);
        })


        //////////////////////////////////////////////////////////////order/////////////////////////


        // app.get('/order/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const orders = await orderDressCollection.findOne(query);
        //     res.send(orders);
        // })





        app.get('/order', verifyJWT, async (req, res) => {
            const query = {};
            const cursor = orderDressCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })



        app.get('/myorder', verifyJWT, async (req, res) => {

            const email = req.query.email;

            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const order = await orderDressCollection.find(query).toArray();
                return res.send(order)
            }


            else {
                return res.status(403).send({ message: 'forbidden access' })
            }
        })


        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderDressCollection.insertOne(order);
            res.send(result);
        })


        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderDressCollection.deleteOne(query);
            res.send(order)
        })


        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderDressCollection.findOne(query)
            res.send(order)
        })
        ///////////////////////////////////////////////////////////////////////////////////
        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }

            }

            const result = await paymentDressCollection.insertOne(payment)
            const updatedOrder = await orderDressCollection.updateOne(filter, updatedDoc)
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

        ////////////////////////////////////////// reviews/////////////////////////////////////////////////
        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);


        })



        app.post('/review', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result)
        })

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