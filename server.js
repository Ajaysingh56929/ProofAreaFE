var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
	socket.on('receiveData',function(data){

		console.log(data);

	});


});

http.listen(7000, function(){
  console.log('listening on *:7000');
});
    