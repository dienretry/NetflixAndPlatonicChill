document.addEventListener("DOMContentLoaded", function(event){
    var wrapper = document.getElementById("wrapper");
    var createRoomButton = document.getElementById("create");
    var url = document.getElementById("url");
    var label = document.getElementById("label");
    var copyButton = document.getElementById("copy-button");
    label.style.display = "none";
    url.style.display = "none";
    copyButton.style.display = "none";
    createRoomButton.addEventListener("click", function(e){
        chrome.runtime.sendMessage({data:"createroom"});
        chrome.runtime.onMessage.addListener(function(message){
            url.value = message.url;
        });
        wrapper.style.display = "none";
        createRoomButton.style.display = "none";
        label.style.display = "block";
        url.style.display = "block";
        copyButton.style.display = "block";
    });
    copyButton.addEventListener("click", function(e){
        //find target element
        var t = e.target;
        var c = t.dataset.copytarget;
        var inp = (c ? document.querySelector(c) : null);
    
        //is element selectable
        if (inp && inp.select) {
            //select text
            inp.select();
            try {
                //copy text
                document.execCommand('copy');
                inp.blur();
    
                //copied animation
                t.classList.add('copied');
                setTimeout(function() {
                    t.classList.remove('copied');
                }, 1500);
            }
            catch (err) {
                alert('please press Ctrl/Cmd+C to copy');
            }
    
        }
    })
});
