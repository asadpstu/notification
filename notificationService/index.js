const express = require("express")
const kafka = require("kafka-node")
const app = express()
const { sendMail } = require("./external/email")
app.use(express.json())


var client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS })
var consumer = new kafka.Consumer(client, [{ topic: process.env.KAFKA_TOPIC }], {
    autoCommit: false
})

consumer.on('message', async (message) => {
    try {
        let data = JSON.parse(message.value)
        let sendTo = data.email;
        let requestType = data.requestType;
        let body = data.body;
        switch (requestType) {
            case 'Leave':
                sendMail(sendTo, requestType, body)
                break;
            case 'Approve':
                //Call script for approval of leave
                break;
            case 'Profile':
                //Call Profile script update
                break;
            default:
            //Call default script        

        }

    }
    catch (error) {
        console.log("No Processable Data.")
    }
})
consumer.on('error', (error) => {
    console.log("Consumer error", error)
})


app.listen(process.env.PORT, () => {
    console.log("Notification Micro service is up and running")
})
