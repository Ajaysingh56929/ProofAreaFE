var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var onlineUserArray = [];
io.on('connection', function(socket){
	socket.on('onlineUser',function(data){
		var removeByAttr = function(arr, attr, value){
		    var i = arr.length;
		    while(i--){
		       if( arr[i] 
		           && arr[i].hasOwnProperty(attr) 
		           && (arguments.length > 2 && arr[i][attr] === value ) ){ 

		           arr.splice(i,1);

		       }
		    }
		    return arr;
		}
		var checkUserExits = onlineUserArray.filter(function(e){ return e.id == data.userId;});
		if(checkUserExits.length==0){
			onlineUserArray.push({'socketId':socket.id,id:data.userId});
		}else{
			removeByAttr(onlineUserArray,"id",data.userId);
			onlineUserArray.push({'socketId':socket.id,id:data.userId});
		}
		socket.emit('onlineUserUserList',{user:onlineUserArray});
	});
	socket.on('notifiUser',function(notifiData){
		var notifiTo = notifiData.notification.notifi_record.notifi_to.split(',');
		for(var i = 0;i<notifiTo.length;i++){
			if(notifiTo[i]!=notifiData.notification.notifi_record.updated_by){
				var notifi = new Object();
				var socketId = onlineUserArray.filter(function(e){ return e.id==notifiTo[i]; });
				io.sockets.connected[socketId[0].socketId].emit('io_socket_responseData',notifiData);
			}
		}
	});
});

http.listen(7000, function(){
  console.log('listening on *:7000');
});
    