app.controller('areaCtrl',function($scope){

    if(!$scope.widget.chartObject){
        $scope.widget.isChart = true;
        $scope.widget.chartObject = {
            "type": "AreaChart",
                "displayed": false,
                "data": {
                "cols": [
                    {
                        "id": "month",
                        "label": "Month",
                        "type": "string",
                        "p": {}
                    },
                    {
                        "id": "laptop-id",
                        "label": "Laptop",
                        "type": "number",
                        "p": {}
                    },
                    {
                        "id": "desktop-id",
                        "label": "Desktop",
                        "type": "number",
                        "p": {}
                    },
                    {
                        "id": "server-id",
                        "label": "Server",
                        "type": "number",
                        "p": {}
                    },
                    {
                        "id": "cost-id",
                        "label": "Shipping",
                        "type": "number"
                    }
                ],
            "rows": [
            {
              "c": [
                {
                  "v": "January"
                },
                {
                  "v": 19,
                  "f": "42 items"
                },
                {
                  "v": 12,
                  "f": "Ony 12 items"
                },
                {
                  "v": 7,
                  "f": "7 servers"
                },
                {
                  "v": 4
                }
              ]
            },
            {
              "c": [
                {
                  "v": "February"
                },
                {
                  "v": 13
                },
                {
                  "v": 1,
                  "f": "1 unit (Out of stock this month)"
                },
                {
                  "v": 12
                },
                {
                  "v": 2
                }
              ]
            },
            {
              "c": [
                {
                  "v": "March"
                },
                {
                  "v": 24
                },
                {
                  "v": 5
                },
                {
                  "v": 11
                },
                {
                  "v": 6
                }
              ]
            }
          ]
        },
            "options": {
                "title": "Sales per month",
                "isStacked": "true",
                "fill": 20,
                "displayExactValues": true,
                "vAxis": {
                    "title": "Sales unit",
                    "gridlines": {
                        "count": 10
                    }
                },
                "hAxis": {
                    "title": "Date"
                }
            },
            "formatters": {}
        }
   
    }
});