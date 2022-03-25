let BUY = 1
let SELL = 0
let CE_TYPE = 1
let PE_TYPE = 0

function strategyCal(UV, SS, SED, opStArr) {
  let automaticCalStrategy = false
  let OptimizeChart = webix.storage.local.get('OptimizeChart')
  if(!OptimizeChart) {
    OptimizeChart = {
      optimizeChart : 1
    }
    webix.storage.local.put('OptimizeChart', OptimizeChart)
  }
  let SelectedScript = '', Underlying_Value = '', SelectedExpiryDate = '';
  // [Strike Price, Bid Price, Ask Price, Volumn, OI, IV]
  let PE = []
  let CE = []
  let PE_OTM = []
  let PE_ITM = []
  let CE_OTM = []
  let CE_ITM = []
  let rowIndex = 1
  let closest = 0
  let IV = 0
  let supportResShowId = 1

  function buyCall(strikePrice, premium, expiryStrikePrice) {
      if (strikePrice >= expiryStrikePrice) {
        return -premium;
      } else {
        return parseFloat(expiryStrikePrice - strikePrice - premium).toFixed(2);
      }
  }
  function sellCall(strikePrice, premium, expiryStrikePrice) {
  if (expiryStrikePrice <= strikePrice) {
      return premium;
  } else {
      return parseFloat(premium - (expiryStrikePrice - strikePrice)).toFixed(2);
  }
  }
  function buyPut(strikePrice, premium, expiryStrikePrice) {
  if (strikePrice <= expiryStrikePrice) {
      return -premium;
  } else {
      return parseFloat((strikePrice - expiryStrikePrice) - premium).toFixed(2);
  }
  }
  function sellPut(strikePrice, premium, expiryStrikePrice) {
  if (expiryStrikePrice >= strikePrice) {
      return premium;
  } else {
      return parseFloat((expiryStrikePrice - strikePrice) + premium).toFixed(2);
  }
  }
  function buyStock(stockPrice, expiryStrikePrice) {
    return parseFloat(expiryStrikePrice - stockPrice).toFixed(2);
  }
  function sellStock(stockPrice, expiryStrikePrice) {
    return parseFloat(stockPrice - expiryStrikePrice).toFixed(2);
  }
  function prepareStrikeWithPremium() {
  
      // [Strike Price, Bid Price, Ask Price, Volumn, OI, IV]
      PE_OTM = []
      PE_ITM = []
    
      CE_OTM = []
      CE_ITM = []
    
      let sData = OptionChainData[SelectedScript]
      let ocArr = sData.data[SelectedExpiryDate]
      let allOcs = []
      for (let i = 0; i < ocArr.length; i++) {
        allOcs.push(Object.keys(ocArr[i])[0])
      }
      closest = allOcs.reduce(function (prev, curr) {
          return Math.abs(curr - Underlying_Value) < Math.abs(prev - Underlying_Value) ? curr : prev;
      });
    
      for (let i = 0; i < ocArr.length; i++) {
        let stPrice = Object.keys(ocArr[i])[0]
        let pe = ocArr[i][stPrice]['PE']
        let ce = ocArr[i][stPrice]['CE']
        let peFlag = true
        let ceFlag = true
        if (pe) {
          if(pe.bidprice == 0 || pe.askPrice == 0 || pe.openInterest < 10 || pe.totalTradedVolume < 10) {
            peFlag = false
          }
          if(peFlag) {
            if (pe.strikePrice <= closest) {
              PE_OTM.push([pe.strikePrice, pe.bidprice, pe.askPrice, pe.totalTradedVolume, pe.openInterest, pe.impliedVolatility])
            } else {
              PE_ITM.push([pe.strikePrice, pe.bidprice, pe.askPrice, pe.totalTradedVolume, pe.openInterest, pe.impliedVolatility])
            }
          }
        }
        if (ce) {
          if(ce.bidprice == 0 || ce.askPrice == 0 || ce.openInterest < 10 || ce.totalTradedVolume < 10) {
            ceFlag = false
          }
          if(ceFlag) {
            if (ce.strikePrice <= closest) {
              CE_ITM.push([ce.strikePrice, ce.bidprice, ce.askPrice, ce.totalTradedVolume, ce.openInterest, ce.impliedVolatility])
            } else {
              CE_OTM.push([ce.strikePrice, ce.bidprice, ce.askPrice, ce.totalTradedVolume, ce.openInterest, ce.impliedVolatility])
            }
          }
        }
      }
      CE = [...CE_ITM, ...CE_OTM]
      PE = [...PE_OTM, ...PE_ITM]
  }
  function findSupportResistence() {
      let ceOI = []
      CE_OTM.forEach(a => ceOI.push(a[4]))
      ceOI.sort((a, b) => { return b - a })
      let peOI = []
      PE_OTM.forEach(a => peOI.push(a[4]))
      peOI.sort((a, b) => { return b - a })
    
      let R = []
      CE_OTM.forEach(a => {
        if (a[4] == ceOI[1]) {
          R.push(a[0])
        } else if (a[4] == ceOI[0]) {
          R.push(a[0])
        }
      })
      R.sort()
      let S = []
      PE_OTM.forEach(a => {
        if (a[4] == peOI[1]) {
          S.push(a[0])
        } else if (a[4] == peOI[0]) {
          S.push(a[0])
        }
      })
      S.sort()
      // [S1, S2, R1, R2]
      return [S[1], S[0], R[0], R[1]]
  }
  function supportResistenceGraph() {
  let guides = []
  let [S1, S2, R1, R2] = findSupportResistence()
  if (R1 != 0) {
      guides.push({
      "category": R1,
      "lineColor": "blue",
      "lineAlpha": 1,
      "dashLength": 3,
      "inside": true,
      "label": 'R1' + '(' + R1 + ')',
      "position": top
      })
  }
  if (R2 != 0) {
      guides.push({
      "category": R2,
      "lineColor": "blue",
      "lineAlpha": 1,
      "dashLength": 3,
      "inside": true,
      "label": 'R2' + '(' + R2 + ')',
      "position": top
      })
  }
  
  if (S1 != 0) {
      guides.push({
      "category": S1,
      "lineColor": "red",
      "lineAlpha": 1,
      "dashLength": 3,
      "inside": true,
      "label": 'S1' + '(' + S1 + ')',
      "position": top
      })
  }
  if (S2 != 0) {
      guides.push({
      "category": S2,
      "lineColor": "red",
      "lineAlpha": 1,
      "dashLength": 3,
      "inside": true,
      "label": 'S2' + '(' + S2 + ')',
      "position": top
      })
  }
  return guides
  }
  function optionChainPayoffCal(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr) {
      let arr = [].concat(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr);
      let spArr = [];
      arr.forEach(function (obj) { spArr.push(obj.strikePrice) });
      spArr.sort();
    
      //let config = fetchScriptConfig()
      let underlyingVal = parseInt(Underlying_Value * 16 / 100);
      let lowerStrike = spArr[0]  - underlyingVal;
      let higherStrike = spArr[spArr.length - 1]  + underlyingVal;
    
      let fullData = [];
      let breakPoints = []
      for (let i = lowerStrike; i <= higherStrike; i = i + 1) {
        let val = i + ' , ';
        buyCallArr.forEach(function (obj) {
          val += (buyCall(obj.strikePrice, obj.premium, i) * obj.lots) + ' , ';
        });
    
        sellCallArr.forEach(function (obj) {
          val += (sellCall(obj.strikePrice, obj.premium, i) * obj.lots) + ' , ';
        });
    
        buyPutArr.forEach(function (obj) {
          val += (buyPut(obj.strikePrice, obj.premium, i) * obj.lots) + ' , ';
        });
    
        sellPutArr.forEach(function (obj) {
          val += (sellPut(obj.strikePrice, obj.premium, i) * obj.lots) + ' , ';
        });
        buyStockArr.forEach(function (obj) {
          val += (buyStock(obj.strikePrice, i)) + ' , ';
        });
        sellStockArr.forEach(function (obj) {
          val += (sellStock(obj.strikePrice, i)) + ' , ';
        });
        let t = 0;
        val.substr(val.indexOf(',') + 1).split(' , ').forEach(function (v) { if (v.length > 0) { t = t + parseFloat(v.trim()) } })
        val += parseFloat(t).toFixed(2);
        if(parseInt(t) == 0) {
          breakPoints.push(i)
        }
        let tablePayOff = Object.assign({}, val.split(',').map(v => parseFloat(v)))
        tablePayOff[0] = parseInt(tablePayOff[0])
        fullData.push(tablePayOff);
      }
      //console.dir(breakPoints)
      if(OptimizeChart.optimizeChart == 1 && breakPoints.length > 0) {
        let cData = []
        let sd = calculateStandardDeviation()
        fullData.forEach(r => {
          if(r[0] >= (Underlying_Value - 3 * sd) && r[0] <= (Underlying_Value + 3 * sd)) {
            cData.push(r)
          }
        })
        fullData = cData
      }

      console.dir(fullData)
      return fullData;
  }
  function displayStrategyChart(data) {
    if(data.length == 0) {
      return
    }
      let pData = [];
      let keys = Object.keys(data[0]);
      for (let i = 0; i < data.length; i++) {
        let t = 0;
        for (let k = 1; k < keys.length - 1; k++) {
          t += (data[i][k]);
        }
        if(SelectedScript == 'NIFTY') {
          t = t * 50
        } else if(SelectedScript == 'BANKNIFTY') {
          t = t * 25
        } else {
          t = t * ScriptNames[SelectedScript].lotSize
        }
        pData.push({ StockPrice: data[i][0], Final: t, Change: parseFloat((data[i][0] - Underlying_Value) * 100 / Underlying_Value).toFixed(2) }); // data[i][keys.length-1]
      }
      var chartdata = pData;
      let guides = [{
        "category": parseInt(Underlying_Value),
        //"lineColor": "green",
        "lineAlpha": 2,
        "dashLength": 5,
        "inside": false,
        "label": Underlying_Value,
        "position": top,
        lineColor: "#0000FF",
        lineThickness: 2,
      }]
      
      guides = guides.concat(upperBoundLowerBoundGraph(Underlying_Value, data), supportResShowId == 1 ? supportResistenceGraph() : [], addStandardDeviation())
    
      AmCharts.makeChart("strategyChartId", {
        "path": "/amcharts/",
        "type": "serial",
        //"hideCredits":true,
        "theme": "light",
        "title": "Payoff",
        "dataProvider": chartdata,
        "categoryField": "StockPrice",
        "graphs": [
          {
            "id": "graph1",
            "title": "Price",
            "valueField": "Final",
            "xField": "Change",
            "lineColor": "#45b001",
            "fillColors": "#45b001",
            "negativeLineColor": "#ec6500",
            "negativeFillColors": "#ec6500",
            "lineThickness": 2,
            "useDataSetColors": false,
            "showBalloon": true,
            "fillAlphas": 0.2,
            "balloonText": "P&L ₹[[value]] <br/>Chg. from Spot: ([[Change]]%)",
          },
        ],
        "categoryAxis": {
          "title": "Underlying Price",
          "dashLength": 5,
          "equalSpacing": true,
          "guides": guides
        },
        "numberFormatter": {
          "precision": 2,
          "decimalSeparator": ".",
          "thousandsSeparator": ","
        },
        "valueAxes": [{
          "title": "Profit/Loss",
        }],
        "chartCursor": {
          "valueLineEnabled": true,
          "valueLineBalloonEnabled": false,
          "cursorAlpha": 1,
          "cursorColor": "#258cbb",
          "limitToGraph": "graph1",
          "valueLineAlpha": 0.2,
          "valueZoomable": true,
        },
        "responsive": {
          "enabled": true,
        }
      });
    
  }
  function showChart() {
    let opstraSDResId = document.querySelector('#opstraSDResId')
    if(!opstraSDResId.flag) {
      opstraSDResId.flag = true
      opstraSDResId.addEventListener('change', (e) => {
        fetchStandardDeviation()
        let reqId = document.getElementById('opstraSDReqId')
        delete reqId.flag
        calculatePayOff()
      })
    }
      
    if($$('strategyCalChartWinId')) {
      $$('strategyCalChartWinId').show()
    } else {
      webix.ui({
        view: "window",
        width: window.innerWidth - 2,
        height: window.innerHeight - 2,
        position: 'center',
        id: 'strategyCalChartWinId',
        head: {
          view: "toolbar", id: 'strategyCalChartToolbarId', cols: [
            { width: 4 },
            { view: "label", label: "Payoff Chart "},
            { view: "label", label: "", id: 'underlyingPriceId'},
            { view: "button", label: "Watch It", width: 100, click: function() {
              addToWatchList()
            }},
            { view: "switch", id: 'optimizeChartId', onLabel: "On", align: 'left', width: 70, offLabel:"Off", value: OptimizeChart.optimizeChart ,
            on:{
              onChange: function(newValue, oldValue, config){
                OptimizeChart.optimizeChart = newValue
                webix.storage.local.put('OptimizeChart', OptimizeChart)
                calculatePayOff()
              }
              }
            },
            { view: "button", label: 'X', width: 50, align: 'left', click: function () { 
              //$$('chartWinId').close();
              $$('strategyCalChartWinId').hide()
              }
            }
          ]
        },
        body: {
          cols:[
            { height: window.innerHeight - 25, width: 470,
              rows: [
            { id: 'inputRowId',
              rows:[
                {
                  cols: [
                    {
                      view:"combo", width:120, id:"inputScriptId",
                      placeholder:"Select Script",
                      options:['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()],
                      on:{
                        onChange: function(id){
                            SelectedScript = id
                            SelectedExpiryDate = ''
                            let sData = OptionChainData[SelectedScript]
                            $$('inputExpiryDateId').define('options', [])
                            $$('inputExpiryDateId').setValue('')
                            if(SelectedScript && sData) {
                              Underlying_Value = sData.underlyingValue
                              let fetchTime = new Date(sData.fetchTime).toLocaleString()
                              $$('underlyingPriceId').setHTML('Spot Price: <b>' + Underlying_Value + '</b> Last Downloaded: ' + sData.timestamp)
                              let expiryDates = Object.keys(sData.data).sort((a,b) => {if(new Date(a) > new Date(b)) {return 1} else {return -1}})
                              $$('inputExpiryDateId').define('options', expiryDates)
                              
                              if(sData.SelectedExpiryDate){
                                SelectedExpiryDate = sData.SelectedExpiryDate
                              } else {
                                SelectedExpiryDate = expiryDates[0].id
                              }

                              fetchStandardDeviation()
                              $$('inputExpiryDateId').setValue(SelectedExpiryDate)
                            }
                            clearRows()
                            calculatePayOff()
                        },
                        onAfterRender: function() {
                          webix.delay(function() {
                            if(!automaticCalStrategy) {
                              $$('inputScriptId').setValue('NIFTY')
                              addDynamicRow(rowIndex++)
                              calculatePayOff()
                            }
                          })
                        }
                      }
                    },
                    {
                      view:"combo", width:125, labelWidth:1, id:"inputExpiryDateId",
                      label: '',  placeholder:"Select Date",
                      options:[],on:{
                        onChange: function(id){
                          SelectedExpiryDate = id
                          if(SelectedExpiryDate) {
                            clearRows()
                            fetchStandardDeviation()
                            prepareStrikeWithPremium()
                            calculatePayOff()
                          } else {
                            CE = []
                            PE = []
                            CE_ITM = []
                            CE_OTM = []
                            PE_ITM = []
                            PE_OTM = []
                          }
                        }
                      }
                    },
                    { view:"button", type: 'icon', width: 30, icon:"mdi mdi-refresh", click: function() { 
                      if(SelectedScript != '' && Underlying_Value != '' && SelectedExpiryDate != '') {
                        calculatePayOff()
                      } else {
                        alert('Please Select Script and Expiery Date')
                      }
                    }},
                    {},
                    /*{ view:"button", value:"Stock", width: 30, icon:"mdi mdi-plus", click: function() { 
                      if(SelectedScript != '' && Underlying_Value != '' && SelectedExpiryDate != '') {
                        addDynamicRow(rowIndex++, {
                          buyOrSell: 1,
                          type: 2,
                          strikePrice: closest,
                          premium: closest, 
                          lots: 1
                        })
                        calculatePayOff()
                      } else {
                        alert('Please Select Script and Expiery Date')
                      }
                    }},*/
                    { view:"button", type: 'icon', width: 30, icon:"mdi mdi-plus", click: function() { 
                    if(SelectedScript != '' && Underlying_Value != '' && SelectedExpiryDate != '') {
                      addDynamicRow(rowIndex++)
                      calculatePayOff()
                    } else {
                      alert('Please Select Script and Expiery Date')
                    }
                  }}]
                },
              {
                cols: [{ view: "label", width: 70, label: "Buy/Sell"},
                { view: "label", width: 70, label: "Type"},
                { view: "label", width: 170, label: "Strike Price"},
                { view: "label", label: "Premium", width: 70},
                { view: "label", label: "Lots", width: 40},
                { view: "label", label: "", width: 30},
                { view: "label", label: "", width: 30},
                ]
            }
              ], height: window.innerHeight - 200
            },
            {
              view:"scrollview", 
              id:"scrollview", 
              scroll:"y",
              body:{
                rows:[
                  {view: 'button', label:'Strangle', click: function() {
                    StrangleStrategy()
                  }},
                  {view: 'button', label:'Iron Condor', click: function() {
                    IronCondorStrategy()
                  }},
                  {
                    cols: [
                      {view: 'button', label:'Jade Lizard', click: function() {
                        JadeLizardStrategy()
                      }},
                      {view: 'button', label:'Rev Jade Lizard', click: function() {
                        RevJadeLizardStrategy()
                      }},
                    ]
                  },
                  {
                    cols: [
                      {view: 'button', label:'Call Front Ratio Spread', click: function() {
                        CallFrontRationSpreadStrategy()
                      }},
                      {view: 'button', label:'Put Front Ratio Spread', click: function() {
                        PutFrontRationSpreadStrategy()
                      }},
                    ]
                  },
                ]
              }
            }
          ]
          },
            {view:'resizer'},
            {
              rows: [
                {height: 30, cols: [
                  { view: "switch", id: 'supportResShowId', onLabel: "On", align: 'left', width: 70, offLabel:"Off", value: 1 ,
                    on:{
                      onChange: function(newValue, oldValue, config){
                        supportResShowId = newValue
                        calculatePayOff()
                      }
                      }
                    },
                    { view: 'template', id: 'ivTemplateId', borderless:true, template: ''},
                    {}
              ]},
              {view: 'template', template: '<div id="strategyChartId" style="width: 100%;height: 100%;background-color: aliceblue;"></div>'},
              { height: 10}  
              ]
            }
          ]
        }
    }).show();
    }
    //displaySavedStrategyData()
  }
  function addDynamicRow(rowId, json) {
    if(!json) {
      json = {
        buyOrSell: BUY,
        type: CE_TYPE, // 1: CE, 0: PE, 2: Stock
        strikePrice: closest,
        premium: 0, 
        lots: 1
      }
    }
    let option_data = []
    let d = json.type == 1 ? CE : PE
    d.forEach(obj => {
      let per = parseFloat((obj[0] - Underlying_Value)/Underlying_Value * 100).toFixed(2)
      option_data.push({id: obj[0], value: obj[0] + ' (' + ( json.buyOrSell == 1 ? obj[2] : obj[1]) + ', ' + per + '%)' })
      if(obj[0] == json.strikePrice) {
        json.premium = json.buyOrSell == 1 ? obj[2] : obj[1]
      }
    })

    $$('inputRowId').addView({id: 'input' + rowId,
    cols: [
      { view: "switch", id: 'BuySell' + rowId, onLabel: "Buy", width: 70, offLabel:"Sell", value: json.buyOrSell, on:{
        onChange: function(newValue, oldValue, config){
          let index = this.config.id.replaceAll('BuySell', '')
          if($$('StrikePrice'+index)) {
            let v = $$('StrikePrice'+index).getValue()
            let data = $$('Type' + index).getValue() == 1 ? CE : PE;
            let option_data = []
            data.forEach(obj => {
              let per = parseFloat((obj[0] - Underlying_Value)/Underlying_Value * 100).toFixed(2)
              option_data.push({id: obj[0], value: obj[0] + ' (' + (newValue == 1 ? (obj[2] + ', ' + per + '%)') : (obj[1] + ', ' + per + '%)') )})
            })
            $$('StrikePrice'+index).getPopup().getList().clearAll()
            $$('StrikePrice'+index).getPopup().getList().parse(option_data)
  
            if(v) {
              $$('Premium' + index).blockEvent()
              if(newValue == 1) {
                $$('Premium' + index).setValue(data.filter(obj => obj[0] + '' == v)[0][2])
              } else {
                $$('Premium' + index).setValue(data.filter(obj => obj[0] + '' == v)[0][1])
              }
              $$('Premium' + index).unblockEvent()
              calculatePayOff()
            }
          }
        }
      }},
      { view: "switch", id: 'Type' + rowId, onLabel: "CE", width: 70, offLabel:"PE", value: json.type , on:{
        onChange: function(newValue, oldValue, config){
          let index = this.config.id.replaceAll('Type', '')
          let bs = $$('BuySell' + index).getValue()
          let option_data = []
          let data = []
          if(newValue == 1) {
            data = CE
            CE.forEach(obj => {
              let per = parseFloat((obj[0] - Underlying_Value)/Underlying_Value * 100).toFixed(2)
              option_data.push({id: obj[0], value: obj[0] + ' (' + (bs == 1 ? (obj[2] + ', ' + per + '%)') : (obj[1] + ', ' + per + '%)')) })
            })
          } else {
            data = PE
            PE.forEach(obj => {
              let per = parseFloat((obj[0] - Underlying_Value)/Underlying_Value * 100).toFixed(2)
              option_data.push({id: obj[0], value: obj[0] + ' (' + (bs == 1 ? (obj[2] + ', ' + per + '%)') : (obj[1] + ', ' + per + '%)') )})
            })
          }
          let v = $$('StrikePrice'+index).getValue()
          $$('StrikePrice'+index).getPopup().getList().clearAll()
          $$('StrikePrice'+index).getPopup().getList().parse(option_data)
          if(v) {
            $$('Premium' + index).blockEvent()
            if(bs == BUY) {
              $$('Premium' + index).setValue(data.filter(obj => obj[0] + '' == v)[0][2])
            } else {
              $$('Premium' + index).setValue(data.filter(obj => obj[0] + '' == v)[0][1])
            }
            $$('Premium' + index).unblockEvent()
            calculatePayOff()
          }
        }
      }},
      { view:"combo", id: 'StrikePrice' + rowId, width: 170, label: '', labelWidth: 1, value: json.strikePrice, options: option_data,
        on:{
            onChange: function(id){
              if(id) {
                let index = this.config.id.replaceAll('StrikePrice', '')
                let bs = $$('BuySell' + index).getValue()
                let data = $$('Type' + index).getValue() == 1 ? CE : PE;
                $$('Premium' + index).blockEvent()
                if(bs == BUY) {
                  $$('Premium' + index).setValue(data.filter(obj => obj[0] + '' == id)[0][2])
                } else {
                  $$('Premium' + index).setValue(data.filter(obj => obj[0] + '' == id)[0][1])
                }
                $$('Premium' + index).unblockEvent()
                calculatePayOff()
              }
            }
        }
    },
    { view: "text", id: 'Premium' + rowId, value: json.premium, width: 70, 
      on:{
        onChange: function(newValue, oldValue, config){
          let index = this.config.id.replaceAll('Premium', '')
          let v = $$('StrikePrice'+index).getValue()
          if(v) {
            if(newValue > 0) {
              calculatePayOff()
            }
          }
        }
      }
    },
    { view: "text", id: 'Lot' + rowId, value: json.lots, width: 40, on:{
      onChange: function(newValue, oldValue, config){
        let index = this.config.id.replaceAll('Lot', '')
        let v = $$('StrikePrice'+index).getValue()
        if(v) {
          if(newValue > 0) {
            calculatePayOff()
          }
        }
      }
    }},
    { view:"button", type: 'icon', id: 'Active' + rowId, icon:"mdi mdi-circle", width: 30, css: 'active-icon', value:'Active', click: function() { 
      let index = this.config.id.replaceAll('Active', '')
      if($$(this.config.id).getNode().classList.contains('active-icon')) {
        $$(this.config.id).getNode().classList.remove('active-icon')
        $$(this.config.id).getNode().classList.add('inactive-icon')
        $$(this.config.id).setValue('InActive')
      } else {
        $$(this.config.id).getNode().classList.remove('inactive-icon')
        $$(this.config.id).getNode().classList.add('active-icon')
        $$(this.config.id).setValue('Active')
      }
      calculatePayOff()
    }},
    { view:"button", type: 'icon', icon:"mdi mdi-delete", width: 30, css: 'delete-icon', click: function() { 
        $$('inputRowId').removeView('input' + rowId)
        calculatePayOff()
      }}
    ]
    });
  }
  function calculatePayOff() {
      let iData = []
      let rows = $$('inputRowId').getChildViews();
      for(let i=2; i<rows.length; i++) {
          let l = rows[i].getChildViews()[0].config.value
          //l = (l==1) ? "Buy" : "Sell"
          let t = rows[i].getChildViews()[1].config.value
          //t = (t==1) ? "CE" : "PE"
          let s = rows[i].getChildViews()[2].getValue()
          let p = rows[i].getChildViews()[3].getValue()
          let lot = rows[i].getChildViews()[4].getValue()
          let a = rows[i].getChildViews()[5].getValue()
          if(s != '' && p != '' && lot != '' && a == 'Active') {
            iData.push({
              buyOrSell: l,
              type: t,
              strikePrice: s,
              premium: p,
              lots: lot
          })
          }
      }

      let buyCallArr = [], sellCallArr = [], buyPutArr = [], sellPutArr = [], buyStockArr = []

      iData.forEach(obj => {
          if(obj.buyOrSell == 1 && obj.type == 0) {
              buyPutArr.push({
                  strikePrice: parseInt(obj.strikePrice),
                  premium: parseFloat(obj.premium),
                  lots: parseInt(obj.lots)
                })
          } else if(obj.buyOrSell == 0 && obj.type == 0) {
              sellPutArr.push({
                  strikePrice: parseInt(obj.strikePrice),
                  premium: parseFloat(obj.premium),
                  lots: parseInt(obj.lots)
                })
          } else if(obj.buyOrSell == 1 && obj.type == 1) {
              buyCallArr.push({
                  strikePrice: parseInt(obj.strikePrice),
                  premium: parseFloat(obj.premium),
                  lots: parseInt(obj.lots)
                })
          } else if(obj.buyOrSell == 0 && obj.type == 1) {
              sellCallArr.push({
                  strikePrice: parseInt(obj.strikePrice),
                  premium: parseFloat(obj.premium),
                  lots: parseInt(obj.lots)
                })
          }
      })
      let tempData = {
        Underlying_Value: Underlying_Value,
        SelectedScript: SelectedScript,
        SelectedExpiryDate: SelectedExpiryDate,
        data: iData
      }
      webix.storage.local.put('StrategyData', tempData)
      if(iData.length > 0) {
        let data = optionChainPayoffCal(buyCallArr, sellCallArr, buyPutArr, sellPutArr, [], []);
        displayStrategyChart(data)
      } else {
        //displayStrategyChart([])
      }
  }
  function StrangleStrategy() {
    if(SelectedScript != '' && SelectedExpiryDate != '') {
      clearRows()
      let pejson = {
      buyOrSell: SELL,
      type: PE_TYPE,
      strikePrice: '',
      premium: '',
      lots: 1
      }
    for(let i=0; i<PE_OTM.length; i++) {
      if(PE_OTM[i][1] > 10) {
        pejson.strikePrice = PE_OTM[i][0]
        pejson.premium = PE_OTM[i][1]
        break
      }
    }
    if(pejson.strikePrice == '') {
      peOTM = PE_OTM[0][1]
      pejson.strikePrice = PE_OTM[0][0]
      pejson.premium = PE_OTM[0][1]
    }
    
    let cejson = {
      buyOrSell: SELL,
      type: CE_TYPE,
      strikePrice: '',
      premium: '',
      lots: 1
      }
    for(let i=CE_OTM.length-1; i>0; i--) {
      if(CE_OTM[i][1] > 10) {
        ceOTM = CE_OTM[i]
        cejson.strikePrice = CE_OTM[i][0]
        cejson.premium = CE_OTM[i][1]
        break
      }
    }
    if(cejson.strikePrice == '') {
      ceOTM = CE_OTM[CE_OTM.length - 1][1]
      cejson.strikePrice = CE_OTM[CE_OTM.length - 1][0]
      cejson.premium = CE_OTM[CE_OTM.length - 1][1]
    }
    addDynamicRow(rowIndex++, pejson)
    addDynamicRow(rowIndex++, cejson)
    calculatePayOff()
    } else {
      alert('Please select the script and expiry date')
    }
  }
  function IronCondorStrategy() {
    if(SelectedScript != '' && SelectedExpiryDate != '') {
      let count = 0
      clearRows()
      let peBuy = {
      buyOrSell: BUY,
      type: PE_TYPE,
      strikePrice: '',
      premium: '',
      lots: 1
      }
      let peSell = {
        buyOrSell: SELL,
        type: PE_TYPE,
        strikePrice: '',
        premium: '',
        lots: 1
        }
      for(let i=0; i<PE_OTM.length; i++) {
        if(PE_OTM[i][1] > 10) {
          peBuy.strikePrice = PE_OTM[i][0]
          peBuy.premium = PE_OTM[i][1]
          count++
          break
        }
      }
      for(let i=0; i<PE_OTM.length; i++) {
        if(PE_OTM[i][1] > 10 && peBuy.strikePrice != PE_OTM[i][0]) {
          if((PE_OTM[i][1] - peBuy.premium) > 10) {
            peSell.strikePrice = PE_OTM[i][0]
            peSell.premium = PE_OTM[i][1]
            count++
            break
          }
        }
      }
    
      let ceBuy = {
        buyOrSell: BUY,
        type: CE_TYPE,
        strikePrice: '',
        premium: '',
        lots: 1
        }
      let ceSell = {
        buyOrSell: SELL,
        type: CE_TYPE,
        strikePrice: '',
        premium: '',
        lots: 1
        }
      for(let i=CE_OTM.length-1; i>0; i--) {
        if(CE_OTM[i][1] > 10) {
          ceBuy.strikePrice = CE_OTM[i][0]
          ceBuy.premium = CE_OTM[i][1]
          count++
          break
        }
      }
      for(let i=CE_OTM.length-1; i>0; i--) {
        if(CE_OTM[i][1] > 10 && ceBuy.strikePrice != CE_OTM[i][0]) {
          if((CE_OTM[i][1] - ceBuy.premium) > 10) {
            ceSell.strikePrice = CE_OTM[i][0]
            ceSell.premium = CE_OTM[i][1]
            count++
            break
          }
        }
      }
      if(count == 4) {
        addDynamicRow(rowIndex++, peBuy)
        addDynamicRow(rowIndex++, peSell)
        addDynamicRow(rowIndex++, ceSell)
        addDynamicRow(rowIndex++, ceBuy)
        calculatePayOff()
      } else {
        alert("Not found better strikes")
      }
    } else {
      alert('Please select the script and expiry date')
    }
  }
  function JadeLizardStrategy() {
    if(SelectedScript != '' && SelectedExpiryDate != '') {
      let count = 0
      clearRows()
      let ceBuy = {
        buyOrSell: BUY,
        type: CE_TYPE,
        strikePrice: CE_OTM[1][0],
        premium: CE_OTM[1][2],
        lots: 1
        }
      let ceSell = {
        buyOrSell: SELL,
        type: CE_TYPE,
        strikePrice: CE_OTM[0][0],
        premium: CE_OTM[0][1],
        lots: 1
        }
      let peSell = {
        buyOrSell: SELL,
        type: PE_TYPE,
        strikePrice: '',
        premium: 0,
        lots: 1
      }
      let stDiff = CE_OTM[1][0] - CE_OTM[0][0] - (ceSell.premium - ceBuy.premium)
      for(let i=0; i<PE_OTM.length; i++) {
        if(PE_OTM[i][1] >  (stDiff + 15)) {
          peSell.strikePrice = PE_OTM[i][0]
          peSell.premium = PE_OTM[i][1]
          count++
          break
        }
      }
      
      if(count == 1) {
        addDynamicRow(rowIndex++, peSell)
        addDynamicRow(rowIndex++, ceSell)
        addDynamicRow(rowIndex++, ceBuy)
        calculatePayOff()
      } else {
        alert("Not found better strikes")
      }
    } else {
      alert('Please select the script and expiry date')
    }
  }
  function RevJadeLizardStrategy() {
    if(SelectedScript != '' && SelectedExpiryDate != '') {
      let count = 0
      clearRows()
      let peBuy = {
        buyOrSell: BUY,
        type: PE_TYPE,
        strikePrice: PE_OTM[PE_OTM.length-2][0],
        premium: PE_OTM[PE_OTM.length-2][2],
        lots: 1
        }
      let peSell = {
        buyOrSell: SELL,
        type: PE_TYPE,
        strikePrice: PE_OTM[PE_OTM.length-1][0],
        premium: PE_OTM[PE_OTM.length-1][1],
        lots: 1
        }
      let ceSell = {
        buyOrSell: SELL,
        type: CE_TYPE,
        strikePrice: '',
        premium: 0,
        lots: 1
      }
      let stDiff = PE_OTM[PE_OTM.length-1][0] - PE_OTM[PE_OTM.length-2][0] - (peSell.premium - peBuy.premium)
      for(let i=0; i<CE_OTM.length; i++) {
        if(CE_OTM[i][1] <  (stDiff + 15)) {
          ceSell.strikePrice = CE_OTM[i][0]
          ceSell.premium = CE_OTM[i][1]
          count++
          break
        }
      }
      
      if(count == 1) {
        addDynamicRow(rowIndex++, peBuy)
        addDynamicRow(rowIndex++, peSell)
        addDynamicRow(rowIndex++, ceSell)
        calculatePayOff()
      } else {
        alert("Not found better strikes")
      }
    } else {
      alert('Please select the script and expiry date')
    }
  }
  function CallFrontRationSpreadStrategy() {
    if(SelectedScript != '' && SelectedExpiryDate != '') {
      let count = 0
      clearRows()
      let threePer = Underlying_Value + (Underlying_Value * 4 / 100)
      let stDiff = CE_OTM[1][0] - CE_OTM[0][0]
      let ceBuy = {
        buyOrSell: BUY,
        type: CE_TYPE,
        strikePrice: 0,
        premium: 0,
        lots: 1
      }

      for(let i=0; i<CE_OTM.length; i++) {
        if(CE_OTM[i][0] > threePer) {
          ceBuy.strikePrice = CE_OTM[i][0]
          ceBuy.premium = CE_OTM[i][2]
          count++
          break
        }
      }

      let ceSell = {
        buyOrSell: SELL,
        type: CE_TYPE,
        strikePrice: 0,
        premium: 0,
        lots: 2
        }
      for(let i=CE_OTM.length-1; i>0; i--) {
        if(((CE_OTM[i][1] * ceSell.lots) - ceBuy.premium) >  (stDiff-15)) {
          ceSell.strikePrice = CE_OTM[i][0]
          ceSell.premium = CE_OTM[i][1]
          count++
          break
        }
      }
      
      if(count == 2) {
        addDynamicRow(rowIndex++, ceBuy)
        addDynamicRow(rowIndex++, ceSell)
        calculatePayOff()
      } else {
        alert("Not found better strikes")
      }
    } else {
      alert('Please select the script and expiry date')
    }
  }
  function PutFrontRationSpreadStrategy() {
    if(SelectedScript != '' && SelectedExpiryDate != '') {
      let count = 0
      clearRows()
      let threePer = Underlying_Value + (Underlying_Value * 4 / 100)
      let stDiff = PE_OTM[PE_OTM.length-1][0] - PE_OTM[PE_OTM.length-2][0]
      let peSell = {
        buyOrSell: SELL,
        type: PE_TYPE,
        strikePrice: 0,
        premium: 0,
        lots: 2
        }
      let peBuy = {
        buyOrSell: BUY,
        type: PE_TYPE,
        strikePrice: 0,
        premium: 0,
        lots: 1
      }

      for(let i=0; i<PE_OTM.length - 1; i++) {
        if(PE_OTM[i][1] > 10) {
          peSell.strikePrice = PE_OTM[i][0]
          peSell.premium = PE_OTM[i][1]
          for(let j=i+1; j<PE_OTM.length - 1; j++) {
            if(peSell.premium * peSell.lots - PE_OTM[j][2] > stDiff * 2) {
              peBuy.strikePrice = PE_OTM[j][0]
              peBuy.premium = PE_OTM[j][2]
              count++
              break
            }
          }
          if(peBuy.premium != 0) {
            break;
          }
        }
      }
   
      if(count == 1) {
        addDynamicRow(rowIndex++, peSell)
        addDynamicRow(rowIndex++, peBuy)
        calculatePayOff()
      } else {
        alert("Not found better strikes")
      }
    } else {
      alert('Please select the script and expiry date')
    }
  }
  function clearRows() {
    let rows = $$('inputRowId').getChildViews()
    let tempArr = []
    for(let i=2; i<rows.length; i++) {
      tempArr.push(rows[i].config.id)
    }
    tempArr.forEach(id => $$('inputRowId').removeView(id))
  }
  function displaySavedStrategyData() {
    let tempData = webix.storage.local.get('StrategyData')
    if(tempData) {
      Underlying_Value = tempData.Underlying_Value
      SelectedScript = tempData.SelectedScript
      SelectedExpiryDate = tempData.SelectedExpiryDate
      $$("inputScriptId").setValue(SelectedScript)
      prepareStrikeWithPremium()
      let iData = tempData.data
      iData && iData.forEach(d => {
        addDynamicRow(rowIndex++, d)
      })
      calculatePayOff()
    }
  }
  function automaticCal(UV, SS, SED, opStArr) {
    Underlying_Value = UV
    SelectedScript = SS
    SelectedExpiryDate = SED
    let buyCallArr = [], sellCallArr = [], buyPutArr = [], sellPutArr = []
    $$("inputScriptId").setValue(SelectedScript)
    prepareStrikeWithPremium()
    opStArr.forEach(d => {
      addDynamicRow(rowIndex++, d)
    })
    calculatePayOff()

  }
  function addToWatchList() {
    let rows = $$('inputRowId').getChildViews()
    let tempArr = []
    for(let i=2; i<rows.length; i++) {
      tempArr.push(rows[i].config.id.replaceAll('input', ''))
    }
    let opList = []
    for(let i=0; i<tempArr.length; i++) {
      let json = {
        buyOrSell: $$('BuySell'+ tempArr[i]).getValue(),
        type: $$('Type'+ tempArr[i]).getValue(),
        strikePrice: $$('StrikePrice'+ tempArr[i]).getValue(),
        premium: parseFloat($$('Premium'+ tempArr[i]).getValue()),
        lots: parseInt($$('Lot'+ tempArr[i]).getValue()),
        latestPremium: 0,
        pl: 0
      }
      opList.push(json)
    }
    let watchObj = {
      script: SelectedScript,
      expiryDate: SelectedExpiryDate,
      UV: Underlying_Value,
      createDate: new Date(),
      list: opList,
      key: webix.uid()
    }

    let WatchList = webix.storage.local.get('WatchList')
    if (!WatchList) {
      WatchList = []
    }
    WatchList.push(watchObj)
    webix.storage.local.put('WatchList', WatchList)
    webix.message({text: "Added to watch list successfully", type:"success"})
  }
  function fetchStandardDeviation() {
    let OpstraSD = webix.storage.local.get('OpstraSD')
    let sKey = SelectedScript + '&' + SelectedExpiryDate.replaceAll('-', '')
    let reqId = document.getElementById('opstraSDReqId')
    if(!OpstraSD[sKey]) {
      if(!reqId.flag) {
        reqId.flag = true
        dispatchChangeEvent('#opstraSDReqId', sKey)
      }
    } else {
      IV = OpstraSD[sKey]['iv']
      let fetchTime = new Date(OpstraSD[sKey]['fetchTime'])
      let currentTime = new Date()
      if(currentTime.getTime() - fetchTime.getTime() > 20 * 60 * 1000) {
        if(!reqId.flag) {
          reqId.flag = true
          dispatchChangeEvent('#opstraSDReqId', sKey)
        }
      }else {
        $$('ivTemplateId').setHTML(`<b>IV: <span style="color:#4bb714 !important;background-color: gold !important;">` + IV + `</span></b> <b>IV Percentile: <span style="color:#4bb714 !important;background-color: gold !important">` + OpstraSD[sKey]['ivPercentile'] + `</span></b>`)
      }
    }
  }
  function calculateStandardDeviation() {
    let ed = SelectedExpiryDate.split('-')
    let d2 = new Date(ed[1] + ' ' + ed[0] + ' ' + ed[2])
    let d1 = new Date()
    let DTE = Math.ceil((d2.getTime() - d1.getTime())/ (24 * 60 * 60 * 1000))
    return Underlying_Value * (IV / 100) * Math.sqrt(DTE / 365)
  }
  function addStandardDeviation() {
    let SD = calculateStandardDeviation()
    let guide = [{
      category: Math.trunc(Underlying_Value - SD),
      toCategory: Math.trunc(Underlying_Value + SD),
      lineColor: "#a2b7a7",
      lineAlpha: .1,
      fillAlpha: .2,
      fillColor: "#a2b7a7",
      dashLength: 1,
      inside: !1
    }, {
        category: Math.trunc(Underlying_Value - SD),
        lineColor: "#a2b7a7",
        lineAlpha: .1,
        dashLength: 1,
        inside: !1,
        labelRotation: 0,
        label: "-1σ",
        position: "top"
    }, {
        category: Math.trunc(Underlying_Value + SD),
        lineColor: "#a2b7a7",
        lineAlpha: .1,
        dashLength: 1,
        inside: !1,
        labelRotation: 0,
        label: "+1σ",
        position: "top"
    }, {
        category: Math.trunc(Underlying_Value - 2 * SD),
        toCategory: Math.trunc(Underlying_Value + 2 * SD),
        lineColor: "#c5d2c8",
        lineAlpha: .1,
        fillAlpha: .2,
        fillColor: "#c5d2c8",
        dashLength: 1,
        inside: !1
    }, {
        category: Math.trunc(Underlying_Value - 2 * SD),
        lineColor: "#c5d2c8",
        lineAlpha: .1,
        dashLength: 1,
        inside: !1,
        labelRotation: 0,
        label: "-2σ",
        position: "top"
    }, {
        category: Math.trunc(Underlying_Value + 2 * SD),
        lineColor: "#c5d2c8",
        lineAlpha: .1,
        dashLength: 1,
        inside: !1,
        labelRotation: 0,
        label: "+2σ",
        position: "top"
    }]
  return guide;
  }

  if(UV != '' && SS != '' && SED != '' && opStArr) {
    automaticCalStrategy = true
    if($$('strategyCalChartWinId')) {
      clearRows()
    }
    showChart()
    automaticCal(UV, SS, SED, opStArr)
  } else {
    automaticCalStrategy = false
    showChart()
  }
  
}