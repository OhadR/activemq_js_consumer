//var intervalObj = setInterval(callBackendGetJobProgress, (1 * 1000));
var intervalObj;

var counter = 0;
var destination = 'queue://JCG_QUEUE';
var handlerId = '543212345a';

var myHandlerXXX =
{
	rcvMessage: function(message)
	{
		alert("received "+message.textContent);
	}
};



$(document).ready(function() {
	
	amq.addListener(handlerId, destination, myHandlerXXX.rcvMessage);

	$("#submit").click(function(){
		
		intervalObj = setInterval(callBackend, (5 * 1000));
	});
});

function callBackend()
{
	console.log('sending message to ' + destination);
	amq.sendMessage(destination,"myMessage");
}

function getServerAddress()
{
	var serverAddress;
	var isSecured = $('#server_secured').is(":checked");		//is https (o/w http)
	if(isSecured)
		serverAddress = "https://";
	else
		serverAddress = "http://";
	
	var serverName = $('#server_name').val();
	var serverPort = $('#server_port').val();
	serverAddress += serverName;
//	if(!serverPort)		//checks null, undefuned and empty string (tnx @Slava!)
	serverAddress += ':' + serverPort;		//if 'port' is empty it does not harm (http://host:/rest.. is OK
	return serverAddress;
}

function callBackendGetJobProgress()
{
	var requestData = {
		numSamples: 30
	};
	
	var serverAddress = getServerAddress();
	
	$.ajax({
		url: serverAddress + "/rest-api/status/getProgress",
		data: requestData,
		type: 'GET',
		dataType: 'text',
		contentType: 'application/json',
		success: function(response, textStatus, jqXHR){
			var marsStats = JSON.parse(response);
//			drawChart( marsStats );
			counter = 0;
		},
		error: function(jqXHR, textStatus, errorThrown){
			++counter;
			if(counter % 15 == 0)
				alert('error attempting to reach ' + serverAddress + ', counter=' + counter);
		}
	});
}


function stopInterval()
{
	window.clearInterval( intervalObj );
//	amq.removeHandler(handlerId)
}

