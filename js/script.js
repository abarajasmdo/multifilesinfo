var scriptApp = angular.module('scriptApp',['lr.upload']);

scriptApp.filter('isEmpty', function () {
        var bar;
        return function (obj) {
            for (bar in obj) {
                if (obj.hasOwnProperty(bar)) {
                    return false;
                }
            }
            return true;
        };
    });

scriptApp.controller('scriptController',function($scope,$http){

  const fs = require('fs');

  function initCtrl() {
    $('#graphic0').hide();
    $('#graphic1').hide();
    $('#graphic1buttons').hide();
    $('#buttons').hide();
    $('#table1').hide();
    $('#table2').hide();
    $('#summaryNuts').hide();

    $scope.indProject();

    $scope.fileNames = [];
    $scope.infoFiles = [];
    $scope.pathinfo = "";
    $scope.projectName ='';

    $scope.seating = [];
    $scope.unseating = [];
    $scope.tableData = {};
    $scope.keysData = [];

    $scope.slopeData = [];

    $scope.graphTitle="";
    $scope.graphData = [];
    $scope.plotCategories = null;
    $scope.labels=[];
  };

  function openSpinner() {
    $('#buttons').hide();
    $('#loadingModal').modal({
      backdrop: "static",
      keyboard: false
    });
  };

  function addInfoToProject() {
    folders=$scope.pathinfo.split("\\");
    id=folders[folders.length-2];
    $scope.projectName=folders[folders.length-3];
    $scope.project[id] = {};
    $scope.project[id].nutid = id;
    $scope.project[id].pathinfo = $scope.pathinfo;
    $scope.project[id].tableData = $scope.tableData;
    $scope.project[id].seating = $scope.seating;
    $scope.project[id].unseating = $scope.unseating;
  };

  function closeSpinner() {
    $(document).ready(function(){
      $('#loadingModal').modal("hide");
      $('#buttons').show();
    });
    $(document).ready(function(){
      $scope.saveProject();
      $scope.$apply();
    });
  };

  function getPathFromText(texto) {
    a=texto.split('\\');
    return texto.replace(a[a.length-1],'');
  };

  function getUnseatingValues(a) {
    aa={};
    angles={};
    // Get Variables **** Unseating Torque
    aa["Unseating Torque Raw"] = Math.min.apply(Math,a["Torque"]);
    indexval=a["Torque"].indexOf(aa["Unseating Torque Raw"]);
    aa["Unseating Torque Angle"] = a["Angle 1"][indexval];
    aa["Unseating Torque"] = Math.abs(aa["Unseating Torque Raw"]);
    // Get Variables **** Breakaway Torque
    torquebyeachangle=simplifyData(a["Angle 1"].slice(indexval),a["Torque"].slice(indexval),"min");
    limit1=a["Angle 1"].indexOf(Number(a["Angle 1"][indexval])+firstSlopeChange(slopeAnalysis(torquebyeachangle,0.5),torquebyeachangle));
    limit2=a["Angle 1"].indexOf(Number(a["Angle 1"][limit1])+90);
    angles.Breakaway=[a["Angle 1"][limit1],a["Angle 1"][limit2]];
    torquetoreduce=a["Torque"].slice(limit1,limit2);
    angletoreduce=a["Angle 1"].slice(limit1,limit2);
    aa["Breakaway Torque Raw"] = Math.min.apply(Math,torquetoreduce);
    indexval=torquetoreduce.indexOf(aa["Breakaway Torque Raw"]);
    aa["Breakaway Torque Angle"] = angletoreduce[indexval];
    aa["Breakaway Torque"] = Math.abs(aa["Breakaway Torque Raw"]);
    // Get Variables **** Removal Torque
    torquetoreduce=a["Torque"].slice(limit2 - 1);
    angletoreduce=a["Angle 1"].slice(limit2 - 1);
    aa["Removal Torque Raw"] = Math.min.apply(Math,torquetoreduce);
    aa["Removal Torque"] = Math.abs(aa["Removal Torque Raw"]);
    indexval=torquetoreduce.indexOf(aa["Removal Torque Raw"]);
    aa["Removal Torque Angle"] = angletoreduce[indexval];
    angles.Removal=[a["Angle 1"][limit2],"END"];
    // Get Variables **** Prevailing Torque
    limit1=a["Angle 1"].indexOf(360);
    limit2=a["Angle 1"].indexOf(720);
    angles.Prevailing=[a["Angle 1"][limit1],a["Angle 1"][limit2]];
    torquetoreduce=a["Torque"].slice(limit1 - 1,limit2);
    aa["Prevailing Torque Raw"] = sumArrayVals(torquetoreduce) / torquetoreduce.length;
    aa["Prevailing Torque"] = Math.abs(aa["Prevailing Torque Raw"]);
    aa["Prevailing Torque Angle"] = 540;
    // Return Values in Data form for Graphs
    bb={};
    bb["Unseating Torque"] = [aa["Unseating Torque Angle"],aa["Unseating Torque"],aa["Unseating Torque Raw"]];
    bb["Breakaway Torque"] = [aa["Breakaway Torque Angle"],aa["Breakaway Torque"],aa["Breakaway Torque Raw"]];
    bb["Prevailing Torque"] = [aa["Prevailing Torque Angle"],aa["Prevailing Torque"],aa["Prevailing Torque Raw"]];
    bb["Removal Torque"] = [aa["Removal Torque Angle"],aa["Removal Torque"],aa["Removal Torque Raw"]];
    bb["Unseating Angles"]=angles;
    return bb;
  };

  function getSeatingValues(a) {
    aa={};
    angles={};
    // Get Variables **** Seating Torque
    aa["Seating Torque"] = Math.max.apply(Math,a["Torque"]);
    indexval=a["Torque"].indexOf(aa["Seating Torque"]);
    aa["Seating Torque Angle"] = a["Angle 1"][indexval];
    // Get Variables **** Installation Torque
    torquebyeachangle=simplifyData(a["Angle 1"].slice(0,indexval),a["Torque"].slice(0,indexval));
    indexval=lastSlopeChange(slopeAnalysis(torquebyeachangle,0.5),torquebyeachangle);
    limit1=a["Angle 1"].indexOf(indexval);
    angles.Installation=["BEGIN",a["Angle 1"][limit1]];
    torquetoreduce=a["Torque"].slice(0,limit1 - 20);
    angletoreduce=a["Angle 1"].slice(0,limit1 - 20);
    aa["Installation Torque"] = Math.max.apply(Math,torquetoreduce);
    indexval=torquetoreduce.indexOf(aa["Installation Torque"]);
    aa["Installation Torque Angle"] = angletoreduce[indexval];
    // Return Values in Data form for Graphs
    bb={};
    bb["Seating Torque"] = [aa["Seating Torque Angle"],aa["Seating Torque"]];
    bb["Installation Torque"] = [aa["Installation Torque Angle"],aa["Installation Torque"]];
    bb["Seating Angles"]=angles;
    bb["Slope Analysis"]=$scope.slopeData;
    $scope.slopeData=[];
    return bb;
  };

  function getIndexSeating(a) {
    for (var index in $scope.seating) {
      if ($scope.seating[index]["Title"]==$scope.keysData[a]) {
        break;
      }
    }
    return index;
  };

  function getIndexUnseating(a) {
    for (var index in $scope.seating) {
      if ($scope.unseating[index]["Title"]==$scope.keysData[a]) {
        break;
      }
    }
    return index;
  };

  function transpose(a){
    return a[0].map(function (_, c) { return a.map(function (r) { return r[c]; }); });
  };

  function filterNaN(arr) {
    var filteredArray = arr.filter(isNumber);
    return filteredArray;
  };

  function isNumber(value) {
    return !(isNaN(value));
  };

  function movavg(a) {
    b=[];
    for (var i = 1; i < a.length; i++) {
      b.push((a[i]+a[i-1])/2);
    }
    return b;
  };

  function quartile(a,p) {
    a.sort((a, b) => a - b);
    lowMiddle = Math.floor((a.length - 1) * p);
    highMiddle = Math.ceil((a.length - 1) * p);
    console.log(a[lowMiddle], a[highMiddle]);
    return ((a[lowMiddle] + a[highMiddle]) / 2);
  }

  function fixCycle(value) {
    if (value < 10) {
      return "0" + String(value);
    } else {
      return String(value);
    }
  };

  function createData(x_data,y_data){
    var lineData = [];
    var coord = []
    for (var i=0; i < x_data.length; i++){
      coord.push(x_data[i]);
      coord.push(y_data[i]);
      lineData.push(coord);
      coord = [];
    }
    return lineData;
  };

  function simplifyData(x_data,y_data,func){
    if (func == undefined) { func = "max" };
    var lineData = [];
    var infoToAnalyze = [];
    max_x = Math.ceil(Math.max.apply(Math,x_data));
    for (var i=1; i < max_x; i++){
      infoToAnalyze=y_data.slice(x_data.indexOf(i-1),x_data.indexOf(i));
      if (infoToAnalyze.length > 0) {
        if (func == "max") {
          lineData.push(Math.max.apply(Math,infoToAnalyze));
        } else {
          lineData.push(Math.min.apply(Math,infoToAnalyze));
        }
      } else {
        lineData.push();
      }
    }
    return lineData;
  };

  function simplifyArray(x_data,y_data,func){
    if (func == undefined) { func = "max" };
    var lineData = [];
    max_x = Math.ceil(Math.max.apply(Math,x_data));
    for (var i=1; i < max_x; i++){
      if (func == "max") {
        lineData.push([i,Math.max.apply(Math,y_data.slice(x_data.indexOf(i-1),x_data.indexOf(i)))]);
      } else {
        lineData.push([i,Math.min.apply(Math,y_data.slice(x_data.indexOf(i-1),x_data.indexOf(i)))]);
      }
    }
    return lineData;
  };

  function slopeAnalysis(x_data,slopeRange){
    var lineData = [];
    for (var i=1; i < x_data.length; i++){
      if (x_data[i] > (x_data[i-1] - (slopeRange / 2)) && x_data[i] < (x_data[i-1] + (slopeRange / 2))) {
        lineData.push(0);
      } else if (x_data[i] > x_data[i-1]) {
        lineData.push(1);
      } else {
        lineData.push(-1);
      }
    }
    return lineData;
  };

  function getselecteditem(array,value) {
    selection=[];
    for (var i=0; i < array.length; i++){
      if (array[i][1] == value) {
        selection=array[i];
      }
    };
    return selection;
  };

  function lastSlopeChange(x_data,y_data){
    var maxValue = Math.max.apply(Math,y_data);
    var maxDelta = maxValue*0.01;
    var lastIndex = [];
    var indexData = x_data.length-1;
    for (var i=1; i < x_data.length; i++){
      if (x_data[i] == 1 && x_data[i-1] == -1 ) {
        lastIndex.push([y_data[i-1],i-1]);
        if (lastIndex.length > 1 && lastIndex[lastIndex.length-1][0] < maxValue && (lastIndex[lastIndex.length-1][0] - lastIndex[lastIndex.length-2][0]) < maxDelta) {
          indexData = i-1;
        }
      };
    }
    $scope.slopeData=lastIndex;
    return indexData;
  };

  function firstSlopeChange(x_data,y_data){
    var minValue = Math.min.apply(Math,y_data);
    var indexData = x_data.length-1;
    for (var i=1; i < x_data.length; i++){
      if (x_data[i] == 1 && x_data[i+1] == -1 ) {
        if (y_data[i] > (minValue/2)) {
          indexData = i-1;
          break;
        };
      };
    }
    return indexData;
  };

  function extend(obj, src) {
    Object.keys(src).forEach(function(key) { obj[key] = src[key]; });
    return obj;
  };

  function isOdd(num) { return num % 2;};

  function sumArrayVals(array){ return (array.reduce(function(a,b) { return a + b;}));};

  function tableButtons() {
    $("table").tableExport(), {
      bootstrap: true,
      formats: ['xls', 'csv', 'txt'],
    };
    $("table").tableExport().reset();
  };

  $scope.roundData = function(val) {
      if (isNumber(val)) {
          updatedval=(Math.round(val*1000000)/1000000).toFixed(2);
      } else {
          updatedval=val;
      }
      return updatedval
  };

  $scope.readAddFile = function(file) {
    var fileName = file;
    $scope.fileNames.push(file);
    var fileMatrix = new Array();
    var transMatrix;
    var genInfo = "";
    var doc="";
    var extras = {};
    fs.readFile(file, 'utf-8', (err, data) => {
      if(err){
        alert("An error ocurred reading the file :" + err.message)
        return
      };
      var lines = data.replace("Torque;","Torque1;").split(/[\r\n]+/g);
      for(var line = 0; line < lines.length; line++){
        if(line >= 2 && lines[line].length != 0){
          var columns = lines[line].split(/[;]+/g);
          if(line < 3){
            genTitle = columns;
          }else if(line < 4){
            genUnits = columns;
          }else {
            for (i = 0; i < columns.length; i++){
              columns[i] = Number(columns[i]);
            }
            fileMatrix.push(columns);
          }
        }
      }
      transMatrix = transpose(fileMatrix);
      fl = {};
      fl ["fileName"] = fileName.replace($scope.pathinfo,"");
      i = 0;
      for (var title in genTitle) {
        fl [genTitle[title]] = filterNaN(transMatrix[i]);
        i = i + 1;
      };
      fl["Torque"] = fl["Torque1"].map(function(x) { return (x * 8.8507457673787); });
      infofn=fileName.split("_");
      filenum=Number(infofn[infofn.length-1].split(".")[0])
      if (isOdd(filenum)) {
        fl ["Title"] = "Cycle " + fixCycle((filenum + 1)/2);
        //fl ["Analysis Summary"] = getSeatingValues(fl);
        fl ["Chart Data"] = simplifyArray(fl["Angle 1"],fl["Torque"]);
        $scope.seating.push(fl);
        if (typeof $scope.tableData["Cycle " + fixCycle((filenum + 1)/2)] == "undefined") {
          $scope.tableData["Cycle " + fixCycle((filenum + 1)/2)] = {};
        };
        $scope.tableData["Cycle " + fixCycle((filenum + 1)/2)] = extend($scope.tableData["Cycle " + fixCycle((filenum + 1)/2)],getSeatingValues(fl));
      } else {
        fl ["Title"] = "Cycle " + fixCycle((filenum)/2);
        //fl ["Analysis Summary"] = getUnseatingValues(fl);
        fl ["Chart Data"] = simplifyArray(fl["Angle 1"],fl["Torque"],"min");
        $scope.unseating.push(fl);
        if (typeof $scope.tableData["Cycle " + fixCycle((filenum)/2)] == "undefined") {
          $scope.tableData["Cycle " + fixCycle((filenum)/2)] = {};
        };
        $scope.tableData["Cycle " + fixCycle((filenum)/2)] = extend($scope.tableData["Cycle " + fixCycle((filenum)/2)],getUnseatingValues(fl));
      }
      delete fl["Time"];
      delete fl["RPM1"];
      delete fl["Torque1"];
      $scope.infoFiles.push(fl);
    })
  };

  $scope.addMultFiles = function(files){
    initCtrl();
    $scope.pathinfo = String(getPathFromText(files[0]));
    $('#disabledPathName').val($scope.pathinfo);
    $scope.infoFiles = [];
    $scope.tableData = {};
    $scope.keysData = [];
    $scope.seating = [];
    $scope.unseating = [];
    for(var i = 0; i < files.length; i++){
      $scope.readAddFile(files[i]);
    };
  };

  $scope.getFiles = function() {
    const {dialog} = require('electron').remote;
    dialog.showOpenDialog({
      properties: ['openFile','multiSelections'],
      filters: [
        {name: 'Text File', extensions: ['txt']},
        {name: 'All Files', extensions: ['*']}
      ]
    },function(fileNames){
      if(fileNames){
        openSpinner();
        $scope.addMultFiles(fileNames);
        closeSpinner();
      }else {
        console.log("No files selected");
      }
    });
  };

  $scope.genTable = function(val) {
    $scope.keysData=Object.keys($scope.tableData).sort();
    $('#graphic0').hide();
    $('#graphic1').hide();
    $('#graphic1buttons').hide();
    $('#table1').hide();
    $('#table2').hide();
    $('#genTable' + String(val)).addClass('active');
    $('#genTable' + String(val)).siblings().removeClass('active');
    //$scope.$apply();
    if (val == 0) {
      $('#table1').show();
    } else {
      $('#table2').show();
    };
    tableButtons();
  };

  $scope.genChart = function (val) {
    $('#graphic0').show();
    $('#genChart' + val).addClass('active');
    $('#genChart' + val).siblings().removeClass('active');
    $('#graphic1').hide();
    $('#graphic1buttons').hide();
    $('#table1').hide();
    $('#table2').hide();
    $scope.graphData=[];
    $scope.plotBand=[];
    $scope.labels=[];
    $scope.graphTitle="";
    $scope.tooltipText="Angle: {point.x:.2f} °";
    $scope.legendEnabled=true;
    if (val==0) {
      $scope.graphTitle="Seating Information";
      for (var data in $scope.seating) {
        $scope.graphData[data]={};
        $scope.graphData[data].name = $scope.seating[data]["Title"];
        $scope.graphData[data].data = $scope.seating[data]["Chart Data"];
      };
    } else {
      $scope.graphTitle="Unseating Information";
      for (var data in $scope.unseating) {
        $scope.graphData[data]={};
        $scope.graphData[data].name = $scope.unseating[data]["Title"];
        $scope.graphData[data].data = $scope.unseating[data]["Chart Data"];
      };
    };
    $scope.plotChart(0);
  };

  $scope.genPlot = function (val) {
    $scope.keysData=Object.keys($scope.tableData).sort();
    $('#graphic1').show();
    $('#graphic1buttons').show();
    $('#genPlot' + String(val)).siblings().removeClass('active');
    $('#genPlot' + String(val)).addClass('active');
    $('#graphic0').hide();
    $('#table1').hide();
    $('#table2').hide();
    $scope.plotval=val;
    $scope.switchCycle(0);
    $('#cyclePlot' + String(0)).siblings().removeClass('active');
    $('#cyclePlot' + String(0)).addClass('active');
    $scope.plotChart(1);
  };

  $scope.plotChart = function (val) {
    $('#graphic'+String(val)).highcharts({
      chart: {
        animation:false,
        zoomType:'x'
      },
      title: {
        text: $scope.graphTitle
      },
      subtitle: {
        text: 'Source: ' + $scope.pathinfo
      },
      xAxis: {
        title: {
          text: $scope.plotxTitle
        },
        plotBands: $scope.plotBand,
        categories: $scope.plotCategories
      },
      yAxis: {
        title: {
          text: 'Lb-in'
        },
      },
      legend: {
        enabled:$scope.legendEnabled
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: $scope.tooltipText + '<br>Torque: {point.y:.2f} lb-in<br>',
        shared: false,
        useHTML: true
      },
      series: $scope.graphData,
    });
  };

  $scope.switchCycle = function (val) {
    $scope.graphData=[];
    $scope.plotBand=[];
    $scope.labels=[];
    $scope.graphTitle="";
    $scope.editButton="";
    $scope.cycleval=val;
    $scope.tooltipText="Angle: {point.x:.2f} °";
    $scope.plotxTitle="Angle [°]";
    if ($scope.plotval==0) {
      $scope.editButton="Edit Installation Area";
      index=getIndexSeating(val);
      $scope.items=$scope.tableData[$scope.seating[index]["Title"]]["Slope Analysis"];
      $scope.selected=getselecteditem($scope.items,$scope.tableData[$scope.seating[index]["Title"]]["Seating Angles"]["Installation"][1]);
      $scope.graphTitle="Seating Information for "+$scope.seating[index]["Title"];
      $scope.graphData[0]={};
      $scope.graphData[0].name = $scope.seating[index]["Title"];
      $scope.graphData[0].data = createData($scope.seating[index]["Angle 1"],$scope.seating[index]["Torque"]);
      $scope.graphData[0].marker= {enabled: false};
      $scope.plotBand[0]={
        from:0,
        to:$scope.tableData[$scope.seating[index]["Title"]]["Seating Angles"]["Installation"][1],
        color:'#EFFFFF',
        label:{
          text: "Installation Area"
        }
      };
      $scope.graphData[1]={
        type: 'flags',
        name: 'Installation Torque',
        color: '#333333',
        shape: 'squarepin',
        data: [{
          x: $scope.tableData[$scope.seating[index]["Title"]]["Installation Torque"][0],
          y: $scope.tableData[$scope.seating[index]["Title"]]["Installation Torque"][1],
          text: 'Highcharts Cloud Beta', title: 'Installation Torque', shape: 'squarepin'
        }],
        showInLegend: false
      };
      $scope.graphData[2]={
        type: 'flags',
        name: 'Seating Torque',
        color: '#333333',
        shape: 'squarepin',
        data: [{
          x: $scope.tableData[$scope.seating[index]["Title"]]["Seating Torque"][0],
          y: $scope.tableData[$scope.seating[index]["Title"]]["Seating Torque"][1],
          text: 'Highcharts Cloud Beta', title: 'Seating Torque', shape: 'squarepin'
        }],
        showInLegend: false
      };
    } else {
      $scope.editButton="Edit Breakaway Area";
      index=getIndexUnseating(val);
      $scope.graphTitle="Unseating Information for " + $scope.unseating[index]["Title"];
      $scope.graphData[0]={};
      $scope.graphData[0].name = $scope.unseating[index]["Title"];
      $scope.graphData[0].data = createData($scope.unseating[index]["Angle 1"],$scope.unseating[index]["Torque"]);
      $scope.graphData[0].marker= {enabled: false};
      $scope.plotBand[0]={
        from:$scope.tableData[$scope.unseating[index]["Title"]]["Unseating Angles"]["Breakaway"][0],
        to:$scope.tableData[$scope.unseating[index]["Title"]]["Unseating Angles"]["Breakaway"][1],
        color:'#EFFFFF',
        label:{
          text: "Breakaway Area"
        }
      };
      $scope.graphData[1]={
        type: 'flags',
        name: 'Breakaway Torque',
        color: '#333333',
        shape: 'squarepin',
        data: [{
          x: $scope.tableData[$scope.unseating[index]["Title"]]["Breakaway Torque"][0],
          y: $scope.tableData[$scope.unseating[index]["Title"]]["Breakaway Torque"][2],
          text: 'Highcharts Cloud Beta', title: 'Breakaway Torque', shape: 'squarepin'
        }],
        showInLegend: false
      };
      $scope.plotBand[1]={
        from:$scope.tableData[$scope.unseating[index]["Title"]]["Unseating Angles"]["Removal"][0],
        to:Math.max.apply(Math,$scope.unseating[index]["Angle 1"]),
        color:'#f4ffdf',
        label:{
          text: "Removal Area"
        }
      };
      $scope.graphData[2]={
        type: 'flags',
        name: 'Removal Torque',
        color: '#333333',
        shape: 'squarepin',
        data: [{
          x: $scope.tableData[$scope.unseating[index]["Title"]]["Removal Torque"][0],
          y: $scope.tableData[$scope.unseating[index]["Title"]]["Removal Torque"][2],
          text: 'Highcharts Cloud Beta', title: 'Removal Torque', shape: 'squarepin'
        }],
        showInLegend: false
      };
      $scope.plotBand[2]={
        from:360,
        to:720,
        color:'#fff4df',
        label:{
          text: "Prevailing Area"
        }
      };
      $scope.graphData[3]={
        type: 'flags',
        name: 'Prevailing Torque',
        color: '#333333',
        shape: 'squarepin',
        data: [{
          x: $scope.tableData[$scope.unseating[index]["Title"]]["Prevailing Torque"][0],
          y: $scope.tableData[$scope.unseating[index]["Title"]]["Prevailing Torque"][2],
          text: 'Highcharts Cloud Beta', title: 'Prevailing Torque', shape: 'squarepin'
        }],
        showInLegend: false
      };
      $scope.graphData[4]={
        type: 'flags',
        name: 'Unseating Torque',
        color: '#333333',
        shape: 'squarepin',
        data: [{
          x: $scope.tableData[$scope.unseating[index]["Title"]]["Unseating Torque"][0],
          y: $scope.tableData[$scope.unseating[index]["Title"]]["Unseating Torque"][2],
          text: 'Highcharts Cloud Beta', title: 'Unseating Torque', shape: 'squarepin'
        }],
        showInLegend: false
      };
    };
    $scope.plotChart(1);
    $('#cyclePlot' + String(val)).siblings().removeClass('active');
    $('#cyclePlot' + String(val)).addClass('active');
  };

  $scope.newProject = function () {
    $scope.project={};
    $('#disabledPathName').val("");
    initCtrl();
  };

  $scope.loadProject = function () {
    initCtrl();
    openSpinner();
    const {dialog} = require('electron').remote;
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {name: 'Object', extensions: ['json']},
        {name: 'All Files', extensions: ['*']}
      ]
    },function(fileName){
      if(fileName){
        fs.readFile(fileName[0], 'utf-8', (err, data) => {
          if(err){
            alert("An error ocurred reading the file :" + err.message)
            return
          };
          $scope.project = JSON.parse(data);
          closeSpinner();
          $scope.$apply();
        });
      } else {
        console.log("No file selected");
        $('#loadingModal').modal("hide");
      };
    });
  };

  $scope.saveProject = function () {
    if ($scope.pathinfo == "") {
      keysLabel=[];
      keysLabel=Object.keys($scope.project);
      $scope.switchNut($scope.project[keysLabel[0]],0);
    } else {
      addInfoToProject();
    };
  };

  $scope.saveAsProject = function () {
    $scope.saveProject();
    var json = JSON.stringify($scope.project);
    const {dialog} = require('electron').remote;
    dialog.showSaveDialog({
      defaultPath:$scope.projectName.replace(" ","_"),
      filters: [
        {name: 'Object', extensions: ['json']},
        {name: 'All Files', extensions: ['*']}
      ]
    },function(fileName){
      if(fileName){
        fs.writeFile(fileName, json, 'utf8', (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
        });
      }else {
        console.log("No file selected");
      }
    });
  };

  $scope.switchNut = function (nut,index) {
    initCtrl();
    closeSpinner();
    $('#genTable0').siblings().removeClass('active');
    $('#genTable0').addClass('active');
    $('#nutButton'+index).siblings().removeClass('active');
    $('#nutButton'+index).addClass('active');
    $('#disabledPathName').val(nut.pathinfo);
    $scope.pathinfo = nut.pathinfo;
    $scope.tableData = nut.tableData;
    $scope.seating = nut.seating;
    $scope.unseating = nut.unseating;
    $scope.keysData=Object.keys($scope.tableData).sort();
    $scope.totalColumns=[];
    for (var i = 0; i < $scope.keysData.length; i++) {
      $scope.totalColumns.push("Installation\n[lb-in]");
      $scope.totalColumns.push("Breakaway\n[lb-in]");
      $scope.totalColumns.push("Removal\n[lb-in]");
    };
    $scope.genTable(0);
  };

  $scope.sumProject = function () {
    if ($scope.projectName == '') {
      alert("Not able to open this function.\n\nPlease add files or open a projet first.")
    } else {
      $scope.idName='Installation Torque';
      $scope.colSpanVal=$scope.keysData.length + 1;
      tableButtons();
      $scope.genSumPlotData();
      $('#individualNut').hide();
      $('#summaryNuts').show();
      $('#tableSummary').hide();
      $('#infoButtons').hide();
      $('#installationTable').siblings().removeClass('active');
      $('#installationTable').addClass('active');
      $scope.genSumTable();
    }
  };

  $scope.indProject = function () {
    $('#individualNut').show();
    $('#summaryNuts').hide();
  };

  $scope.genSumTable = function () {
    $('#tableSummary').show();
    $('#infoButtons').show();
    $('#graphic2').hide();
    $('#genSumTable').siblings().removeClass('active');
    $('#genSumTable').addClass('active');
  };

  $scope.activeClass = function (idName) {
    $('#' + idName).addClass('active');
    $('#' + idName).siblings().removeClass('active');
  };

  $scope.genSumPlot = function () {
    $('#genSumPlot').siblings().removeClass('active');
    $('#genSumPlot').addClass('active');
    $('#graphic2').siblings().hide();
    $('#graphic2').show();
    $('#summaryNuts').show();
    $('#tableSummary').hide();
    $('#infoButtons').show();
    $scope.genSumPlotData();
    $scope.plotChart(2);
  };

  $scope.switchSumPlotData = function (idName,idTitle) {
    $scope.idName=idName;
    $('#'+idTitle).siblings().removeClass('active');
    $('#'+idTitle).addClass('active');
    $scope.genSumPlotData();
    $scope.plotChart(2);
  };

  $scope.genSumPlotData = function () {
    $scope.graphData=[];
    $scope.plotxTitle="Cycles";
    foldersNames=$scope.pathinfo.split("\\");
    lastFolderName=foldersNames[foldersNames.length - 2];
    $scope.pathinfo=$scope.pathinfo.replace(lastFolderName+"\\","");
    $scope.graphTitle=$scope.idName;
    $scope.tooltipText="Cycle: {point.x:.0f}";
    $scope.legendEnabled=true;
    $scope.plotCategories=[];
    for (var i = 0; i < $scope.keysData.length; i++) {
      $scope.plotCategories.push($scope.keysData[i]);
    };
    nutInfo=[];
    nutInfo=Object.keys($scope.project);
    for (var i = 0; i < nutInfo.length; i++) {
      $scope.graphData[i]={};
      $scope.graphData[i].name = nutInfo[i];
      $scope.graphData[i].data=[];
      for (var j = 0; j < $scope.keysData.length; j++) {
        $scope.graphData[i].data.push($scope.project[nutInfo[i]].tableData[$scope.keysData[j]][$scope.idName][1]);
      };
    };
  };

  $scope.newProject();

});
