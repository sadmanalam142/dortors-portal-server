const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9syea.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("doctors_portal").collection("services");
        const bookingCollection = client.db("doctors_portal").collection("bookings");

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/booking', async (req, res)=> {
            const patient = req.query.patient;
            const query = {patient: patient};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;
            const services = await serviceCollection.find().toArray();
            const query = {date: date};
            const bookings = await bookingCollection.find(query).toArray();
            services.forEach(service => {
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                const bookedSlots = serviceBookings.map(book => book.slot);
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                service.slots = available;
            });
            res.send(services)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient};
            const exist = await bookingCollection.findOne(query);
            if(exist){
               return res.send({success: false, booking: exist})
            }
            const result = await bookingCollection.insertOne(booking);
            res.send({success: true, result})
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from doctor uncle')
})

app.listen(port, () => {
    console.log('Successfully listening', port);
})