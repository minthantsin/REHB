'use strict';

require('dotenv').config({path: '../.env'});
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const UserModel = require('../middleware/models/user/user-model.js');
const user = new UserModel();
const ResourceModel = require('../middleware/models/resource/resource-model.js');
const resource = new ResourceModel();
var cron = require('node-cron');

let task = cron.schedule('30 8 */1 * *', () => {//sends the message out at 8:30am server time every day
  sendDailyMessage();
});
task.start();

async function sendDailyMessage() {
  let allUsers = await user.get()
  allUsers = allUsers.results;
  allUsers.forEach(async current => {
    let action = await resource.getRandom();
    while (current.completed.includes(action._id)) {
      action = await resource.getRandom();
    }
    await user.complete(current.phoneNumber, action._id);
    client.messages
    .create({
      body: `Here is your daily action: ${action.url}. Text back DONE when you\'ve completed it.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: current.phoneNumber
    })
   .then(message => console.log(message.sid));
  })
}


module.exports = sendDailyMessage;
