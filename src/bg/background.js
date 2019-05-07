chrome.webNavigation.onCompleted.addListener(background);
chrome.webNavigation.onHistoryStateUpdated.addListener(background);

var ports = [];
var sockets = [];
var generatedroomid = null;

function disconnectEverything(){
  ports.forEach(function(element) {
    element.disconnect();
  });
  sockets.forEach(function(element) {
    element.disconnect();
  });
}

function background(details) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if(tabs[0].url.startsWith("https://www.netflix.com/watch/")){
      //show popup
      chrome.pageAction.show(details.tabId);
      disconnectEverything();
      var port = chrome.tabs.connect(details.tabId);
      ports.push(port);
      var socket = io("https://ancient-river-20806.herokuapp.com/");
      sockets.push(socket);
      socket.on("connect", function () {
        port.postMessage({action: "cleanup"});
        //messages from content script
        port.onMessage.addListener(function(msg) {
          if(msg.status === "cleanup-done"){
            port.postMessage({action: "run"});
          }
          else if(msg.status === "run-done"){
            var roomid = generatedroomid ? generatedroomid : getRoomIdFromURL(tabs[0].url);
            console.log(roomid)
            if(roomid){
              socket.emit("join", {isNew: false, id: roomid});
              socket.on("action", function(socketmsg){
                console.log(socketmsg);
                if(socketmsg == "pause"){
                  port.postMessage({action: "pause"});
                }
                else if(socketmsg == "play"){
                  port.postMessage({action: "play"});
                }
              });
            }
          }

          if(msg.action === "control"){
            console.log(msg.type)
            var roomid = generatedroomid ? generatedroomid : getRoomIdFromURL(tabs[0].url);
            console.log(roomid);
            if(roomid){
              socket.emit("action", {id: roomid, value: msg.type});
            }
          }
        });

        //messages from popup
        chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
          if(message.data === "createroom"){
            socket.emit("join", {isNew: true}, function(ans){
              if(ans.done){
                generatedroomid = ans.id;
                var port = chrome.tabs.connect(details.tabId);
                var newURL = getURL(tabs[0].url)+"?roomid="+generatedroomid;
                console.log(newURL);
                chrome.runtime.sendMessage({url: newURL});
                //port.postMessage({action: "createroom", url: newURL});
              }
            });
          }
        });
      });
    }
    else{
      //hide popup
      chrome.pageAction.hide(details.tabId);
    }
  });
}

const key = "roomid"
function getRoomIdFromURL(url){
  var queryString = /^[^#?]*(\?[^#]+|)/.exec(url)[1];
  
  //escape special RegExp characters
  const formattedkey = key.replace(/[[^$.|?*+(){}\\]/g, '\\$&');
  //create Regular expression
  var regex = new RegExp("(?:[?&]|^)" + formattedkey + "=([^&#]*)");
  var results = regex.exec(queryString);
  if(results){
    return decodeURIComponent(results[1].replace(/\+/g, " ")) || '';
  }
  else{
    return null;
  }
}

function getURL(url){
  var results = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#&//=]*)/.exec(url);
  if(results){
    return results[0];
  }
  return null;
}
