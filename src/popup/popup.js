document.addEventListener("DOMContentLoaded", function(event){
    var wrapper = document.getElementById("wrapper");
    var createRoomButton = document.getElementById("create");
    //var arrow = document.getElementById("arrow");
    var url = document.getElementById("url");
    var text = document.getElementById("text");
    //arrow.style.display = "none";
    text.style.display = "none";
    url.style.display = "none"
    createRoomButton.addEventListener("click", function(e){
        chrome.runtime.sendMessage({data:"createroom"});
        chrome.runtime.onMessage.addListener(function(message){
            url.innerHTML = message.url;
        });
        wrapper.style.display = "none";
        createRoomButton.style.display = "none";
        //arrow.style.display = "block";
        text.style.display = "block";
        url.style.display = "block";
    });
});

