	var myproofyapp = angular.module('myproofyapp', ['ngRoute']);
	myproofyapp.appUrl = "http://192.168.1.27/myappapi/index.php/";
	var drawCount = 0,radius = 10,strokeWidth = 4;
    var stokeColor = '#000000';//$('div.dropdown-menu').find('.selected').attr('data-color')
    var canvasEventRegister = false;
    var currentShape;
    var rects=[],rectangleArray = [],lineArray = [],MainLineArray = [];
	// create the controller and inject Angular's $scope

	// configure our routes
	myproofyapp.config(function($routeProvider) {
	    $routeProvider
	        // route for the home page
	        .when('/', {
	            templateUrl : 'view/dashboard.html',
	            controller  : 'dashboardController'
	        })
	        .when('/shared', {
	            templateUrl : 'view/shared.html',
	            controller  : 'sharedController'
	        })

	        // route for the about page
	        .when('/recycle', {
	            templateUrl : 'view/recycle.html',
	            controller  : 'recycleController'
	        })
	        .when('/files/proof/:id', {
	            templateUrl : 'view/proof.html',
	            controller  : 'proofController'
	        })
            .when('/files/shareuser/:id', {
                templateUrl : 'view/shareuser.html',
                controller  : 'shareController'
            })
	});
    myproofyapp.controller('mainController', function($scope,$http,$location,$timeout) {
        myproofyapp.fn.seekPermission();
        myproofyapp.fn.notificationCount($scope,$http);
        myproofyapp.fn.loadAllDetail($scope,$http);

        $scope.sectionTitle = 'Files';
        $scope.states = {};
        $scope.states.activeItem = ($location.$$url.split('/')[1]=="" || $location.$$url=="")?"files":$location.$$url.split('/')[1];
        $scope.items = [{
            id: 'files',
            title: 'Files',
            link:'#'
        }, {
            id: 'shared',
            title: 'Shared',
            link:'#shared'
        }, {
            id: 'recycle',
            title: 'Recycle bin',
            link:'#recycle'
        }];

        $scope.notificationHideShow = function(item){
            if(angular.element('.notificationBox').css('display')=='none'){
                angular.element('.notificationBox').show();
                var countCmp = angular.element('.count');
                countCmp.html('');
                countCmp.next().html('notifications_none');
                countCmp.hide();
                myproofyapp.fn.showLoader(true);
                $http({
                    method : "GET",
                    url : myproofyapp.appUrl+"files/getNotification",
                    timeout: 90000,
                    useDefaultXhrHeader: false,
                    headers: myproofyapp.fn.headers,
                }).then(function mySuccess(response) {
                    $scope.notification = response.data;
                    myproofyapp.fn.showLoader(false);
                }, function myError(response) {
                });
            }else{
                angular.element('.notificationBox').hide();
            }
        }
    });    

	// create the controller and inject Angular's $scope
	myproofyapp.controller('dashboardController', function($scope,$http,$location,$timeout) {
        myproofyapp.fn.showLoader(true);
        $http({
	        method : "GET",
	        url : myproofyapp.appUrl+"files/getFiles",
	        timeout: 90000,
            useDefaultXhrHeader: false,
            headers: myproofyapp.fn.headers,
	    }).then(function mySuccess(response) {
	        $scope.files = response.data;
            myproofyapp.fn.showLoader(false);
	    }, function myError(response) {
	        $scope.files = response.statusText;
	    });
	    $scope.showCanvasPanel = function(item){
            if(item.target.classList.contains('showSharedUserWindow')==false && item.target.classList.contains('showSharedUser')==false && item.target.classList.contains('listMenuItems')==false && item.target.classList.contains('material-icons')==false){
    	    	var imageId = item.currentTarget.getAttribute("data-imageId");
    	    	$location.path('files/proof/'+imageId);
            }
	    };
        $scope.uploadImageFile = function(item,uploadFrom){
            if(typeof(uploadFrom)=='undefined'){
                uploadFrom = item.currentTarget.getAttribute("data-action");   
            }
            if(uploadFrom=='Desktop'){
                $("#imgupload").trigger('click');
            }
        }
        $scope.initFileUploadfunction = function(){
            $timeout( function(){
                document.getElementById('imgupload').addEventListener('change', function(e) {
                    var fileObj = this.files[0];
                    var formData = new FormData();
                    formData.append("afile", fileObj);
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST',myproofyapp.appUrl+'files/uploadImage', true);
                    xhr.upload.onprogress = function(e) {
                        myproofyapp.fn.showLoader(true);
                    }
                    xhr.onload = function() {
                        if (this.status == 200) {
                            var response = JSON.parse(this.response);
                            $scope.files.splice(0, 0,response[0]);
                            $scope.$apply();
                            myproofyapp.fn.showLoader(false);
                        }
                    }
                    xhr.send(formData); 
                }, false);
            },500);
        }
        $scope.deleteImage = function(item,imageId){
            myproofyapp.fn.showLoader(true);
            $scope.files = $scope.files.filter(function(e){ return parseInt(e.id)!=parseInt(imageId);});
            $http({
                method : "delete",
                url : myproofyapp.appUrl+"files/deleteimage/"+imageId,
                timeout: 90000,
                useDefaultXhrHeader: false
            }).then(function mySuccess(response) {
                window.t = $scope.files;
                myproofyapp.fn.notifiOtherUsers(response.data.notification,"deleteImage");
                myproofyapp.fn.showLoader(false);
            }, function myError(response) {
            });
        }
        $scope.showUserList = function(item,imageId){
            $location.path('files/shareuser/'+imageId);
        }
        $scope.showSharedUserWindow = function(item,imageId){
            myproofyapp.fn.showLoader(true);
            var dataObj = new Object();
            dataObj['share'] = '1@gmail.com';
            dataObj['id'] = item.currentTarget.getAttribute("data-imageId");
            $http({
                method : "PUT",
                url : myproofyapp.appUrl+"files/shareFile",
                data:JSON.stringify(dataObj),
                timeout: 90000,
                useDefaultXhrHeader: false
            }).then(function mySuccess(response) {
                if(response.data.status){
                    var index = 0;
                    $scope.files = $scope.files.filter(function(e,i){ if(parseInt(e.id)!=parseInt(dataObj.id)){ return true; }else{ index = i; return false; }});
                    $scope.files.splice(index, 0,response.data.notification.data);
                    myproofyapp.fn.notifiOtherUsers(response.data.notification,"fileshare");
                }
                myproofyapp.fn.showLoader(false);
            }, function myError(response) {
            });
        }
        $scope.initFileUploadfunction();
	});

	myproofyapp.controller('proofController', function($scope,$http,$route) {
		document.getElementsByClassName('mainCanvasArea')[0].style.height = window.innerHeight-90+ 'px';
		document.getElementsByClassName('commentSection')[0].style.height = window.innerHeight-90-23+ 'px';

		document.getElementsByClassName('mainCanvasArea')[0].style.width = window.innerWidth-208-400+ 'px';
		
        document.getElementsByClassName('detailBox')[0].style.height = window.innerHeight-90+ 'px';
        document.getElementsByClassName('commentList')[0].style.height = window.innerHeight-90-23-42+ 'px';
        
	    var imageId = $route.current.params.id;
	    $scope.sectionTitle = 'Proof View';
	    //load Comments of file;
        myproofyapp.fn.showLoader(true);
        currentShape = undefined;
        strokeWidth = 4;
        stokeColor = '#000000';
	    $http({
	        method : "GET",
	        url : myproofyapp.appUrl+"files/getComments/"+imageId,
	        timeout: 90000,
            useDefaultXhrHeader: false
	    }).then(function mySuccess(response) {
	        $scope.comments = response.data;
            var commentCount = response.data.map(function(e){ return e.comment_count});
            if(commentCount.length>0){
                drawCount = myproofyapp.fn.getMaxOfArray(commentCount);
                drawCount++;
            }else{
                drawCount = 0;
            }
            myproofyapp.fn.showLoader(false);
	    }, function myError(response) {
	        $scope.comments = response.statusText;
	    });
	    $http({
	        method : "GET",
	        url : myproofyapp.appUrl+"files/getFiles/"+imageId,
	        timeout: 90000,
            useDefaultXhrHeader: false
	    }).then(function mySuccess(response) {
            canvasEventRegister = false;
            $scope.imageData = response.data[0];
	    	myproofyapp.loadImageOnCanvas($scope.imageData.image);
	    }, function myError(response) {
	    });

	    $scope.postComment = function(item){
            myproofyapp.fn.showLoader(true);
	    	var checkCommentType = item.currentTarget.getAttribute("data-subComment");
            var commentObject = new Object();
	    	if(checkCommentType=="true"){
	    		commentObject['replyId'] = parseInt(item.currentTarget.getAttribute("data-commentId"));
	    	}
	    	commentObject['comment'] =item.currentTarget.parentElement.parentElement.getElementsByTagName('input')[0].value.trim();
	    	commentObject['dataUrl'] = document.getElementById('canvasarea').toDataURL();
	    	commentObject['comment_count'] = drawCount;
	    	commentObject['imageId'] = parseInt(imageId);
            item.currentTarget.parentElement.parentElement.getElementsByTagName('input')[0].value = '';
            item.currentTarget.parentElement.parentElement.getElementsByTagName('input')[0].focus(true);

	    	$http({
		        method : "post",
		        url : myproofyapp.appUrl+"files/postcomment",
		        data:JSON.stringify(commentObject),
		        timeout: 90000,
	            useDefaultXhrHeader: false
		    }).then(function mySuccess(response) {
                $scope.comments.push(response.data.data[0]);
                myproofyapp.fn.notifiOtherUsers(response.data,"addComment");
                myproofyapp.fn.showLoader(false);
                $scope.clearCanvasView();
                myproofyapp.loadImageOnCanvas($scope.imageData.image);
                drawCount++;
		    }, function myError(response) {
		    });
	    }
        $scope.initEditBtn = function(item){
            $scope.canvasView();
            if(item.currentTarget.getAttribute('data-action')=='download'){
                return;
            }else{
                currentShape = item.currentTarget.getAttribute('data-action');
            }
            angular.element('.proofView').find('.selectedBtn').removeClass('selectedBtn');
            item.currentTarget.classList.add('selectedBtn');
        }
        $scope.loadProofedFile = function(item){
            angular.element('.commentList li').removeClass('commentListBorder');
            item.currentTarget.classList.add('commentListBorder');
            $scope.clearCanvasView();
            myproofyapp.loadImageOnCanvas(item.currentTarget.getAttribute('data-url'));
        }
        $scope.clearCanvasView = function(){
            currentShape = undefined;
            angular.element('.proofView').find('.selectedBtn').removeClass('selectedBtn');
        }
        $scope.canvasView = function(){
            if(angular.element('.commentList li').hasClass('commentListBorder')){
                angular.element('.commentList li').removeClass('commentListBorder');
                $scope.clearCanvasView();
                myproofyapp.loadImageOnCanvas($scope.imageData.image);
            }
        }
        $scope.updateStokeWidth = function(item,width){
            angular.element('.mp-imageSize a').removeClass('selected');
            item.currentTarget.classList.add('selected');
            strokeWidth = width;
        }
        $scope.updateStokeColor = function(item,width){
            angular.element('.mp-imageColor div').removeClass('selected');
            item.currentTarget.classList.add('selected');
            stokeColor = item.currentTarget.getAttribute('data-color');
        }
	});

	myproofyapp.controller('sharedController', function($scope) {
	    $scope.sectionTitle = 'Shared';
	});
    myproofyapp.controller('shareController', function($scope,$http,$route) {
        $scope.sectionTitle = 'Shared User';
        var imageId = $route.current.params.id;
        $http({
            method : "GET",
            url : myproofyapp.appUrl+"files/getFiles/"+imageId,
            timeout: 90000,
            useDefaultXhrHeader: false
        }).then(function mySuccess(response) {
           if(response.data.length>0){
               $scope.userId = response.data[0].userId;
               $scope.loginUserId = myproofyapp.fn.getUserDetail.id; 
               $scope.share = response.data[0].share;
           }
        }, function myError(response) {
        });
        $scope.unshareImage = function(item,userId){
            myproofyapp.fn.showLoader(true);
            var unlinkFileObj = new Object();
            $scope.share.splice($scope.share.indexOf(userId),1);
            unlinkFileObj['imageId'] = parseInt(imageId);
            unlinkFileObj['share'] = $scope.share;
            unlinkFileObj['userId'] = parseInt(userId);
            $http({
                method : "PUT",
                url : myproofyapp.appUrl+"files/unlink/"+imageId,
                timeout: 90000,
                data:JSON.stringify(unlinkFileObj),
                useDefaultXhrHeader: false
            }).then(function mySuccess(response) {
                myproofyapp.fn.notifiOtherUsers(response.data.notification,"fileunshare");
                myproofyapp.fn.showLoader(false);
            }, function myError(response) {
            });
        }
    });
    
	myproofyapp.controller('recycleController', function($scope) {
	    $scope.sectionTitle = 'Recycle bin';
	});

    // Directive

    myproofyapp.directive("updatedtime", function() {
        return {
            restrict: 'A',
            scope: {
              uploadedDate: "="
            },
            template:function() {
                return '<span class="{{class}}">{{time}}</span>';
            },
            link: function (scope, element, attrs) {
               scope.time = myproofyapp.getTime(attrs.uploadeddate,this,'');
               scope.class = myproofyapp.getTime(attrs.uploadeddate,'',true);

            }
        };
    });
    myproofyapp.fn = {
        // Check if browser supports notifications
        isSupported: function() {
            var isSupported = false;
            try {
                isSupported = !!( /* Safari, Chrome */ win.Notification || /* Chrome & ff-html5notifications plugin */ win.webkitNotifications || /* Firefox Mobile */ navigator.mozNotification || /* IE9+ */ (win.external && win.external.msIsSiteMode() !== undefined));
            } catch (e) {}
            return isSupported;
        },
        headers:{
            /*"X-API-KEY": 'e7d9d6e1ab8e4cb27d0bb4e4b27bfcebabc12264',*/
            'Content-Type': 'application/json',
        },
        // Ask for notifications permission
        seekPermission: function() {
            if (!this.isSupported) {
                return; }

            if (typeof Notification!='undefined' && Notification.permission !== "granted") {
                Notification.requestPermission();
            }
        },
        getWrapper: function(notification) {
            var win = window;
            var ieVerification = Math.floor((Math.random() * 10) + 1);

            return {
                close: function() {
                }
            };
        },
        notify: function(title, options) {
            if (!this.isSupported) {
                return; }
            var notification, notificationWrapper;
            var win = window;
            options.body = options.body.replace(/<br\/>/g, '\n').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            options.icon = './images/notification-bell.png';
            if (win.Notification) { /* Safari 6, Chrome (23+) */
                notification = new win.Notification(title, {
                    /* The notification's icon - For Chrome in Windows, Linux & Chrome OS */
                    icon: options.icon ? options.icon : options.icon.x32,
                    /* The notification’s subtitle. */
                    body: options.body || '',
                    /*
                        The notification’s unique identifier.
                        This prevents duplicate entries from appearing if the user has multiple instances of your website open at once.
                    */
                    tag: options.tag || ''
                });
            } else if (win.webkitNotifications) { /* FF with html5Notifications plugin installed */
                notification = win.webkitNotifications.createNotification(options.icon, title, options.body);
                notification.show();
            } else if (navigator.mozNotification) { /* Firefox Mobile */
                notification = navigator.mozNotification.createNotification(title, options.body, options.icon);
                notification.show();
            } else if (win.external && win.external.msIsSiteMode()) { /* IE9+ */
                //Clear any previous notifications
                win.external.msSiteModeClearIconOverlay();
                win.external.msSiteModeSetIconOverlay((options.icon ? options.icon : options.icon.x16), title);
                win.external.msSiteModeActivate();
                notification = {
                    "ieVerification": ieVerification + 1
                };
            }
            //return notification;
            notificationWrapper = this.getWrapper(notification);
            notification.onclick = function () {
                window.focus();
                notification.close();
            };
            notification.onshow = function() {
                setTimeout(function(){
                    notification.close();
                },5000);
            };
        },
        notificationCount:function($scope,$http){
            $http({
                method : "GET",
                url : myproofyapp.appUrl+"files/getNotificationCount",
                timeout: 90000,
                useDefaultXhrHeader: false,
                headers: myproofyapp.fn.headers,
            }).then(function mySuccess(response) {
                if(response.data.count>0){
                    var countCmp = angular.element('.count');
                    $scope.count = response.data.count;
                    countCmp.next().html('notifications_active');
                    countCmp.show();
                }
            }, function myError(response) {
            });
        },
        loadAllDetail:function($scope,$http){
            $http({
                method : "GET",
                url : myproofyapp.appUrl+"files/getAccount",
                timeout: 90000,
                useDefaultXhrHeader: false,
                headers: myproofyapp.fn.headers,
            }).then(function mySuccess(response) {
                $scope.total_size = response.data.total_size;
                $scope.total_percentage = response.data.total_percentage;
                myproofyapp.fn.getUserDetail = {'id':4};
                $scope.userId = myproofyapp.fn.getUserDetail.id;
            }, function myError(response) {
            });
        },
        showCoachMark:function(status){
            if(status){
                $('.welcomeScreenWindow').fadeIn();
                $('.welcomeHead').fadeIn();
            }else{
                $('.welcomeScreenWindow').fadeOut();
                $('.welcomeHead').fadeOut();
            }
        },
        getUserDetail:{},
        notifiOtherUsers:function(response,status){
            var notifi = new Object();
            if(status=="deleteImage"){
                notifi['notification'] = response;
                notifi['action'] = status;
                //notifi['selfUser'] = myproofyapp.fn.getUserDetail.id;
            }
            if(status=="fileapprove"){
                notifi['notification'] = response;
                notifi['action'] = status;
                //notifi['selfUser'] = myproofyapp.fn.getUserDetail.id;
            }
            if(status=="fileshare"){
                notifi['notification'] = response;
                notifi['action'] = status;
                //notifi['selfUser'] = myproofyapp.fn.getUserDetail.id;
            }
            if(status=="fileunshare"){
                notifi['notification'] = response;
                notifi['action'] = status;
                //notifi['selfUser'] = myproofyapp.fn.getUserDetail.id;
            }
            if(status=="deleteComment"){
                notifi['notification'] = response;
                notifi['action'] = status;
                //notifi['selfUser'] = myproofyapp.fn.getUserDetail.id;
            }
            if(status=="addComment"){
                notifi['notification'] = response;
                notifi['action'] = status;
                //notifi['selfUser'] = myproofyapp.fn.getUserDetail.id;
            }
            //socket.emit("notifiUser",notifi);
            //socket.on("io_socket_responseData",function(data){
            //    console.log(data);
                myproofyapp.fn.notificationCountChange();
                myproofyapp.fn.showDesktopNotification(notifi);
            //});
        },
        getStyleCnt: function(className) {
            var css = document.getElementById('userCss');
            var classes = css.sheet.rules || css.sheet.cssRules;
            for (var x = 0; x < classes.length; x++) {
                if (classes[x].selectorText == className + '::after' || classes[x].selectorText == className + ':after') {
                    str = classes[x].style.content;
                    str = str.replace(/'/g, '');
                    str = str.replace(/"/g, '');
                    return str.trim();
                }
            }
        },
        notificationCountChange:function(){
            var countCmp = angular.element('.count');
            var number;
            if(countCmp.text()==""){
                number = 1;
            }else{
                number = parseInt(countCmp.text())+1;
            }
            countCmp.html(number);
            countCmp.next().html('notifications_active');
            countCmp.show();
        },
        showDesktopNotification:function(data){
            var recData = "";
            var bodyObj = new Object();
            if(data.action=="fileapprove"){
                var approveStatus = parseInt(data.notification.data.approve)==0?"disapproved":"approved";
                recData+= myproofyapp.fn.getStyleCnt(".u_name"+data.notification.notifi_record.updated_by)+" has "+approveStatus+" file - "+data.notification.data.image;
            }
            if(data.action=="fileshare"){
                var shareArray = data.notification.notifi_record.notifi_to.split(',');
                var userName = "";
                for(var j=0;j<shareArray.length;j++){
                    if(parseInt(shareArray[j])!=parseInt(data.notification.notifi_record.updated_by)){
                        var self="";
                        if(myproofyapp.fn.getUserDetail.id==parseInt(shareArray[j])){
                            self = '(you)';
                        }
                        if(j!=shareArray.length-1){
                            var comma = ", ";
                        }else{
                            var comma = "";
                        }
                        userName+=myproofyapp.fn.getStyleCnt(".u_name"+parseInt(shareArray[j]))+self+comma;
                    }
                }
                recData+=myproofyapp.fn.getStyleCnt(".u_name"+data.notification.notifi_record.updated_by)+' has shared '+data.notification.data.image+' file with '+userName;
            }
            if(data.action=="fileunshare"){
                recData+=myproofyapp.fn.getStyleCnt(".u_name"+data.notification.notifi_record.updated_by);
                var self = "";
                if(myproofyapp.fn.getUserDetail.id==parseInt(data.notification.data.unshare)){
                    self = '(you)';
                }
                recData+=' has removed '+myproofyapp.fn.getStyleCnt(".u_name"+parseInt(data.notification.data.unshare))+self+' from '+data.notification.data.image+' file';
            }
            if(data.action=="deleteImage"){
                recData+=myproofyapp.fn.getStyleCnt(".u_name"+data.notification.notifi_record.updated_by);
                recData+=' has removed '+data.notification.data.image+' file';
            }
            if(data.action=="addComment"){
                recData+=myproofyapp.fn.getStyleCnt(".u_name"+data.notification.notification.notifi_record.updated_by);
                recData+=' has posted a comment on the file - '+data.notification.notification.notifi_record.image+' file';
            }
            if(data.action=="deleteComment"){
                recData+=myproofyapp.fn.getStyleCnt(".u_name"+data.notification.notifi_record.updated_by);
                recData+=' has removed comment from file - '+data.notification.data.image+' file';
            }
            bodyObj['body'] = recData;
            myproofyapp.fn.notify('Myapp',bodyObj);
        },
        getMaxOfArray:function(numArray) {
          return Math.max.apply(null, numArray);
        },
        showLoader:function(status){
            if(status){
                angular.element('.loaderSmall').show();
            }else{
                angular.element('.loaderSmall').hide();
            }
        }
    }

    myproofyapp.getTime = function(datetime, obj, get24Hrs)
    {
        datetime = datetime || false;
        get24Hrs = get24Hrs || false;
        if(datetime && get24Hrs == true){
            datetime = datetime.replace(/\.\d+/, ""); // remove milliseconds
            datetime = datetime.replace(/-/, "/").replace(/-/, "/");
            datetime = datetime.replace(/T/, " ").replace(/Z/, " UTC");
            datetime = datetime.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
            datetime = new Date(datetime * 1000 || datetime);

            var now = new Date();
            var seconds = ((now.getTime() - datetime) * .001) >> 0;
            var minutes = seconds / 60;
            var hours = minutes / 60;

            if(hours<24){
                return "highlText";
            }else {
                return "oldHighLText";
            }
        }             
        var templates = {
            prefix: "",
            suffix: "",
            seconds: "just now",
            minute: "a min",
            minutes: "%d mins",
            hour: "an hr",
            hours: "%d hrs",
            day: "a day",
            days: "%d days",
            month: "last month",
            months: "%d months",
            year: "a year",
            years: "%d years"
        };
        var template = function (t, n) {
            return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
        };

        var timer = function (datetime, obj) {
            if (!datetime) return;
            datetime = datetime.replace(/\.\d+/, ""); // remove milliseconds
            datetime = datetime.replace(/-/, "/").replace(/-/, "/");
            datetime = datetime.replace(/T/, " ").replace(/Z/, " UTC");
            datetime = datetime.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
            datetime = new Date(datetime * 1000 || datetime);
            var now = new Date();
            var seconds = ((now.getTime() - datetime) * .001) >> 0;
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var years = days / 365;

            if (typeof obj.classList === 'object') {
                if(hours<24){
                    obj.classList.add("highlText");
                }else{
                    obj.classList.remove("highlText");
                }
            }
            return templates.prefix + (
            seconds < 45 && template('seconds', seconds) || seconds < 90 && template('minute', 1) || minutes < 45 && template('minutes', minutes) || minutes < 90 && template('hour', 1) || hours < 24 && template('hours', hours) || hours < 42 && template('day', 1) || days < 30 && template('days', days) || days < 45 && template('month', 1) || days < 365 && template('months', days / 30) || years < 1.5 && template('year', 1) || template('years', years)) + templates.suffix;
        };

        if(datetime==false){
            var elements = document.getElementsByClassName('timeago');
            for (var i in elements) {
                var $this = elements[i];
                if (typeof $this === 'object') {
                    $this.innerHTML = timer($this.getAttribute('title') || $this.getAttribute('datetime'), $this);
                }
            }
            // update time every minute
            //setTimeout(Ext.fn.timeAgo, 60000);
        }else{
            return timer(datetime, obj);
        }
    }

    myproofyapp.loadImageOnCanvas = function(response)
    {
        var strokeStyle;
        rects=[];rectangleArray = [],lineArray = [],MainLineArray = [];
        var canvas = document.getElementById('canvasarea'),
        context = canvas.getContext('2d');
        var canvasTemp = document.getElementById("canvasTemp");
        var ctxTemp = canvasTemp.getContext("2d");
        base_image = new Image();
        base_image.src = response;
        base_image.onload = function(){
            var width = window.innerWidth-610;
            var height = window.innerHeight-126;
            if(base_image.naturalWidth<width){
                width = base_image.naturalWidth;
            }
            if(base_image.naturalHeight<height){
                height = base_image.naturalHeight;
            }
            canvas.setAttribute('width',width);
            canvas.setAttribute('height',height);
            canvasTemp.setAttribute('width',width);
            canvasTemp.setAttribute('height',height);

            var wrh = base_image.width / base_image.height;
            var newWidth = canvas.width;
            var newHeight = newWidth / wrh;
            if (newHeight > canvas.height) {
                newHeight = canvas.height;
                newWidth = newHeight * wrh;
            }
            canvas.setAttribute('width',newWidth);
            canvas.setAttribute('height',newHeight);
            canvasTemp.setAttribute('width',newWidth);
            canvasTemp.setAttribute('height',newHeight);

            canvas.style.marginLeft=($('.mainCanvasArea').width()-canvas.width)/2+'px';
            canvasTemp.style.marginLeft=($('.mainCanvasArea').width()-canvas.width)/2+'px';

            canvas.style.marginTop = (parseInt($('.mainCanvasArea').height())-parseInt(canvas.height))/2+'px';
            canvasTemp.style.marginTop = (parseInt($('.mainCanvasArea').height())-parseInt(canvas.height))/2+'px';
            context.drawImage(base_image,0,0,newWidth,newHeight);
            if(canvasEventRegister==false){
                drawOnCanvas();
                canvasEventRegister = true;
            }
        }
        function drawOnCanvas(){
            canvas.addEventListener("mousemove", function (e) {
                if(currentShape=='pencil'){
                    drawLineOnCanvas.findxy('move', e)
                }else if(currentShape=='square'){
                    drawRectangleOnCanvas.handleMouseMove(e);
                }else if(currentShape=='circle'){
                }else if(currentShape=='line'){
                    drawStraightLineOnCanvas.mouseMove(e);
                }else if(currentShape=='drag'){
                }
                getCurrentPostion.mousemove(e);
            }, false);
            canvas.addEventListener("mousedown", function (e) {
                if(currentShape=='pencil'){
                    drawLineOnCanvas.findxy('down', e)
                }else if(currentShape=='square'){
                    drawRectangleOnCanvas.handleMouseDown(e);
                }else if(currentShape=='circle'){
                }else if(currentShape=='line'){
                    drawStraightLineOnCanvas.mouseDown(e)
                }else if(currentShape=='text'){
                    openTextArea.mouseDownEvent(e);
                }else if(currentShape=='drag'){
                }
            }, false);
            canvas.addEventListener("mouseup", function (e) {
                if(currentShape=='pencil'){
                    drawLineOnCanvas.findxy('up', e)
                }else if(currentShape=='square'){
                    drawRectangleOnCanvas.handleMouseUp(e);
                }else if(currentShape=='circle'){
                }else if(currentShape=='line'){
                    drawStraightLineOnCanvas.mouseUp(e);
                }else if(currentShape=='drag'){
                }
            }, false);
            canvas.addEventListener("mouseout", function (e) {
                if(currentShape=='pencil'){
                    drawLineOnCanvas.findxy('out', e);
                }else if(currentShape=='square'){
                    drawRectangleOnCanvas.handleMouseOut(e);
                }else if(currentShape==''){

                }else if(currentShape=='line'){
                }else if(currentShape=='drag'){
                }
            }, false);
            /* pen on Canvas */
            var flag = false,prevX = 0,currX = 0,prevY = 0,currY = 0,dot_flag = false,lineObject;
            var drawLineOnCanvas = {
                draw:function(prevX,prevY,currX,currY,strokeStyle) {
                    context.beginPath();
                    context.lineWidth = strokeWidth;
                    context.moveTo(prevX, prevY);
                    context.lineTo(currX, currY);
                    context.globalAlpha=1;
                    context.strokeStyle = strokeStyle;
                    //context.lineWidth = strokeWidth;
                    context.stroke();
                    context.closePath();
                },
                findxy:function (res, e) {
                    if (res == 'down') {
                        lineArray = [];
                        prevX = currX;
                        prevY = currY;
                        currX = e.clientX - canvas.offsetLeft;
                        currY = e.clientY - canvas.offsetTop;
                        flag = true;
                        dot_flag = true;
                        if (dot_flag) {
                            context.beginPath();
                            context.fillStyle = strokeStyle;
                            context.fillRect(currX, currY, 2, 2);
                            context.closePath();
                            dot_flag = false;
                        }
                    }
                    if (res == 'up' || res == "out") {
                        MainLineArray.push(lineArray);
                        flag = false;
                    }
                    if (res == 'move') {
                        if (flag) {
                            prevX = currX;
                            prevY = currY;
                            currX = e.clientX - canvas.offsetLeft;
                            currY = e.clientY - canvas.offsetTop;
                            console.log(currX+','+currY);
                            lineObject = {
                                prevX:currX,
                                prevY:currY,
                                currX:e.clientX - canvas.offsetLeft,
                                currY:e.clientY - canvas.offsetTop,
                                color:stokeColor
                            }
                            lineArray.push(lineObject);
                            drawLineOnCanvas.draw(prevX,prevY,currX,currY,lineObject.color,lineObject.width);
                        }
                    }
                }
            }
            /* rectangle on Canvas */
            var isRecDown=false;
            var startX,startY;
            var newRect;
            var drawRectangleOnCanvas={
                handleMouseDown:function(e){
                  // tell the browser we're handling this event
                  e.preventDefault();
                  e.stopPropagation();

                  startX=parseInt(e.offsetX == undefined ? e.layerX : e.offsetX);
                  startY=parseInt(e.offsetY == undefined ? e.layerY : e.offsetY);

                  // Put your mousedown stuff here
                  isRecDown=true;
                },

                handleMouseUp:function(e){
                  // tell the browser we're handling this event
                  e.preventDefault();
                  e.stopPropagation();

                  mouseX=parseInt(e.offsetX == undefined ? e.layerX : e.offsetX);
                  mouseY=parseInt(e.offsetY == undefined ? e.layerY : e.offsetY);

                  // Put your mouseup stuff here
                  isRecDown=false;

                  //if(!willOverlap(newRect)){
                    rects.push(newRect);
                  //}
                  drawRectangleOnCanvas.drawAll();
                },

                drawAll:function(){
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    base_image.onload();
                    context.lineWidth = strokeWidth;
                    rePaintOnCanvas.lineRepaint();
                    rePaintOnCanvas.rectangleRepaint();
                    rePaintOnCanvas.straignLineRepaint();
                },
                handleMouseOut:function(e){
                  // tell the browser we're handling this event
                  e.preventDefault();
                  e.stopPropagation();

                  mouseX=parseInt(e.offsetX == undefined ? e.layerX : e.offsetX);
                  mouseY=parseInt(e.offsetY == undefined ? e.layerY : e.offsetY);

                  // Put your mouseOut stuff here
                  isRecDown=false;
                },

                handleMouseMove:function(e){
                  if(!isRecDown){return;}
                  // tell the browser we're handling this event
                  e.preventDefault();
                  e.stopPropagation();

                  mouseX=parseInt(e.offsetX == undefined ? e.layerX : e.offsetX);
                  mouseY=parseInt(e.offsetY == undefined ? e.layerY : e.offsetY);
                  newRect={
                    left:Math.min(startX,mouseX),
                    right:Math.max(startX,mouseX),
                    top:Math.min(startY,mouseY),
                    bottom:Math.max(startY,mouseY),
                    color:stokeColor
                  }
                  //context.lineWidth = strokeWidth;
                  drawRectangleOnCanvas.drawAll();
                  context.strokeStyle = stokeColor;
                  //context.globalAlpha=1;
                  context.strokeRect(startX,startY,mouseX-startX,mouseY-startY);
                }
            }

            /* straight line */
            var mouseDown = false;
            var stPoint;
            var endPoint;
            var pointsObj;

            var drawStraightLineOnCanvas = {
                Point:function(x, y) {
                    this.x = x;
                    this.y = y;
                },
                lineP:function(stPoint, endPoint) {
                    this.stPoint = stPoint;
                    this.endPoint = endPoint;
                },
                mouseDown:function(e) {
                    mouseDown = true;
                    stPoint = new drawStraightLineOnCanvas.Point(e.layerX, e.layerY); //get start point for line
                    console.log(stPoint);
                },
                mouseMove:function(e) {
                    if (!mouseDown) return;
                    context.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
                    base_image.onload();
                    context.lineWidth = strokeWidth;
                    rePaintOnCanvas.lineRepaint();
                    rePaintOnCanvas.rectangleRepaint();
                    drawStraightLineOnCanvas.drawLines(stPoint.x,stPoint.y,e.layerX,e.layerY,stokeColor,drawCount);
                    rePaintOnCanvas.straignLineRepaint(); //draw previous lines
                },
                mouseUp:function(e) {
                    mouseDown = false;
                    endPoint = new drawStraightLineOnCanvas.Point(e.layerX, e.layerY);
                    pointsObj = {
                        "lineStartX":stPoint.x,
                        "lineStartY":stPoint.y,
                        "toX":endPoint.x,
                        "toY":endPoint.y,
                        "color":stokeColor,
                        "drawCount":drawCount                        
                    }
                    rectangleArray.push(pointsObj);
                },
                //draw all lines from stored point
                drawLines:function(lineStartX,lineStartY,toX, toY,color,drawCount) {
                    
                    context.beginPath();
                    //context.lineWidth = strokeWidth;
                    context.moveTo(lineStartX, lineStartY);
                    context.lineTo(toX, toY);
                    context.strokeStyle = color;
                    //context.globalAlpha=1;
                    context.stroke();
                    
                    var angle = Math.atan2(toY-lineStartY,toX-lineStartX);
                    var headlen = 10;
                    context.beginPath();
                    //context.lineWidth = strokeWidth;
                    context.moveTo(toX, toY);
                    context.lineTo(toX-headlen*Math.cos(angle-Math.PI/7),toY-headlen*Math.sin(angle-Math.PI/7));
                    context.lineTo(toX-headlen*Math.cos(angle+Math.PI/7),toY-headlen*Math.sin(angle+Math.PI/7));
                    context.lineTo(toX, toY);
                    context.lineTo(toX-headlen*Math.cos(angle-Math.PI/7),toY-headlen*Math.sin(angle-Math.PI/7));
                    context.strokeStyle = color;
                    context.stroke();

                    //draw a circle
                    context.beginPath();
                    context.arc(lineStartX, lineStartY, 15, 0, Math.PI*2, true); 
                    context.closePath();
                    context.fillStyle = color;
                    //context.globalAlpha=1;
                    context.fill();

                    var text = drawCount;
                    context.fillStyle = "#fff";
                    var font = "bold " + radius +"px serif";
                    context.font = font;
                    var width = context.measureText(text).width;
                    var height = context.measureText("w").width; // this is a GUESS of height
                    context.fillText(text, lineStartX - (width/2) ,lineStartY + (height/2));
                }
            }

            var rePaintOnCanvas = {
                lineRepaint:function(){
                    if(MainLineArray.length>0){
                        for(var k=0;k<MainLineArray.length;k++){
                            for(var i=0;i<MainLineArray[k].length-1;i++){
                                var d1 = MainLineArray[k][i];
                                var d2 = MainLineArray[k][i+1];
                                drawLineOnCanvas.draw(d1.prevX,d1.prevY,d2.currX,d2.currY,d2.color,d2.width);
                            }
                        }
                    }
                },
                rectangleRepaint:function(){
                    for(var i=0;i<rects.length;i++){
                        var r=rects[i];
                        context.strokeStyle = r.color;
                        //context.globalAlpha=1;
                        context.strokeRect(r.left,r.top,r.right-r.left,r.bottom-r.top);

                        context.beginPath();
                        context.arc(r.left, r.top, 15, 0, Math.PI*2, true); 
                        context.closePath();
                        context.fillStyle = r.color;
                        context.fill();

                        var text = drawCount;
                        context.fillStyle = "#fff";
                        var font = "bold " + radius +"px serif";
                        context.font = font;
                        var width = context.measureText(text).width;
                        var height = context.measureText("w").width; // this is a GUESS of height
                        context.fillText(text, r.left - (width/2) ,r.top + (height/2));
                    }
                },
                straignLineRepaint:function(){
                    rectangleArray.forEach(function(item) {
                        drawStraightLineOnCanvas.drawLines(item.lineStartX,item.lineStartY,item.toX, item.toY,item.color,item.drawCount);
                    });
                }
            }
            /* open Textarea */
           /* var openTextArea = {
                mouseDownEvent:function(e){
                    currX = e.clientX - canvas.offsetLeft;
                    currY = e.clientY - canvas.offsetTop;
                    if(typeof(document.getElementById('textbox'))!='undefined' && document.getElementById('textbox')!=null){
                        document.getElementById('textbox').remove();
                    }
                    var div = document.createElement('div');
                    div.style.top = e.clientY+'px';
                    div.style.left = e.clientX+'px';
                    div.setAttribute('id','textbox');
                    div.innerHTML = '<div class="box"><label>Comment: </label><textarea name="commentarea"></textarea></div><div class="box"><label>Font color: </label><input type="color"></div><div class="box"><input type="button" name="postcomment" class="submitFormBtn postComment" value="Add comment"><input type="button" name="postcomment" class="submitFormBtn" value="Close"></div>';
                    document.getElementsByClassName('mainCanvasArea')[0].appendChild(div);
                    document.getElementsByClassName('postComment')[0].addEventListener('click',function(e){
                    
                    });
                }
            }*/
            var getCurrentPostion = {
                mousemove:function(e){
                    currX = e.clientX - canvas.offsetLeft;
                    currY = e.clientY - canvas.offsetTop;
                    //console.log(currX+','+currY);
                    //$('.currentCoordinates').html('<i class="fa fa-location-arrow"></i> <span>'+currX+','+currY+'</span>');
                }
            }
        }
    }
    /*myproofyapp.service('service', function($http){
        this.promise = null;
        function makeRequest() {
          return $http({
                method : "GET",
                url : "https://parminder.indev.proofhub.com/api/v3/projects/896327841/todolists/14602805283/tasks?_dc=1498541474278&page=1&start=0&limit=25",
                timeout: 90000,
                useDefaultXhrHeader: false,
                headers: {
                    "X-API-KEY": '722f7f45ff2800fc4b6bd12753d82dbb5c8401ea',
                    'Content-Type': 'application/json',
                    "Ref-Key" : 'phd65893GJHGJHG738twd72YUyt63',
                    'Soc-Key': 'xifs43DqkpCsHEQ0AAHi'
                }
            })
            .then(function(resp){
              return resp.data;
            });
        }
        this.getPromise = function(update){
            if (update || !this.promise) {
                this.promise = makeRequest();
            }
            return this.promise;      
        }
    })*/