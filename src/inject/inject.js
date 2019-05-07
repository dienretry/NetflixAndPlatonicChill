/*
 * DOM Elements
 */
// dom class names
const pauseButtonClassName = "touchable PlayerControls--control-element nfp-button-control default-control-button button-nfplayerPause";
const playButtonClassName = "touchable PlayerControls--control-element nfp-button-control default-control-button button-nfplayerPlay";
const currentProgressClassName = "current-progress";
const playerControlClassName = "PlayerControls--control-element progress-control"
const playerControlsHiddenClassName = "PlayerControls--control-element progress-control PlayerControls--control-element-hidden"
const scrubberBarClassName = "scrubber-container"

// dom ids
const pauseButtonClassIdentifier = "button-nfplayerPause";
const playButtonClassIdentifier = "button-nfplayerPlay";
const playControlHiddenIdentifier = "PlayerControls--control-element-hidden";

// play pause trigger origin
var isRemotelyTriggered = false;


/*
 * functions
 */
//is progress bar hidden
function isPlayerControlHidden(bar, hiddenBar){
	if(typeof hiddenBar !== "undefined")
	{
		return hiddenBar.getAttribute("class").includes(playControlHiddenIdentifier);
	} 
	else if(typeof bar !=="undefined")
	{
		return bar.getAttribute("class").includes(playControlHiddenIdentifier);
	}
	return true;
}

//get current progress
function getCurrentProgress(playerControl, playerControlHidden, currentProgressBar)
{
	return isPlayerControlHidden(playerControl, playerControlHidden) ? null : currentProgressBar.getAttribute("style");
}

function run(port, pausePlayButton, currentProgressBar, playerControl, playerControlHidden, scrubberBar){
	console.log("run")

	//look for play/pause button id
	//play/pause button is not loaded at first
	//html element is undefined until it exists on the page
	var mutationObserver = null;
	var pauseButtonCheck = setInterval(function() {
		pausePlayButton = document.getElementsByClassName(pauseButtonClassName)[0];
		currentProgressBar = document.getElementsByClassName(currentProgressClassName)[0];
		playerControl = document.getElementsByClassName(playerControlClassName)[0];
		playerControlHidden = document.getElementsByClassName(playerControlsHiddenClassName)[0];
		scrubberBar = document.getElementsByClassName(scrubberBarClassName)[0];

		if(typeof pausePlayButton !== "undefined" && typeof currentProgressBar !== "undefined" && typeof scrubberBar !== "undefined" && (typeof playerControl !== "undefined" || typeof playerControlHidden !== "undefined" )) {
			clearInterval(pauseButtonCheck);
			console.log("play/pause button exists now");
			
			//look for pause play action
			//class name of play/pause button changes when play pause action happens
			mutationObserver = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if(mutation.attributeName == "class" && 
						mutation.target.className.includes(playButtonClassIdentifier) && 
						mutation.oldValue.includes(pauseButtonClassIdentifier))
					{
						var action = {action: "control", type: "play", timestamp: getCurrentProgress(playerControl, playerControlHidden, currentProgressBar)};
						console.log(action);
						if(!isRemotelyTriggered){
							port.postMessage(action);
						}
						isRemotelyTriggered = false;
					}
					else if(mutation.attributeName == "class" && 
						mutation.target.className.includes(pauseButtonClassIdentifier) && 
						mutation.oldValue.includes(playButtonClassIdentifier))
					{
						var action = {action: "control", type: "pause", timestamp: getCurrentProgress(playerControl, playerControlHidden, currentProgressBar)};
						console.log(action);
						if(!isRemotelyTriggered){
							port.postMessage(action);
						}
						isRemotelyTriggered = false;
					}
				});
			});

			//hook up the play pause listener
			mutationObserver.observe(pausePlayButton, {
				attributes: true,
				attributeOldValue: true
			});

			mutationObserverToClean.push(mutationObserver);

			//on click on navigation bar
			scrubberBar.addEventListener("click", function(e){
				event = e
				var action = {"type": "goto", "timestamp": getCurrentProgress(playerControl, playerControlHidden, currentProgressBar)};
				console.log(action);
			});

			//TODO: remove event listener for debug 
			document.addEventListener("keypress", function(e){
				if(e.code === "KeyZ")
				{
					pausePlayButton.click()
				}
				if(e.code === "KeyX")
				{
					console.log(event)
					scrubberBar.click()
				}
			}, false);
		}
	}, 100);

	pauseButtonCheckToClean.push(pauseButtonCheck);
}


//
function cleanup(){
	console.log("cleanup")
	if(pauseButtonCheckToClean)
	{
		pauseButtonCheckToClean.forEach(function(element) {
			clearInterval(element);
		});
	}
	if(mutationObserverToClean)
	{
		mutationObserverToClean.forEach(function(element) {
			element.disconnect();
		});
	}
	
	pausePlayButton = null;
	currentProgressBar = null;
	playerControl = null;
	playerControlHidden = null;
	scrubberBar = null;
}

//
function pause(){
	var playButton = document.getElementsByClassName(playButtonClassName)[0];
	if(typeof playButton !== "undefined" && playButton && playButton.getAttribute("class").includes(playButtonClassIdentifier)){
		console.log("play")
		playButton.click();
		isRemotelyTriggered = true;
	}
	else{
		console.log("already paused")
	}
}

//
function play(){
	var pauseButton = document.getElementsByClassName(pauseButtonClassName)[0];
	if(typeof pauseButton !== "undefined" && pauseButton && pauseButton.getAttribute("class").includes(pauseButtonClassIdentifier)){
		console.log("pause")
		pauseButton.click();
		isRemotelyTriggered = true;
	}
	else{
		console.log("already playing")
	}
}

//
function createRoom(url){
	console.log("createroom")
	//is not working for now
	history.pushState({}, "Netflix And Platonic Chill", url)
}

/*
 * Content state machine
 */
//listeners
var pauseButtonCheckToClean = [];
var mutationObserverToClean = [];
//dom elements
var pausePlayButton = null;
var currentProgressBar = null;
var playerControl = null;
var playerControlHidden = null;
var scrubberBar = null;

chrome.runtime.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {
		if (msg.action == "run"){
			run(port, pausePlayButton, currentProgressBar, playerControl, playerControlHidden, scrubberBar);
			port.postMessage({status: "run-done"});
		}
		else if (msg.action == "cleanup"){
			cleanup(pausePlayButton, currentProgressBar, playerControl, playerControlHidden, scrubberBar);
			port.postMessage({status: "cleanup-done"});
		}
		else if(msg.action == "pause"){
			pause();
		}
		else if(msg.action == "play"){
			play();
		}
		else if(msg.action == "createroom"){
			cleanup(pausePlayButton, currentProgressBar, playerControl, playerControlHidden, scrubberBar);
			createRoom(msg.url);
		}
	});
});
