app.directive( 'multiView', function (DTOptionsBuilder, DTColumnBuilder, $q, $compile, ViewDataSource, ListViewService, $cacheFactory, $filter) {
return {
    restrict: 'E',
    scope: {
        options:'=options'
    },
    templateUrl: 'generic/multiView/multiView.pug',
    controller: function ($scope) {
        var _enableCache = !!$scope.options.cache;

        var _viewDS = new ViewDataSource({
            rawData: $scope.options.data,
            topTierBO: $scope.options.topTierBO,
            mode: 'multi-view',
            boMeta: $scope.options.treeView.boMeta,
            tvMode: 'groups'
        });

        if (_enableCache) {
            var cacheToken = $scope.options.general.pageId + 'multiView';
            var _cache = $cacheFactory.get(cacheToken) ||  $cacheFactory(cacheToken);
            if (!_cache.get('editItem')) {
                _cache.put('editItem', null);
            }
        }
        
        var applySearchFilter = function (searchText) {
            if ($scope.general.activeView === 'list' && $scope.listView.dtInstance) {
                $scope.listView.dtInstance.DataTable.search(searchText).draw();
            } else {
                $(_viewDS.getTreeViewSelector()).jstree('search', searchText, true, true)
            }
        }

        $scope.searchText = '';
        $scope.fileUploadQuee = [];
        $scope.$watch('searchText', function (newValue, oldValue) {
            applySearchFilter(newValue);
        });

        _viewDS.events.addListener('data_updated', function () {
            $scope.actions.redrawListView();
        });

        _viewDS.events.addListener('change_parent', function (obj, newParent) {            
            if ($scope.options.events.onChangeParent) {
                var result = $scope.options.events.onChangeParent(obj, newParent);
                if (result.then) {
                    result.then(function () {
                        $scope.actions.redrawListView();    
                    });
                } else {
                    $scope.actions.redrawListView();
                }
            } else if ($scope.options.treeView.boMeta[obj.boType].apiService) {
                $scope.options.treeView.boMeta[obj.boType].apiService.save(obj.data);
            }
        });

        $scope.general = {
            title: $scope.options.general.title || $filter('translate')("Missing View Title:AssetManager"),
            titleIcon: $scope.options.general.titleIcon || 'fa fa-question',
            activeView: (_enableCache && _cache.get('activeView')) || ($scope.options.general.activeView || 'list'),
            
            search: '',
            hasSwitchToFV: !!$scope.options.general.switchToFullView,
            activeEditTab: '',
            editTabs: $scope.options.general.editTabs            
        };

        if (!$scope.options.general.fileService) {
            $scope.options.general.fileService = {
                processFileQuee: function () {
                    return $q(function (fulfill, reject) {
                        fulfill();
                    });
                }
            }
        } else if (!$scope.options.general.fileService.processFileQuee) {
            throw "The fileService that was passed to the MultiView is missing the processFileQuee method for uploading files. Please override and add it!";
        }

        $scope.$watch('general.activeView', function (newValue, oldValue) {
            applySearchFilter($scope.searchText);
        }); 

        $scope.topTierBO = $scope.options.topTierBO;

        $scope.listView = {
            dtListOptions: ListViewService.generateListViewOptions(DTOptionsBuilder, $q, _viewDS.getListViewData())
                .withOption('rowCallback', function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                    var $row = $(nRow);
                    $row.unbind('click');
                    $row.on('click', function (event) {
                        var item = angular.copy(_getListItemFromVS(aData._id));
                        $scope.editItem = {
                            _id: item._id,
                            data: item,
                            boType: $scope.topTierBO
                        };
                        
                        $scope.$digest();

                        applySelectRow($row);
                    });
                }),
            dtListColumns: ListViewService.generateListViewCols(DTColumnBuilder, $scope.options.listColumns),
            dtInstance: null,
            dtInstanceCallback: function (dtInstance) {
                $scope.listView.dtInstance = dtInstance;
                $scope.listView.dtInstance.DataTable.on('draw.dt', $scope.actions.compileDataTableHtml);

                // The instance callback is called after the DT has been drawn, which means
                // that we need to attach the event handler and then call it manually
                $scope.actions.compileDataTableHtml();

                if (_enableCache) {
                    $scope.editItem = _cache.get('editItem');
                }
            },
            data: []
        }

        $scope.treeView = {
            options: {
                mode: $scope.options.treeView.mode,
                topTierBO: $scope.topTierBO,
                boMeta: $scope.options.treeView.boMeta,
                viewDS: _viewDS,
                dragAndDrop: $scope.options.treeView.dragAndDrop,
                defaultActions: $scope.options.treeView.defaultActions,
                actionBlacklist: $scope.options.treeView.actionBlacklist
            }
        }

        $scope.actions = {
            addTopEntity: function () {
                if (!$scope.editItem) {
                    $scope.editItem = {
                        boType: $scope.topTierBO,
                        data: {}
                    }
                }                
            },
            toggleColumnPicker: function () {

            },
            editItem: function (item) {
                $scope.editItem = item;
            },
            resolveLVClickHandler: function (id, colName) {
                var callBack = null,
                    item = null,
                    isEdit = false;

                for(var i = 0, len = $scope.options.listColumns.length, cols = $scope.options.listColumns; i < len; i++) {
                    if (cols[i].name === colName) {
                        if (cols[i].isEditCol) {
                            isEdit = true;
                            break;
                        } else if (cols[i].onClick) {
                            callBack = cols[i].onClick;
                            break;
                        } else {
                            throw "The column '" + colName + "'is lacking its onClick handler!";
                        }
                    }
                }

                item = _getListItemFromVS(id);

                if (item) {
                    if (isEdit) {
                        $scope.editItem = {
                            _id: item._id,
                            data: item,
                            boType: $scope.topTierBO
                        };
                    } else if (callBack) {
                        callBack.call($scope, item);
                    }
                } else {
                    throw "The object with id '" + id + " 'was not found in the dataset!";
                }

                return false;
            },
            compileDataTableHtml: function () {
                var elements = angular.element("#" + $scope.listView.dtInstance.id + " .ng-scope");
                angular.forEach(elements, function(element) {
                    $compile(element)($scope)
                });
            },
            resolveEditTabInclude: function () {
                for(var i = 0, len = $scope.general.editTabs.length; i < len; i++) {
                    var tab = $scope.general.editTabs[i]; 
                    if(tab.name === $scope.general.activeEditTab) {
                        return tab.templateUrl;
                    }
                }
            },
            saveEditForm: function () {
                var isEdit = !!$scope.editItem._id;                
                if ($scope.editItem.boType === 'groups') {
                    $scope.options.general.saveGroup($scope.editItem)
                        .then(function (savedItem) {
                            _viewDS.addItem(savedItem, savedItem.parent);
                        });
                } else {
                    $scope.options.general.fileService.processFileQuee($scope.fileUploadQuee)
                        .then(function () {
                            $scope.options.general.saveItem($scope.editItem)
                                .then(function (savedItem) {
                                    if (!savedItem.data || !savedItem.data._id) {
                                        return;
                                    }

                                    if (isEdit) {
                                        _viewDS.updateItem(savedItem);
                                    } else {
                                        _viewDS.addItem(savedItem, savedItem.parent);
                                        $scope.editItem = null;
                                    }                            
                                });
                        })
                        .catch(function (err) {
                            ngNotify.set('Error trying to upload a file! Message:' + getErrorMessage(err), 'error');
                            deferred.reject(err);
                        });
                }

            },
            redrawListView: function () {
                $scope.listView.dtInstance.dataTable.fnClearTable();
                $scope.listView.dtInstance.dataTable.fnAddData(_viewDS.getListViewData());
            },            
            setActiveTab: function (tabName) {
                $scope.general.activeEditTab = tabName;
            },
            getBOEditTabs: function () {
                var result = [];

                if (!$scope.editItem) {
                    return result;
                }

                $scope.general.editTabs.forEach(function (tab) {
                    if(tab.boType === $scope.editItem.boType) {
                        result.push(tab);
                    }
                });

                return result;
            },
            getMultiViewEdit: function () {
                if ($scope.editItem) {
                    return 'generic/multiView/multiViewEdit.pug';
                } else {
                    return null;
                }
            }
        };

        if ($scope.general.hasSwitchToFV) {
            $scope.actions.switchToFullView = function () {
                $scope.options.general.switchToFullView($scope.editItem);
            };
        }

        $scope.saveItem = $scope.actions.saveEditForm;
        $scope.cancelEdit = function () {
            $scope.editItem = null;
        };

        var _watchEditItem = function (newValue, oldValue) {
            if (newValue === null && newValue === oldValue) {
                return;
            }

            if (newValue) {
                var boTabs = [];

                for(var i = 0, len = $scope.general.editTabs.length; i < len; i++) {
                    var tab = $scope.general.editTabs[i];
                    if (tab.boType === $scope.editItem.boType) {
                        if(tab.primary) {
                            $scope.general.activeEditTab = tab.name;

                            if (_enableCache) {
                                _cache.put('editItem', newValue);
                            }
                            return;
                        } else {
                            boTabs.push(tab);
                        }
                    }
                }

                //In case no tab was specified as primary we make the first for this boType to be
                if(boTabs.length > 0) {
                    $scope.general.activeEditTab = boTabs[0].name;
                }
            }

            if (_enableCache) {
                _cache.put('editItem', newValue);
            }
        };

        var _getListItemFromVS = function (id) {
            for(var i = 0, len = _viewDS.getListViewData().length, data = _viewDS.getListViewData(); i < len; i++) {
                if (data[i]._id == id) {
                    return data[i];
                }                
            }
        }

        var _updateState = function () {
            
        }

        var applySelectRow = function ($row) {
            $row.parent().find('.active').removeClass('active');
            $row.addClass('active');
        }


        $scope.updateItem = function (item) {
            $scope.editItem = item;
            $scope.$digest();
        }

        $scope.$watch('general.activeView', function (newValue, oldValue) {
            $scope.currentEditForm = null;
            $scope.editItem = null;
            if (_enableCache) {
                _cache.put('activeView', newValue);
            }
        });

        $scope.$watch('editItem', _watchEditItem);
    }
};
});
