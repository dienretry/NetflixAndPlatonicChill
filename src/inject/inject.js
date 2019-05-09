// dom class names
const pauseButtonClassName = "touchable PlayerControls--control-element nfp-button-control default-control-button button-nfplayerPause";
const playButtonClassName = "touchable PlayerControls--control-element nfp-button-control default-control-button button-nfplayerPlay";
const playerControlClassName = "PlayerControls--control-element progress-control"
const playerControlsHiddenClassName = "PlayerControls--control-element progress-control PlayerControls--control-element-hidden"
const scrubberContainerClassName = "scrubber-container"
const srubberHeadClassName = "scrubber-head"

// dom ids
const pauseButtonClassIdentifier = "button-nfplayerPause";
const playButtonClassIdentifier = "button-nfplayerPlay";
const playControlHiddenIdentifier = "PlayerControls--control-element-hidden";

function inject(method, param){
	var script = document.createElement("script");
	//stringify the function to inject
	script.innerHTML = method.toString();
	//add call to function to call it right away
	paramString = "";
	if(param){
		paramString += param.toString();
	}
	script.innerHTML += method.name+"("+paramString+");";
	console.log(method.name);

	//inject the function and call into head 
	document.head.appendChild(script);
}

function pause(){
	const videoPlayer = netflix
		.appContext
		.state
		.playerApp
		.getAPI()
		.videoPlayer;

	const playerSessionId = videoPlayer
		.getAllPlayerSessionIds()[0];

	const player = videoPlayer
		.getVideoPlayerBySessionId(playerSessionId);
	
	player.pause();
}

function play(){
	const videoPlayer = netflix
		.appContext
		.state
		.playerApp
		.getAPI()
		.videoPlayer;

	const playerSessionId = videoPlayer
		.getAllPlayerSessionIds()[0];

	const player = videoPlayer
		.getVideoPlayerBySessionId(playerSessionId);

	player.play();
}

function seek(timestamp){
	const videoPlayer = netflix
		.appContext
		.state
		.playerApp
		.getAPI()
		.videoPlayer;

	const playerSessionId = videoPlayer
		.getAllPlayerSessionIds()[0];

	const player = videoPlayer
		.getVideoPlayerBySessionId(playerSessionId);

	player.seek(timestamp);
}

function getCurrentTime(){
	const videoPlayer = netflix
		.appContext
		.state
		.playerApp
		.getAPI()
		.videoPlayer;

	const playerSessionId = videoPlayer
		.getAllPlayerSessionIds()[0];

	const player = videoPlayer
		.getVideoPlayerBySessionId(playerSessionId);

	console.log(player.getCurrentTime());
}

//is progress bar hidden
function isPlayerControlHidden(){
	const bar = document.getElementsByClassName(playerControlClassName)[0];
	const hiddenBar = document.getElementsByClassName(playerControlsHiddenClassName)[0];

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
function getCurrentProgress()
{
	//const currentProgressBar = document.getElementsByClassName(currentProgressClassName)[0];
	const scrubberHead = document.getElementsByClassName(srubberHeadClassName)[0];
	if(typeof scrubberHead !== "undefined" && !isPlayerControlHidden()){
		var results = /((\d)?:)?(\d?\d):(\d{2}) of/.exec(scrubberHead.getAttribute("aria-valuetext"));
		if(results){
			return results[2] ? 
			((parseInt(results[2])*3600)+(parseInt(results[3])*60)+parseInt(results[4]))*1000 
			: ((parseInt(results[3])*60)+parseInt(results[4]))*1000;
		}
		else{
			return null;
		}
	}
	else{
		return null;
	}
}

var isLocallyTriggered = true;
var intervalsToClean = []
var mutationObserverToClean = []
function listenToPausePlay(pauseButton, port){
	var mutationObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
	
			if(mutation.attributeName == "class" && 
				mutation.target.className.includes(playButtonClassIdentifier) && 
				mutation.oldValue.includes(pauseButtonClassIdentifier))
			{
				if(isLocallyTriggered){
					var action = {action: "control", type: "pause"};
					console.log(action);
					port.postMessage(action);
				}
				isLocallyTriggered = true;
			}
			else if(mutation.attributeName == "class" && 
				mutation.target.className.includes(pauseButtonClassIdentifier) && 
				mutation.oldValue.includes(playButtonClassIdentifier))
			{
				if(isLocallyTriggered){
					var action = {action: "control", type: "play"};
					console.log(action);
					port.postMessage(action);
				}
				isLocallyTriggered = true;
			}
		});
	});

	
	mutationObserver.observe(pauseButton, {
		attributes: true,
		attributeOldValue: true
	});

	mutationObserverToClean.push(mutationObserver);
}

function listenToPausePlayOnceLoaded(port){
	console.log("listen to pause/play")
	var pausePlayButtonCheck = setInterval(function() {
		pauseButton = document.getElementsByClassName(pauseButtonClassName)[0];
		playButton = document.getElementsByClassName(playButtonClassName)[0];
		if(typeof pauseButton !== "undefined"){
			clearInterval(pausePlayButtonCheck);
			listenToPausePlay(pauseButton, port);
		}
		else if(typeof playButton !== "undefined"){
			clearInterval(pausePlayButtonCheck);
			listenToPausePlay(playButton, port);
		}
	}, 100);
	intervalsToClean.push(pausePlayButtonCheck);
}

function cleanup(){
	console.log("cleanup")
	if(intervalsToClean)
	{
		intervalsToClean.forEach(function(element) {
			clearInterval(element);
		});
	}
	if(mutationObserverToClean)
	{
		mutationObserverToClean.forEach(function(element) {
			element.disconnect();
		});
	}
}

chrome.runtime.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {
		if (msg.action == "pause"){
			inject(pause);
			isLocallyTriggered = false;
		}
		else if (msg.action == "play"){
			inject(play);
			isLocallyTriggered = false;
		}
		else if (msg.action == "seek"){
			inject(seek, msg.timestamp);//timestamp in ms
		}
		//not used
		else if (msg.action == "timestamp"){
			console.log(getCurrentProgress());//timestamp in ms
			inject(getCurrentTime)//for debug
		}
		else if (msg.action == "listen"){
			listenToPausePlayOnceLoaded(port);//attach play/pause listener
			listenToSeekOnceLoaded();//attach seek listener
			port.postMessage({status: "listen-done"});
		}
		else if (msg.action == "cleanup"){
			cleanup();//clean intervals and mutation observers
			//cleanSeekListener();
			port.postMessage({status: "cleanup-done"});
		}
	});

	function sendSeekTimestamp(){
		var action = {action: "control", "type": {type: "seek", timestamp: getCurrentProgress()}};
		console.log(action);
		port.postMessage(action);
	}

	function listenToSeekOnceLoaded(){
		console.log("listen to seek")
		var seekBarCheck = setInterval(function() {
			var scrubberContainer = document.getElementsByClassName(scrubberContainerClassName)[0];
			if(typeof scrubberContainer !== "undefined"){
				clearInterval(scrubberContainer);
				scrubberContainer.addEventListener("click", sendSeekTimestamp);
			}
		}, 100);
		intervalsToClean.push(seekBarCheck);
	}
	
	//not cleaned because the bar is hidden most of the time
	/*function cleanSeekListener(){
		var scrubberContainer = document.getElementsByClassName(scrubberContainerClassName)[0];
		console.log(scrubberContainer)
		if(typeof scrubberContainer !== "undefined"){
			scrubberContainer.removeEventListener("click", sendSeekTimestamp); 
		}
	}*/
});

