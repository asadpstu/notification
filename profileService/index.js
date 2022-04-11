const express = require("express")
const kafka = require("kafka-node")
const sequelize = require("sequelize")

var Users = [
    {
        "ID": 1,
        "Password": "12345",
        "UserName": "apsis123",
        "RoleID": 1
    },
    {
        "ID": 2,
        "Password": "12345",
        "UserName": "apsis456",
        "RoleID": 1
    },
    {
        "ID": 4,
        "Password": "12345",
        "UserName": "xyx123",
        "RoleID": 2
    },
    {
        "ID": 5,
        "Password": "12345",
        "UserName": "ceo",
        "RoleID": 4
    }
]

var Employees = [
    {
        "ID": 1,
        "UserID": 1,
        "FirstName": "Abc",
        "LastName": "Abc",
        "PhoneNumber": "+660646783078",
        "Email": "hmasad09@gmail.com",
        "ManagerID": 4
    },
    {
        "ID": 2,
        "UserID": 2,
        "FirstName": "Def",
        "LastName": "Abc",
        "PhoneNumber": "+660646783078",
        "Email": "hmasad09@gmail.com",
        "ManagerID": 5
    },
    {
        "ID": 3,
        "UserID": 3,
        "FirstName": "Geh",
        "LastName": "Abc",
        "PhoneNumber": "+660646783078",
        "Email": "hmasad09@gmail.com",
        "ManagerID": 5
    },
    {
        "ID": 4,
        "UserID": 4,
        "FirstName": "Hij",
        "LastName": "Abc",
        "PhoneNumber": "+660646783078",
        "Email": "codingtest007@gmail.com",
        "ManagerID": 5
    },
    {
        "ID": 5,
        "UserID": 5,
        "FirstName": "CEO",
        "LastName": "CTO",
        "PhoneNumber": "+660646783078",
        "Email": "hmasad09@gmail.com",
        "ManagerID": 5
    }
]

var Roles = [
    {
        "ID": 1,
        "Name": "E"
    },
    {
        "ID": 2,
        "Name": "M"
    },
    {
        "ID": 3,
        "Name": "HRM"
    },
    {
        "ID": 4,
        "Name": "CEO"
    }
]

const app = express()
app.use(express.json())
var client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS })
var producer = new kafka.Producer(client)
client.loadMetadataForTopics([process.env.KAFKA_TOPIC], (err, resp) => {
    console.log(JSON.stringify(resp))
});


const db = new sequelize(process.env.POSTGRES_URL)
const Leave = db.define('leave', {
    UserID: sequelize.INTEGER,
    ManagerId: sequelize.INTEGER,
    Reason: sequelize.STRING,
    Approve: sequelize.BOOLEAN
});
db.sync({ force: true })


producer.on('ready', () => {

    app.post('/leave/request', async (req, res) => {
        let { userId, reason } = req.body;

        /* Check User is avalable */
        let userAvailable = Users.filter(single => { if (single.ID == userId) return single })

        /* Sending Email To reporting manager */
        if (userAvailable.length == 1) {

            let managerID = Employees.filter(single => { if (single.UserID == userId) return single })[0]["ManagerID"]
            let managerEmail = Employees.filter(single => { if (single.UserID == managerID) return single })[0]["Email"]

            let payload = {
                UserID: userId,
                ManagerId: managerID,
                Reason: reason,
                Approve: false
            }

            let kafkaEvent = {
                email: managerEmail,
                requestType: "Leave",
                body: reason
            }

            producer.send([{
                topic: process.env.KAFKA_TOPIC,
                partition: 0,
                messages: JSON.stringify(kafkaEvent)
            }], async (err, data) => {
                if (err) console.log("Kafka Error : ", err)
                else {
                    await Leave.create(payload)
                    res.send(req.body)
                }
            })
        }


    })
})

producer.on('error', (error) => {
    console.log("Producer error", error)
})





app.listen(process.env.PORT, () => {
    console.log("Profile Micro service is up and running")
})
