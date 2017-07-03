'use strict'

const token = process.env.FB_VERIFY_ACCESS_TOKEN
const vtoken = process.env.FB_VERIFY_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const random = require("random-js")()
const Feed = require('rss-to-json')

const app = express()

const jokes = require('./data/jokes')
const facts = require('./data/facts')
const cmd = require('./data/commands')
const rep = require('./data/replies')
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
            let command_exists = false;
            let func = 10000;
            console.log("MESSAGE: " + text);

            for(var k = 0 ; k < cmd.length ; k++)   {
                for(var j = 0 ; j < cmd[k].length ; j++)    {
                    if(text == cmd[k][j])   {
                        command_exists = true;
                        func = k;
                        break;    
                    }                   
                }
            }

            if(command_exists)  {
                switch(func) {
                    case 0: // Greet
                        greet(sender);
                        break;
                    case 1: // Coin Flip
                        flip(sender);
                        break;
                    case 2: // Jokes
                        tellajoke(sender);
                        break;
                    case 3: // Facts
                        tellafact(sender);
                        break;
                    case 4: // News
                        tellnews(sender);
                        break;
                    case 5:
                        kunews(sender);
                        break;
                    case 6:
                        inform_user(sender);
                        break;
                    case 7: // Swear words
                        dontswear(sender);
                        break;
                    case 8:
                        var aditya =   {
                            title: "Aditya Thebe",
                            subtitle: "Coolest Gentleman on earth",
                            img_url: "http://i.imgur.com/AI4znI6.jpg",
                            url: "http://adityathebe.com",
                            btn_title: "Check out his blog"
                        }
                        sendGenericMessage(sender, aditya);
                        break;
                    case 9:
                        saygoodbye(sender);
                        break;
                    case 10:
                        sendTextMessage(sender, "Limbu - Bot Limbu");
                        break;
                    case 11:    // Compliments
                        reply_compliments(sender);
                        break;
                    case 12:
                        ku_result(sender);
                        break;
                    default:
                        sendTextMessage(sender,"Figuring it out!");
                }
            }
            else {
                if (text_temp.search("election") >= 0) {
                    let address = (text_temp.replace('election', ""));
                    // Only allow alphabets and remove front and back white spaces
                    address = (address.replace(/[^a-zA-Z ]/g, "").trim());

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
                    var cmd_err = ["I'm not sure I understand. Try\n\n- \"help\" command",
                                    "Oops, I didn't catch that. For things I can help you with, type \“help.\” ",
                                    "Sorry, I didn't get that. Try something like: \"KU news\", or type \"help\""]

                    var ran_num = random.integer(0,cmd_err.length);
                    sendTextMessage(sender, cmd_err[ran_num]);
                }
            }
        }
        if (event.postback) {
            let text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback: " + text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})

function greet(txt) {
    var ran_num = random.integer(0,rep[0].length);
    var greet_temp = rep[0][ran_num];
    sendTextMessage(txt, greet_temp);
}

function flip(txt)  {
    var die = random.integer(1, 2); ;
    if (die == 1)    {
        sendTextMessage(txt, "Heads!")// + text.substring(0, 200))
        sendImage(txt,"https://assets.catawiki.nl/assets/2012/9/16/0/d/0/0d0a8250-e226-012f-92e0-005056960006.jpg");
    } else {
        sendTextMessage(txt, "Tails!");
        sendImage(txt,"http://assets.catawiki.nl/assets/2012/9/16/0/c/5/0c5dc5d0-e226-012f-92e0-005056960006.jpg");
    }
}

function tellajoke(txt) {
    var ran_num = random.integer(0,jokes.data.length);
    var joke_temp = jokes.data[ran_num];
    sendTextMessage(txt, joke_temp);
}

function tellafact(txt) {
    var ran_num = random.integer(0,facts.data.length);
    var joke_temp = facts.data[ran_num];
    sendTextMessage(txt, joke_temp);
}

function tellnews(txt)    {
    var url = "https://newsapi.org/v1/articles?source=techcrunch&sortBy=latest&apiKey=232517f181ac4dc58988c20fa52205a0";
    request({url: url, json: true}, function (error, response, body) {
        if(!error)  {
            var ran_num = random.integer(0,body.articles.length);
            var news_obj = {
                title: body.articles[ran_num].title,
                subtitle: body.articles[ran_num].description,
                img_url: body.articles[ran_num].urlToImage,
                url: body.articles[ran_num].url,
                btn_title: "Read More"
            }
            sendGenericMessage(txt,news_obj);
        }
        else {
            sendTextMessage(txt, "The website's down.\nPlease try again later");  
        }
    })
}

function kunews(txt)    {
    var url = "https://ku-gex.herokuapp.com/";
    sendTextMessage(txt,"Please wait...");
    request({url: url, json: true}, function (error, response, body) {
        if(!error)  {
            var ku_obj = body;
            genericku(txt, ku_obj);
        }
        else {
            sendTextMessage(txt, "The website's down.\nPlease try again later");  
        }
    })
}

function inform_user(txt)   {
    var inform_msg = "Hi, I am BotLimbu, a Utility bot! You can ask for things like:\n\n• election mechi\n• KU result\n• Latest KU news\n• Jokes\n• Flip a coin\n• Facts\n• Latest News\n\nAnd if you ever need help, just type HELP.\n\nI'm always learning, so do come back and say hi from time to time 🙂";
    sendTextMessage(txt,inform_msg);
}

function dontswear(txt) {
    var ran_num = random.integer(0,rep[2].length);
    var swear_temp = rep[2][ran_num];
    sendTextMessage(txt, swear_temp);
}

function saygoodbye(txt)    {
    var ran_num = random.integer(0,rep[3].length);
    var bye_temp = rep[3][ran_num];
    sendTextMessage(txt, bye_temp);
}

function reply_compliments(txt) {
    var ran_num = random.integer(0,rep[4].length);
    var reply_temp = rep[4][ran_num];
    sendTextMessage(txt, reply_temp);
}

function ku_result(txt) {
    sendTextMessage(txt, "Please wait ...");
    Feed.load('http://www.ku.edu.np/exam/?feed=rss2', function(err, rss){
    var nabujhne = rss.items[0].created;
    var date = new Date(nabujhne);
    console.log((date.toString("MMM dd")).replace('GMT+0545 (Nepal Standard Time)',''));
        var result_obj = {
            title: rss.items[0].title,
            subtitle: "Published on: " + (date.toString("MMM dd")).substring(0,15),
            url: rss.items[0].link,
            img_url: "https://cdn4.iconfinder.com/data/icons/flat-education-icons/500/statistics-512.png",
            btn_title: "See Here",
        }
        sendGenericMessage(txt,result_obj);
    });
}

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

function sendImage(sender, img) {    
    let messageData = { 
        "attachment": {
            "type":"image",
            "payload":{
                "url":img,
            }
        }
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

function sendGenericMessage(sender, data) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": data.title,
                    "subtitle": data.subtitle,
                    "image_url": data.img_url,
                    "buttons": [{
                        "type": "web_url",
                        "url": data.url,
                        "title": data.btn_title
                    }],
                }]
            }
        }
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

function genericku(sender, data) {
    sendTextMessage(sender, "Here are latest news from Kathmandu University");
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": data[0].title,
                    "subtitle": "Published on: " + data[0].date,
                    "image_url": data[0].img_src,
                    "buttons": [{
                        "type": "web_url",
                        "url": data[0].permalink,
                        "title": "Read More"
                    }],
                    },{
                    "title": data[1].title,
                    "subtitle": "Published on: " + data[1].date,
                    "image_url": data[1].img_src,
                    "buttons": [{
                        "type": "web_url",
                        "url": data[1].permalink,
                        "title": "Read More"
                    }],
                },{
                    "title": data[2].title,
                    "subtitle": "Published on: " + data[2].date,
                    "image_url": data[2].img_src,
                    "buttons": [{
                        "type": "web_url",
                        "url": data[2].permalink,
                        "title": "Read More"
                    }],
                }]
            }
        }
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

function sendButton(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "button",
                "text":"What do you want to do next?",
                "buttons": [{
                        "type": "postback",
                        "title": "Flip A COIN",
                        "payload": flip(sender),
                }]
            }
        }
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