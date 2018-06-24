myproofyapp.controller('dashboardController', function($scope,$location) {
	$scope.sectionTitle = 'Files';
	$scope.states = {};
    $scope.states.activeItem = $location.$$url.split('/')[1]==""?"files":$location.$$url.split('/')[1];
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
});