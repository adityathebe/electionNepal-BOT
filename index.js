'use strict'

const token = process.env.FB_VERIFY_ACCESS_TOKEN
const vtoken = process.env.FB_VERIFY_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const Feed = require('rss-to-json')

const app = express()

const electionData = require('./data/election')

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === vtoken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('No Access')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++)   {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text_temp = (event.message.text).toLowerCase();
            let text = (text_temp.replace(/[^a-zA-Z ]/g, "").trim());
            console.log("MESSAGE: " + text);

            if (text.search("election") >= 0) {
                let address = text.replace('election', "").trim();
                /* == Check if the address is empty == */
                if(address == "") {
                    var temp = "Please add the district or municipality name after election\n\n\
                                Example: election panchthar, election mechi"
                    sendTextMessage(sender, temp);
                } else {
                    var isDistrict = false
                    var municipalityName;
                    var count = 0;
                    var duplicate_ids = []
                    
                    /* == Check if the address is a district and count the number of address == */
                    for (var x = 0; x < electionData.length; x++) {
                        for (var j = 0; j < electionData[x].districts.length; j++) {
                            var location = electionData[x].districts[j].name;
                            if(address == location.toLowerCase()) {
                                isDistrict = true;
                                municipalityName = electionData[x].districts[j].Municipalities;
                            }

                            // Additional Loop to check if there are two places with the same name!
                            for (var k = 0; k < electionData[x].districts[j].Municipalities.length; k++) {
                                var muni  = electionData[x].districts[j].Municipalities[k];
                                if(muni.english_name.toLowerCase() == address){
                                    count++;
                                    duplicate_ids.push(muni.id);
                                }
                            }
                        }
                    }

                    if(!isDistrict) {
                        if(count == 1) {
                            electionStat(sender, address, 1);                                
                        } else {
                            var tempMsg = "There are " + count + " places with that name!";
                            sendTextMessage(sender, tempMsg);
                            duplicate_ids.forEach((place)=> {
                                electionStat(sender, place, 0);
                            })
                        }
                    } else {
                        var tempData = "Choose your Municipality\n\n";
                        for (var j = 0; j < municipalityName.length; j++) {
                            tempData += j+1 + ". " + municipalityName[j].english_name + '\n';
                        }
                        tempData += "\n\nExample: election " + municipalityName[0].english_name;
                        sendTextMessage(sender, tempData);
                    }
                }
            } else {
                sendTextMessage(sender, "Sorry, I didn't get that. ");
            }
        }
    }
    res.sendStatus(200)
});
/* identifier : 
        1 = Search by locationName and 
        0 = Search by locationID
*/
function electionStat(txt, place, identifier)    {
    var url;
    if(identifier == 1)
        url = "https://electionnepal.herokuapp.com/location/" + place;
    else
        url  = "https://electionnepal.herokuapp.com/id/" + place;

    request({url: url, json: true}, function (error, response, body) {
        if(!error)  {
            var candidates = body.names;
            var tempData = "";
            var vote_counts = body.votes;
            for (var i = 0; i < candidates.length; i++) {
                tempData+= candidates[i] + ' - ' + vote_counts[i] + '\n';
            }
            sendTextMessage(txt, tempData);
        }
        else {
            sendTextMessage(txt, "Server's down.\nPlease try again later");  
        }
    })
}

function sendTextMessage(sender, text) {
    let messageData = { 
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}