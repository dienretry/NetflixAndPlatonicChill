document.addEventListener("DOMContentLoaded", function(event){
    var createRoomButton = document.getElementById("create");
    var arrow = document.getElementById("arrow");
    var text = document.getElementById("text");
    arrow.style.display = "none";
    text.style.display = "none";
    createRoomButton.addEventListener("click", function(e){
        chrome.runtime.sendMessage({data:"createroom"});
        createRoomButton.style.display = "none";
        arrow.style.display = "block";
        text.style.display = "block";
    });
});

