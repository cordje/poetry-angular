app.controller('lineCtrl',function($scope, ngDialog, DevicesData, $q, $window){
    $scope.widget.isChart = true;
    $scope.widget.type = "line";
    $scope.dateOptions = ["today", "week", "month"];

    if(!$scope.widget.chartObject)
        $scope.loading = true;

    if($scope.widget.deviceList){
        $scope.tempDeviceList = $scope.widget.deviceList.slice(0);
    }
    else{
        $scope.tempDeviceList = [];
    }

    if (!$scope.widget.hasOwnProperty('chartObject') && !$scope.widget.hasOwnProperty('device')) {
        $scope.widget.chartObject = {
            type: "LineChart",
            data: [],
            options: {
                //title: 'Device',
                pointSize: 5,
                legend: { position: 'bottom' },
                interpolateNulls: true
            }
        };
        $scope.widget.show = true;
    }

    // ---------- Old Functions -------------------

    $scope.clickToOpen = function () {
        ngDialog.openConfirm( {
            template: 'dashboard/modalWidget.pug',
            className: 'ngdialog-theme-default',
            scope:$scope
        } )
        .then( function (result) {
            console.log("confirm edit result", result);
            $scope.widget = result.newWidget;
            $scope.widget.title = result.title;
        } );
    };

    // ---------------- New Functions ------------------

    $scope.getHistory = function(deviceId, startDate, endDate, measurementType){
        var deferred = $q.defer();
    
        var result;

        let aggregation = $scope.widget.aggregation || "";

        DevicesData.getDeviceData(deviceId, startDate, endDate, measurementType, $scope.widget.smart, aggregation).then(function(measurements){
            result = [
                [ 'date', measurements.name]
            ];
            if(measurements.datas && measurements.datas.length > 0){
                measurements.datas.forEach(function (measurement){
                    result.push(measurement);
                });
            }

            $scope.widget.chartObject.options.vAxis = {
                title: $scope.widget.measurementType +  ' (' + measurements.unit + ')'
            };

            deferred.resolve(result);
        });

        return deferred.promise;
    }


    $scope.refreshFromDevice = function(){
        if(!$scope.widget.chartObject){
            $scope.widget.chartObject = {
                type: "LineChart",
                data: {},
                options: {
                    height:100,
                    width:100,
                    title: $scope.widget.measurementType,
                    curveType: 'function',
                    legend: { position: 'bottom' }
                }
            };

            $scope.widget.deviceList.forEach(function(device){
                $scope.addDevice(device.id);
            });

        }
        if($scope.widget.chartObject.data.length == 0 && $scope.widget.deviceList){
            $scope.widget.deviceList.forEach(function(device){
                $scope.addDevice(device.id);
            });
        }
        $scope.widget.refreshed = true;

    }

    $scope.addDevice = function(id){
        if(id && $scope.widget.measurementType && ($scope.widget.dateOption || ($scope.widget.startDate && $scope.widget.endDate))){
            var startDate = "";
            var endDate = "";
            if($scope.widget.customDate){
                startDate = $scope.widget.startDate;
                endDate = $scope.widget.endDate;
            }
            else{
                endDate = new Date();
                switch($scope.widget.dateOption){
                    case "week": 
                        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime() - endDate.getDay() * 24 * 60 * 60 * 1000;
                        break;
                    case "month": 
                        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
                        break;
                    default: 
                        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                }
            }

            $scope.getHistory(id, startDate, endDate, $scope.widget.measurementType)
            .then(function(result){
                if(!$scope.widget.chartObject.data || !$scope.widget.chartObject.data.length){
                    $scope.widget.chartObject.data = [];
                    result.forEach(function(elem){
                        $scope.widget.chartObject.data.push(elem);
                    });
                }
                else{
                    $scope.mergeData($scope.widget.chartObject.data, result);
                }

                var head = [$scope.widget.chartObject.data[0]];
                var body = $scope.widget.chartObject.data.slice(1);
                body.sort(function(a, b){
                    var aDate = new Date(a[0]).getTime();
                    var bDate = new Date(b[0]).getTime();
                    return aDate - bDate;
                });
                $scope.widget.chartObject.data = head.concat(body);
                $scope.loading = false;

            });
        }
        else{
            console.log("all fields not completed");
        }
    }

    $scope.removeDevice = function(device){
        var position = -1;
        for(i=0; i<$scope.tempDeviceList.length; i++){

            if($scope.tempDeviceList[i].id == device.id)
                position = i;
        }

        if(position >= 0){

            $scope.tempDeviceList.splice(position, 1);
        }
        else{
            console.log("device to remove not found");
        }
    }

    $scope.mergeData = function(resultData, newData){
        var position = resultData[0].length;
        newData.forEach(function(elem){
            var dataRow = $scope.getDataRow(resultData, elem[0]);
            if(dataRow.length){
                if(dataRow.length <= position)
                    dataRow.push(elem[1]);
            }
            else{
                dataRow = [elem[0]];
                for (i = 1; i < position; i++) { 
                    dataRow.push(null);
                }
                dataRow.push(elem[1]);
                resultData.push(dataRow);
            }

        });

        resultData.forEach(function(elem){
            var dataRow = $scope.getDataRow(newData, elem[0]);
            if(dataRow.length == 0){
                elem.push(null);
            }
        });

    }

    $scope.getDataRow = function (data, key){
        var result = [];
        var found = false
        data.forEach(function(elem){
            var date1 = new Date(key).getTime();
            var date2 = new Date(elem[0]).getTime();
            if((key == 'date' && elem[0] == 'date' || date1 == date2) && !found){
                result = elem;
                found = true;
            }
        })

        return result;
    }

    $scope.addTempDevice = function(){
        var currentDevice = {
                id: $scope.widget.deviceId
        };

        $scope.tempDeviceList.push(currentDevice);
    }

    $scope.apply = function(){
        $scope.widget.deviceList = $scope.tempDeviceList;
        $scope.widget.chartObject.data = [];
        
        $scope.widget.deviceList.forEach(function(device){
            $scope.addDevice(device.id);
        });

        $scope.confirm({
            'newWidget' : $scope.widget,
            'title' : $scope.$parent.$parent.widget.title
        });
    }

    // ------------------ Begining -----------------

    if(!$scope.widget.refreshed){
        $scope.refreshFromDevice();
    } 

    // ------------- Watchers ---------------------

    angular.element($window).on('resize',function(){
        console.log("angular elem resize line");
      $scope.widget.resize=true;
    });

    $scope.$watch('widget.resize',function(){
        console.log("lineChart resize");
        $scope.isChart = false;
        setTimeout(function(){
            if($scope.widget.resize == true){
                $scope.isChart = true;
                $scope.widget.resize=false;
            }
            
        }, 2000);
    });

});
