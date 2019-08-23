const uuid = require('uuid').v4
const _ = require('lodash')
const { DOMAIN } = require('../config')
const mysql = require('mysql');
const express = require('express');

var app = express();

var today = new Date();
var temp = ""
var year = ""
var history = ""  
var text = ""

let client = mysql.createConnection({
  user: "root",
  password:"Today1357!",
  database: "today_db"
});

client.connect(function(err){
  if(!err){
      console.log("Db connection successed");
  }else{
      console.log("Db connection failed");
  }
});

function answerHistory(month, date, type){
    let m = month
    let d = date
    let t = type

    getQuery(m,d,t,function(query){
      setText(query);
    });
    
    console.log("Text="+text);

    temp = text.split('년');
    year = temp[0];
    history = temp[1];

    return {year, m, d, history};
}

function setText(query){
  text = query;
}

function getQuery(month, date, type, callback){
  if (type != ''){
    client.query('select his_text from history where month='+month+' and date='+date+' and type=\''+type+'\';', function(err,rows){
      if(err){
        console.log(err);
        callback(err,null);
      } else {
        // text = rows.his_text;
        callback(null, rows.his_text);
        return rows.his_text;
      }
    });
  } else {
    client.query('select his_text from history where month='+month+' and date='+date+';', function(err,rows){
      if(err){
        console.log(err);
      } else {
        var i = Math.floor(Math.random()*2);
        // text = rows[i].his_text;
        callback(rows[i].his_text);
        return rows[i].his_text;
      }
    });
  }
}

class NPKRequest {
  constructor (httpReq) {
    this.context = httpReq.body.context
    this.action = httpReq.body.action
    console.log(`NPKRequest: ${JSON.stringify(this.context)}, ${JSON.stringify(this.action)}`)
  };
  
  do(npkResponse) {
    this.actionRequest(npkResponse)
  }

  actionRequest(npkResponse) {
    console.log('actionRequest')
    console.dir(this.action)


    const actionName = this.action.actionName
    const parameters = this.action.parameters

    switch (actionName) {
      case 'answer.history':
        let type = ''
        let month = 8
        let date = 15

        if (!!parameters){
          const daySlot = parameters.day
          const typeSlot = parameters.type
          const monthSlot = parameters.month
          const dateSlot = parameters.date
          
          if(parameters.length != 0 && daySlot && !monthSlot && !dateSlot) {
            switch (daySlot.value){
              case 'TODAY':
                month = today.getMonth()+1;
                date = today.getDate();
                break;
              case 'YESTERDAY':
                var yesterday = today.getTime() - (1 * 24 * 60 * 60 * 1000);
                today.setTime(yesterday);
                month = today.getMonth()+1;
                date = today.getDate();
                today.setTime(yesterday + (1 * 24 * 60 * 60 * 1000));
                break;
              case 'TOMORROW':
                var tomorrow = today.getTime() + (1 * 24 * 60 * 60 * 1000);
                today.setTime(tomorrow);
                month = today.getMonth()+1;
                date = today.getDate();
                today.setTime(tomorrow - (1 * 24 * 60 * 60 * 1000));
                break;
            }
          }

          if(parameters.length != 0 && monthSlot && dateSlot && !daySlot){
            date = parseInt(dateSlot.value);
            month = parseInt(monthSlot.value);
          }

          if(parameters.length != 0 && typeSlot){
            switch (typeSlot.value){
              case '한국사': case '한국역사': case '우리나라역사':
                type = 'k';
                break;
              case '세계사': case '외국역사': case '세계역사':
                type = 'w';
                break;
            }
          }
        } 

        const throwResult = answerHistory(month, date, type);
        npkResponse.setOutputParameters(throwResult);
        break;
    }
  }
}

// NPKResponse 클래스 정의
class NPKResponse {
  constructor () {
    console.log('NPKResponse constructor')

    this.version = '2.0'
    this.resultCode = 'OK'
    this.output = {}
    this.directives = []
  }

  setOutputParameters(throwResult) {
    this.output = {
        year: throwResult.year,
        m: throwResult.m,
        d: throwResult.d,
        history: throwResult.history
    }
  }
}

// nuguReq 함수 정의
const nuguReq = function (httpReq, httpRes, next) {
  npkResponse = new NPKResponse()
  npkRequest = new NPKRequest(httpReq)
  npkRequest.do(npkResponse)
  console.log(`NPKResponse: ${JSON.stringify(npkResponse)}`)

  return httpRes.send(npkResponse)
};

module.exports = nuguReq;