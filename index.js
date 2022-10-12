const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();




app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4o6ymh3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log(uri);
console.log('db connect');


async function run() {
    try {
        await client.connect()
        const girlsDressCollection = client.db('fasionHolesales').collection('girlsDress');

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