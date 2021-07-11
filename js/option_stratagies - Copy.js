
let globalConfig = {
  'default': { lowerPer: 4, higherPer: 4, creditAmt: 3, skipDiffPer: 1.45, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 7 },
  'BANKNIFTY': { lowerPer: 6, higherPer: 6, creditAmt: 50, skipDiffPer: 1.45, lowerLimitPer: 12, upperLimitPer: 12, outerLimitPer: 4 },
  'NIFTY': { lowerPer: 4, higherPer: 4, creditAmt: 15, skipDiffPer: 1.45, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 2 },
}
let peOTM = []
let peITM = []
let ceOTM = []
let ceITM = []
// [Strike Price, Bid Price, Ask Price, Volumn, OI]
let PE_OTM = []
let PE_ITM = []

let CE_OTM = []
let CE_ITM = []

let Underlying_Value = 0
let SelectedScript = ''
let selectedExpieryDate = '29-Jul-2021'

function fetchScriptConfig() {
  return globalConfig[SelectedScript] || globalConfig['default']
}

let optionChainData = webix.storage.local.get('optionChainData')
if (!optionChainData) {
  optionChainData = {}
  webix.storage.local.put('optionChainData', optionChainData)
}
let strategiesObj = {

  "longCall": { buyCall: [1], label: 'Long Call' },
  "shortCall": { sellCall: [1], label: 'Short Call' },

  "longPut": { buyPut: [1], label: 'Long Put' },
  "shortPut": { sellPut: [1], label: 'Short Put' },

  "longStraddle": { buyCall: [1], buyPut: [1], label: 'Long Straddle' },
  "shortStraddle": { sellCall: [1], sellPut: [1], label: 'Short Straddle' },

  "longStrangle": { buyCall: [1], buyPut: [1], label: 'Long Strangle', buyCallLabel: ['OTM'], buyPutLabel: ['OTM'] },
  "shortStrangle": { sellCall: [1], sellPut: [1], label: 'Short Strangle', sellCallLabel: ['OTM'], sellPutLabel: ['OTM'] },

  "longCombo": { buyCall: [1], sellPut: [1], label: 'Long Combo', sellPutLabel: ['OTM'], buyCallLabel: ['OTM'] },

  "coveredCall": { buyStock: [1], sellCall: [1], label: 'Covered Call' },
  "coveredPut": { sellStock: [1], sellPut: [1], label: 'Covered Put' },

  "syntheticLongPut": { sellStock: [1], buyCall: [1], label: 'Synthetic Long Put' },
  "syntheticLongCall": { buyStock: [1], buyPut: [1], label: 'Synthetic Long Call' },

  "bullCallSpread": { buyCall: [1], sellCall: [1], label: 'Bull Call Spread', buyCallLabel: ['ITM'], sellCallLabel: ['OTM'] },
  "bullPutSpread": { buyPut: [1], sellPut: [1], label: 'Bull Put Spread', buyPutLabel: ['OTM'], sellPutLabel: ['OTM'] },

  "bearCallSpread": { buyCall: [1], sellCall: [1], label: 'Bear Call Spread' },
  "bearPutSpread": { buyPut: [1], sellPut: [1], label: 'Bear Put Spread' },

  "longCallButterfly": { sellCall: [2], buyCall: [1, 1], label: 'Long Call Butterfly', sellCallLabel: ['ATM'], buyCallLabel: ['ITM', 'OTM'] },
  "shortCallButterfly": { buyCall: [2], sellCall: [1, 1], label: 'Short Call Butterfly', buyCallLabel: ['ATM'], sellCallLabel: ['ITM', 'OTM'] },

  "longCallCondor": { sellCall: [1, 1], buyCall: [1, 1], label: 'Long Call Condor', sellCallLabel: ['ITM', 'OTM'], buyCallLabel: ['ITM', 'OTM'] },
  "shortCallCondor": { buyCall: [1, 1], sellCall: [1, 1], label: 'Short Call Condor', buyCallLabel: ['ITM', 'OTM'], sellCallLabel: ['ITM', 'OTM'] },

}

let labels = {
  buyCall: 'Buy Call',
  sellCall: 'Sell Call',
  buyPut: 'Buy Put',
  sellPut: 'Sell Put',
  buyStock: 'Buy Stock',
  sellStock: 'Sell Stock',
}
let optionViews = {
  cols: [
    { view: "label", label: '', align: "center" },
    { view: "text", align: "center", width: 90, inputAlign: "center", },
    { view: "text", align: "center", width: 90, inputAlign: "center", }
  ]
};

let keyIds = ['buyCall', 'sellCall', 'buyPut', 'sellPut', 'buyStock', 'sellStock'];
let strikeIds = ['buyCallStrike_', 'sellCallStrike_', 'buyPutStrike_', 'sellPutStrike_', 'buyStockStrike_', 'sellStockStrike_'];
let premiumIds = ['buyCallPremium_', 'sellCallPremium_', 'buyPutPremium_', 'sellPutPremium_'];

let submitButton = {
  cols: [
    { view: "label", label: '', align: "center" },
    {
      view: "button", label: 'Done', align: "center", width: 90, click: function (id, event) {
        let arr = [[], [], [], [], [], []];
        for (let k = 0; k < 6; k++) {
          for (let i = 0; i < 3; i++) {
            if ($$(strikeIds[k] + i)) {
              let obj = {
                strikePrice: parseFloat($$(strikeIds[k] + i).getValue()),
                premium: $$(premiumIds[k] + i) != undefined ? parseFloat($$(premiumIds[k] + i).getValue()) : 0,
                lotSize: $$(strikeIds[k] + i).getParentView().config.lotSize
              };
              arr[k].push(obj);
            }
          }
        }
        let d = calculatePayoffTable(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
        console.dir(d);
      }
    },
    {
      view: "button", label: 'Reset', width: 90, align: "center", click: function (id, event) {

        $$('payoffViewId').getBody().reconstruct();
        $$('payoffChartId').refresh();
        let arr = [[], [], [], [], [], []];
        for (let k = 0; k < 6; k++) {
          for (let i = 0; i < 3; i++) {
            if ($$(strikeIds[k] + i)) {
              $$(strikeIds[k] + i).setValue('');
              $$(premiumIds[k] + i) && $$(premiumIds[k] + i).setValue('');
            }
          }
        }

      }
    }]
};

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

function calculatePayoffTable(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr) {
  let header = 'On Expiry Closes At , ';
  let arr = [].concat(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr);
  let spArr = [];
  arr.forEach(function (obj) { spArr.push(obj.strikePrice) });
  spArr.sort();

  buyCallArr.forEach(function (obj) {
    header += ('Net Payoff From Call Purchased (' + obj.strikePrice + ') , ')
  });
  sellCallArr.forEach(function (obj) {
    header += ('Net Payoff From Call Sold (' + obj.strikePrice + ') , ')
  });
  buyPutArr.forEach(function (obj) {
    header += ('Net Payoff From Put Purchased (' + obj.strikePrice + ') , ')
  });
  sellPutArr.forEach(function (obj) {
    header += ('Net Payoff From Put Sold (' + obj.strikePrice + ') , ')
  });
  buyStockArr.forEach(function (obj) {
    header += ('Net Payoff From Stock Purchased (' + obj.strikePrice + ') , ')
  });
  sellStockArr.forEach(function (obj) {
    header += ('Net Payoff From Stock Sold (' + obj.strikePrice + ') , ')
  });

  header += 'Net Payoff (Rs.)';
  let headerArr = header.split(' , ');
  console.dir(header);

  let columns = [];
  for (let i = 0; i < headerArr.length; i++) {
    if (i === headerArr.length - 1) {
      columns.push({
        id: i + '', fillspace: true, adjust: true, header: [{ text: headerArr[i], css: "multiline" }],
        template: function (obj) {
          if (obj[i] == 0) {
            return '<div style="text-align: center">' + obj[i] + '</div>';
          } else if (obj[i] > 0) {
            return '<div style="background-color: #c0f1c0; text-align: center">' + obj[i] + '</div>';
          } else {
            return '<div style="background-color: #f1a5a7; text-align: center">' + obj[i] + '</div>';
          }
        }
      });
    } else {
      columns.push({
        id: i + '', width: 90, header: [{ text: headerArr[i], css: "multiline" }],
      });
    }
  }

  let lowerStrike = spArr[0] - 300;
  let higherStrike = spArr[spArr.length - 1] + 300;

  let fullData = [];
  let data = [];
  let tempLowerStrike = lowerStrike;
  for (let i = lowerStrike; i <= higherStrike; i = i + 1) {
    let val = i + ' , ';
    buyCallArr.forEach(function (obj) {
      val += (buyCall(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
    });

    sellCallArr.forEach(function (obj) {
      val += (sellCall(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
    });

    buyPutArr.forEach(function (obj) {
      val += (buyPut(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
    });

    sellPutArr.forEach(function (obj) {
      val += (sellPut(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
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
    //console.dir(val);
    fullData.push(Object.assign({}, val.split(',')));
    if (i == tempLowerStrike || (t == 0)) {
      if (t != 0 || (i == tempLowerStrike && (t == 0))) {
        tempLowerStrike += 50;
      }

      data.push(Object.assign({}, val.split(',')));
    }
  }

  if (data && data.length > 0) {
    preparePayoffTable(columns, data);
    displayChart(fullData);
  }

  return data;
}

function prepareStrategy(obj) {
  let arr = Object.keys(obj);
  for (let i = 0; i < arr.length; i++) {
    let index = keyIds.indexOf(arr[i]);
    if (index > -1) {
      let val = obj[arr[i]];
      for (let j = 0; j < val.length; j++) {
        let rowView = JSON.parse(JSON.stringify(optionViews));
        rowView.cols[0].label = labels[arr[i]] + (obj[arr[i] + 'Label'] !== undefined ? ' ' + obj[arr[i] + 'Label'][j] : '') + ' (' + val[j] + ' lot)';
        rowView.cols[0].id = webix.uid();
        rowView.cols[1].id = strikeIds[index] + j;
        if (premiumIds[index]) {
          rowView.cols[2].id = premiumIds[index] + j;
        } else {
          rowView.cols[2].view = 'label';
        }

        let viewId = $$('inputViewId').getBody().addView(rowView);
        $$(viewId).config.lotSize = val[j];
      }
    }
  }

  $$('inputViewId').getBody().addView(submitButton);
}

function preparePayoffTable(columns, data) {
  $$('payoffViewId').getBody().reconstruct();
  $$('payoffViewId').getBody().removeView('payoffLabelId');
  $$('payoffViewId').getBody().addView(
    {
      view: 'datatable', id: 'payoffTableId', headerRowHeight: 120, autowidth: true,
      resizeColumn: true,
      columns: columns, data: data,
    }
  );
}

function displayChart(data) {

  let pData = [];
  let keys = Object.keys(data[0]).map(function (v) { return parseInt(v.trim()) });
  for (let i = 0; i < data.length; i++) {
    let t = 0;
    for (let k = 1; k < keys.length - 1; k++) {
      t += parseInt((data[i][k]).trim());
    }
    pData.push({ 0: data[i][0], 1: t, 2: data[i][keys.length - 1] });
  }
  var chartdata = pData;

  AmCharts.makeChart("chartId", {
    "path": "/amcharts/",
    "type": "serial",
    //"hideCredits":true,
    "theme": "light",
    "title": "Payoff",
    "dataProvider": chartdata,
    "categoryField": "0", //StockPrice
    "graphs": [
      {
        "id": "graph1",
        "title": "Price",
        "valueField": "1",//Final
        "xField": "2", //Change
        "lineColor": "#45b001",
        "fillColors": "	#45b001",
        "negativeLineColor": "#ec6500",
        "negativeFillColors": "#ec6500",
        "lineThickness": 2,
        "useDataSetColors": false,
        "showBalloon": true,
        "fillAlphas": 0.2,
        "balloonText": "P&L [[value]]",
      },
    ],
    "categoryAxis": {
      "title": "Underlying Price",
      "dashLength": 5,
      "equalSpacing": true,
      "guides": []
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

function addCustomRow(config, label, strikeId, premiumId) {
  let rowView = JSON.parse(JSON.stringify(optionViews))
  rowView.cols[0].label = label + ' (1 lot)'
  rowView.cols[0].id = webix.uid()
  rowView.cols[1].id = strikeIds[strikeId] + config.count
  if (premiumIds[0]) {
    rowView.cols[2].id = premiumIds[premiumId] + config.count
  } else {
    rowView.cols[2].view = 'label'
  }

  let viewId = $$('inputViewId').getBody().addView(rowView)
  $$(viewId).config.lotSize = 1
  config.count = config.count + 1

}
webix.ready(function () {

  var menu_data_multi = [];
  menu_data_multi.push({ id: 'customStrategy', value: 'Custom Strategy' });
  var sArr = Object.keys(strategiesObj);
  for (var i = 0; i < sArr.length; i++) {
    menu_data_multi.push({ id: sArr[i], value: strategiesObj[sArr[i]].label });
  }

  0 && webix.ui({
    id:'mainWinId',
    rows: [
      {
        view: "toolbar", padding: 3, elements: [
          {
            view: "button", type: "icon", icon: "mdi mdi-menu",
            width: 37,
            align: "left",
            css: "app_button",
            click: function () {
              if ($$("sidebarId").isVisible()) {
                $$("sidebarId").hide();
              } else {
                $$("sidebarId").show();
              }
            }
          },
          { view: "label", label: "Option Strategies" },
          {
            view: "button", label: "Download", click: function () {
              downloadOptionChain()
            }
          },
          {
            view: "button", label: "Open Analysis", click: function () {
              //downloadOptionChain()
              displayShortGamma()
            }
          },
          {},
        ]
      },
      {
        cols: [
          {
            view: "sidebar", id: "sidebarId", width: 155, scroll: "auto",
            data: menu_data_multi, on: {
              onAfterSelect: function (id) {
                $$('inputViewId').getBody().reconstruct();
                let strategyLabel = 'Custom Strategy'
                if (id === 'customStrategy') {
                  $$('inputViewId').getBody().addView({
                    cols: [
                      {
                        view: 'button', label: 'BuyCall', count: 0, click: function () {
                          addCustomRow(this.config, 'Buy Call', 0, 0)
                        }
                      },
                      {
                        view: 'button', label: 'SellCall', count: 0, click: function () {
                          addCustomRow(this.config, 'Sell Call', 1, 1)
                        }
                      },
                      {
                        view: 'button', label: 'BuyPut', count: 0, click: function () {
                          addCustomRow(this.config, 'Buy Put', 2, 2)
                        }
                      },
                      {
                        view: 'button', label: 'SellPut', count: 0, click: function () {
                          addCustomRow(this.config, 'Sell Put', 3, 3)
                        }
                      }]
                  });

                  $$('inputViewId').getBody().addView(submitButton);

                } else {
                  strategyLabel = strategiesObj[id].label;
                  prepareStrategy(strategiesObj[id]);
                }
                $$('inputHeaderId').setHTML('<center><b>' + strategyLabel + '</b></center>');
                $$('payoffViewId').getBody().reconstruct();
                $$('payoffViewId').getBody().removeView('payoffLabelId');
              }
            }
          }, { view: "resizer" },
          {
            cols: [
              {
                view: "scrollview",
                width: 320,
                scroll: "auto",
                id: 'inputViewId',
                body: {
                  rows: [
                    { view: 'template', id: 'inputHeaderId', height: 30, template: '' },
                    {
                      cols: [
                        { view: "label", label: '', align: "center" },
                        { view: "label", label: 'Strike', width: 90, align: "center" },
                        { view: "label", label: 'Price(1 lot)', width: 90, align: "center" },

                      ]
                    },
                  ]
                }
              }, { view: "resizer" },
              {
                view: "scrollview",
                id: 'payoffViewId',
                scroll: "auto",
                body: {
                  cols: [
                    { view: 'label', id: 'payoffLabelId', label: 'Please select and enter the input' }
                  ]
                }
              }, { view: "resizer" },
              {
                view: 'template', id: 'payoffChartId', template: '<div id="chartId" style="width:100%; height: 100%"></div>'
              },
              { width: 5 }
            ]
          }
        ]
      }
    ]
  })
  0 && webix.delay(()=> webix.extend($$("mainWinId"), webix.ProgressBar))

});

let twoMinutes = 2 * 60 * 1000 + 15 * 1000
function downloadOptionChain(symbol) {
  //let symbol = SelectedScript
  /*let optionChain = webix.storage.local.get('optionChain')
  let flag = true
  if(optionChain) {
    let d = new Date(optionChain.fetchTime)
    let now = new Date()
    if((d.getTime() + twoMinutes) > now.getTime()) {
      flag = false
    }
  }*/
  $$('mainWinId').showProgress()
  fetch('http://localhost:3000/optionChain?symbol=' + symbol)
    .then(res => {
      return res.text()
    })
    .then(jsonStr => {
      $$('mainWinId').hideProgress()
      let json = JSON.parse(jsonStr)
      if (json.data) {
        json.fetchTime = new Date
        let d = json.data
        let formattedData = {}
        for (let i = 0; i < d.length; i++) {
          let expiryDate = []
          if (formattedData[d[i].expiryDate]) {
            expiryDate = formattedData[d[i].expiryDate]
          } else {
            formattedData[d[i].expiryDate] = expiryDate
          }
          let strikePrice = d[i].strikePrice
          expiryDate.push({ [strikePrice]: { 'PE': d[i]['PE'], 'CE': d[i]['CE'] } })
        }
        json.data = formattedData
        //webix.storage.local.put('optionChain', json)
        optionChainData[symbol] = json
        webix.storage.local.put('optionChainData', optionChainData)
        console.dir(json)
      }
    })
    .catch(err => {$$('mainWinId').hideProgress(); console.error(err)});
}

function formatDateWiseData() {
  let optionChain = webix.storage.local.get('optionChain')
  let data = optionChain.data['08-Jul-2021']
  data = data.sort((a, b) => parseInt(Object.keys(a)[0]) - parseInt(Object.keys(b)[0]))
  console.dir(data)

}

function prepareStrikeWithPremium() {

  // [Strike Price, Bid Price, Ask Price, Volumn, OI]
  PE_OTM = []
  PE_ITM = []

  CE_OTM = []
  CE_ITM = []

  let sData = optionChainData[SelectedScript]
  Underlying_Value = parseInt(sData.underlyingValue)
  let ocArr = sData.data[selectedExpieryDate]
  for (let i = 0; i < ocArr.length; i++) {
    let stPrice = Object.keys(ocArr[i])[0]
    let pe = ocArr[i][stPrice]['PE']
    let ce = ocArr[i][stPrice]['CE']
    if (pe) {
      if (pe.strikePrice < Underlying_Value) {
        PE_OTM.push([pe.strikePrice, pe.bidprice, pe.askPrice, pe.totalTradedVolume, pe.openInterest])
      } else {
        PE_ITM.push([pe.strikePrice, pe.bidprice, pe.askPrice, pe.totalTradedVolume, pe.openInterest])
      }
    }
    if (ce) {
      if (ce.strikePrice < Underlying_Value) {
        CE_ITM.push([ce.strikePrice, ce.bidprice, ce.askPrice, ce.totalTradedVolume, ce.openInterest])
      } else {
        CE_OTM.push([ce.strikePrice, ce.bidprice, ce.askPrice, ce.totalTradedVolume, ce.openInterest])
      }
    }
  }
}

function optionChainPayoffCal(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr) {
  let header = 'On Expiry Closes At , ';
  let arr = [].concat(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr);
  let spArr = [];
  arr.forEach(function (obj) { spArr.push(obj.strikePrice) });
  spArr.sort();

  buyCallArr.forEach(function (obj) {
    header += ('Net Payoff From Call Purchased (' + obj.strikePrice + ') , ')
  });
  sellCallArr.forEach(function (obj) {
    header += ('Net Payoff From Call Sold (' + obj.strikePrice + ') , ')
  });
  buyPutArr.forEach(function (obj) {
    header += ('Net Payoff From Put Purchased (' + obj.strikePrice + ') , ')
  });
  sellPutArr.forEach(function (obj) {
    header += ('Net Payoff From Put Sold (' + obj.strikePrice + ') , ')
  });
  buyStockArr.forEach(function (obj) {
    header += ('Net Payoff From Stock Purchased (' + obj.strikePrice + ') , ')
  });
  sellStockArr.forEach(function (obj) {
    header += ('Net Payoff From Stock Sold (' + obj.strikePrice + ') , ')
  });

  header += 'Net Payoff (Rs.)';
  let headerArr = header.split(' , ');
  //console.dir(header);
  let config = fetchScriptConfig()
  let underlyingVal = parseInt(Underlying_Value * config.outerLimitPer / 100);
  let lowerStrike = spArr[0] - underlyingVal;
  let higherStrike = spArr[spArr.length - 1] + underlyingVal;

  let fullData = [];
  for (let i = lowerStrike; i <= higherStrike; i = i + 1) {
    let val = i + ' , ';
    buyCallArr.forEach(function (obj) {
      val += (buyCall(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
    });

    sellCallArr.forEach(function (obj) {
      val += (sellCall(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
    });

    buyPutArr.forEach(function (obj) {
      val += (buyPut(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
    });

    sellPutArr.forEach(function (obj) {
      val += (sellPut(obj.strikePrice, obj.premium, i) * obj.lotSize) + ' , ';
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
    fullData.push(Object.assign({}, val.split(',').map(v => parseInt(v))));
  }
  return fullData;
}

function shortGammaCal(peOTM, ceOTM) {

  let config = fetchScriptConfig()
  let lowerPrice = Underlying_Value - parseInt(Underlying_Value * config.lowerLimitPer / 100)
  let upperPrice = Underlying_Value + parseInt(Underlying_Value * config.upperLimitPer / 100)
  let lowerPer = Underlying_Value - parseInt(Underlying_Value * config.lowerPer / 100)
  let higherPer = Underlying_Value + parseInt(Underlying_Value * config.higherPer / 100)

  peOTM = peOTM.filter(obj => obj[0] > lowerPrice && obj[0] < lowerPer)
  ceOTM = ceOTM.filter(obj => obj[0] < upperPrice && obj[0] > higherPer)

  let resultArr = []
  let rangeDiff = parseInt(Underlying_Value * config.skipDiffPer / 100)
  for (let sp = 0; sp < peOTM.length - 1; sp++) {
    for (let bp = sp + 1; bp < peOTM.length; bp++) {
      let peCreditAmt = (peOTM[sp][1] * 2) - peOTM[bp][2]

      if (peOTM[sp][3] < 100 || peOTM[bp][3] < 100) {
        if ((peOTM[bp][0] - peOTM[sp][0]) > rangeDiff) {
          break;
        }
        continue;
      }
      let sellPut = {
        strikePrice: peOTM[sp][0],
        premium: peOTM[sp][1],
        lotSize: 2
      }
      let buyPut = {
        strikePrice: peOTM[bp][0],
        premium: peOTM[bp][2],
        lotSize: 1
      }
      for (let cb = 0; cb < ceOTM.length - 1; cb++) {
        for (let cs = cb + 1; cs < ceOTM.length; cs++) {

          let ceCreditAmt = (ceOTM[cs][2] * 2) - ceOTM[cb][1]
          if (ceOTM[cb][3] < 100 || ceOTM[cs][3] < 100) {
            if ((ceOTM[cs][0] - ceOTM[cb][0]) > rangeDiff) {
              break;
            }
            continue;
          }

          if ((ceCreditAmt + peCreditAmt) < config.creditAmt) {
            continue;
          }
          let sellCall = {
            strikePrice: ceOTM[cs][0],
            premium: ceOTM[cs][1],
            lotSize: 2
          }
          let buyCall = {
            strikePrice: ceOTM[cb][0],
            premium: ceOTM[cb][2],
            lotSize: 1
          }
          let d = optionChainPayoffCal([buyCall], [sellCall], [buyPut], [sellPut], [], [])
          let [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer] = findLowerBoundUpperBound(Underlying_Value, d)

          let premiumRec = (sellCall.premium * sellCall.lotSize + sellPut.premium * sellPut.lotSize) - (buyCall.premium * buyCall.lotSize + buyPut.premium * buyPut.lotSize)
          resultArr.push({
            sellPut: sellPut,
            sellCall: sellCall,
            buyPut: buyPut,
            buyCall: buyCall,
            data: d,
            lowerBound: lowerBound,
            uppderBound: uppderBound,
            premiumRec: parseInt(premiumRec),
            sellPutSt: sellPut.strikePrice,
            sellCallSt: sellCall.strikePrice,
            buyPutSt: buyPut.strikePrice,
            buyCallSt: buyCall.strikePrice,

            sellPutPre: sellPut.premium,
            buyPutPre: buyPut.premium,

            sellCallPre: sellCall.premium,
            buyCallPre: buyCall.premium,
            peLS: buyPut.strikePrice - sellPut.strikePrice,
            ceSL: sellCall.strikePrice - buyCall.strikePrice

          })
        }
      }
    }
  }
  console.dir(resultArr)
  return resultArr
}

function displayShortGamma() {
  prepareStrikeWithPremium()
  /* Net Credit
  OTM 2 Short PUT at lower strike & Long PUT at little higher strike than Short PUT
  OTM 2 Short CALL at higher strike & Long CALL at little lower strike than Short CALL 
  */

  //let [ceITM, ceOTM, peITM, peOTM] = preparePremiumData();
  let d = shortGammaCal(PE_OTM, CE_OTM)
  let indexPrice = Underlying_Value

  webix.ui({
    view: "window",
    id: 'strategyWinId',
    width: window.innerWidth - 2,
    height: window.innerHeight - 2,
    position: 'center',
    head: {
      view: "toolbar", id:'shortGammaWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Short Gamma Spread" },
        { view: "label", id: 'spotPriceId', label: SelectedScript + " Spot Price (SP): " + indexPrice },
        { view: "button", label: 'X', width: 50, align: 'right', click: function () { $$('strategyWinId').close(); } }
      ]
    },
    body: {
      view: "datatable",
      id: "",
      columns: [
        {
          id: "lowerBound", header: ["Lower Bound", { content: "numberFilter" }], width: 120, sort: "int", template: function (obj) {
            return obj.lowerBound
          }
        },
        {
          id: "uppderBound", header: ["Upper Bound", { content: "numberFilter" }], width: 120, sort: "int", template: function (obj) {
            return obj.uppderBound
          }
        },
        { id: "premiumRec", header: ["Premium Rec", { content: "numberFilter" }], width: 100, sort: "int", },

        { id: "sellPutSt", header: "PE Short St", width: 100, sort: "int", },
        { id: "buyPutSt", header: "PE Long St", width: 100, sort: "int", },

        { id: "buyCallSt", header: "CE Long St", width: 100, sort: "int", },
        { id: "sellCallSt", header: "CE Short St", width: 100, sort: "int", },

        { id: "peLS", header: ["PE Long-Short", { content: "numberFilter" }], width: 100, sort: "int", },
        { id: "ceSL", header: ["CE Short-Long", { content: "numberFilter" }], width: 100, sort: "int", },
        { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>" },

      ],
      select: "row",
      data: d,
      onClick: {
        details_button: function (ev, id) {
          webix.ui({
            view: "window",
            width: window.innerWidth - 2,
            height: window.innerHeight - 2,
            position: 'center',
            id: 'chartWinId',
            head: {
              view: "toolbar", id: 'shortGammaChartToolbarId', cols: [
                { width: 4 },
                { view: "label", label: "Short Gamma Spread : " + SelectedScript },
                { view:"button", type: 'icon', width: 30, icon:"mdi mdi-information", click: function() { 
                  if ($$("inputInfoId").isVisible()) {
                    $$("inputInfoId").hide();
                  } else {
                    $$("inputInfoId").show();
                  }
                }},
                { view: "button", label: 'X', width: 50, align: 'left', click: function () { $$('chartWinId').close(); } }
              ]
            },
            body: {
              rows:[
                { view: 'template', id: 'inputInfoId', template: 'Info', height: 150, hidden: true},
                {view: 'template', template: '<div id="strategyChartId" style="width: 100%;height: 100%;background-color: aliceblue;"></div>'},
              ]
            }
          }).show();
          displayStrategyChart(this.data.pull[id.row].data, indexPrice)
        }
      }
    }
  }).show();
}

function displayStrategyChart(data, underlyingVal) {

  let pData = [];
  let keys = Object.keys(data[0]);
  for (let i = 0; i < data.length; i++) {
    let t = 0;
    for (let k = 1; k < keys.length - 1; k++) {
      t += parseInt((data[i][k]));
    }
    pData.push({ StockPrice: data[i][0], Final: t, Change: parseFloat((data[i][0] - underlyingVal) * 100 / underlyingVal).toFixed(2) }); // data[i][keys.length-1]
  }
  var chartdata = pData;
  let guides = [{
    "category": underlyingVal,
    "lineColor": "green",
    "lineAlpha": 1,
    "dashLength": 3,
    "inside": false,
    "label": 'Spot Price: ' + underlyingVal,
    "position": top
  }]
  
  guides = guides.concat(upperBoundLowerBoundGraph(underlyingVal, data), supportResistenceGraph())

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
        "fillColors": "	#45b001",
        "negativeLineColor": "#ec6500",
        "negativeFillColors": "#ec6500",
        "lineThickness": 2,
        "useDataSetColors": false,
        "showBalloon": true,
        "fillAlphas": 0.2,
        "balloonText": "P&L [[value]] <br/>Chg. from Spot: ([[Change]]%)",
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

function findLowerBoundUpperBound(underlyingVal, data) {
  let lowerBound = 0
  let uppderBound = 0

  let lowerBoundPer = 0
  let uppderBoundPer = 0

  for (let i = 0; i < data.length - 1; i++) {
    if (data[i][5] > 0) {
      lowerBound = data[i][0]
      lowerBoundPer = parseFloat((lowerBound - underlyingVal) / underlyingVal * 100).toFixed(2) + '% ' + (lowerBound - underlyingVal)
      break
    }
  }
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][5] > 0) {
      uppderBound = data[i][0]
      uppderBoundPer = parseFloat((uppderBound - underlyingVal) / underlyingVal * 100).toFixed(2) + '% ' + (uppderBound - underlyingVal)
      break
    }
  }

  return [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer]
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

function upperBoundLowerBoundGraph(underlyingVal, data) {
  let [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer] = findLowerBoundUpperBound(underlyingVal, data)
  let guides = []
  if (lowerBound != 0) {
    guides.push({
      "category": lowerBound,
      "lineColor": "red",
      "lineAlpha": 1,
      "dashLength": 3,
      "inside": false,
      "label": lowerBound + '(' + lowerBoundPer + ')',
      "position": top
    })
  }
  if (uppderBound != 0) {
    guides.push({
      "category": uppderBound,
      "lineColor": "blue",
      "lineAlpha": 1,
      "dashLength": 3,
      "inside": false,
      "label": uppderBound + '(' + uppderBoundPer + ')',
      "position": top
    })
  }
  return guides
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

function dashboard() {

  var menu_strategies = [];
  menu_strategies.push({ id: 'customStrategy', value: 'Custom Strategy' });
  var sArr = Object.keys(strategiesObj);
  for (var i = 0; i < sArr.length; i++) {
    menu_strategies.push({ id: sArr[i], value: strategiesObj[sArr[i]].label });
  }

  var menu_data_multi = [];
  menu_data_multi.push({ id: 'optionChain', value: 'Optin Chain'});
  menu_data_multi.push({ id: 'strategies', value: 'Option Strategies', data: menu_strategies });
  
  webix.ui({
    id:'mainWinId',
    rows: [
      {
        view: "toolbar", padding: 3, id:'mainToolbarId', elements: [
          {
            view: "button", type: "icon", icon: "mdi mdi-menu",
            width: 37,
            align: "left",
            css: "app_button",
            click: function () {
              if ($$("sidebarId").isVisible()) {
                $$("sidebarId").hide();
              } else {
                $$("sidebarId").show();
              }
            }
          },
          { view: "label", label: "Option Strategies" },
          {},
        ]
      },
      {
        cols: [
          {
            view: "sidebar", id: "sidebarId", width: 155, scroll: "auto",
            data: menu_data_multi, on: {
              onAfterSelect: function (id) {
                if(id === 'optionChain') {
                  $$('strategyViewId').hide();
                  $$('optionChainViewId').show();
                } else {
                  $$('optionChainViewId').hide();
                  $$('strategyViewId').show();

                  $$('inputViewId').getBody().reconstruct();
                let strategyLabel = 'Custom Strategy'
                if (id === 'customStrategy') {
                  $$('inputViewId').getBody().addView({
                    cols: [
                      {
                        view: 'button', label: 'BuyCall', count: 0, click: function () {
                          addCustomRow(this.config, 'Buy Call', 0, 0)
                        }
                      },
                      {
                        view: 'button', label: 'SellCall', count: 0, click: function () {
                          addCustomRow(this.config, 'Sell Call', 1, 1)
                        }
                      },
                      {
                        view: 'button', label: 'BuyPut', count: 0, click: function () {
                          addCustomRow(this.config, 'Buy Put', 2, 2)
                        }
                      },
                      {
                        view: 'button', label: 'SellPut', count: 0, click: function () {
                          addCustomRow(this.config, 'Sell Put', 3, 3)
                        }
                      }]
                  });

                  $$('inputViewId').getBody().addView(submitButton);

                } else {
                  strategyLabel = strategiesObj[id].label;
                  prepareStrategy(strategiesObj[id]);
                }
                $$('inputHeaderId').setHTML('<center><b>' + strategyLabel + '</b></center>');
                $$('payoffViewId').getBody().reconstruct();
                $$('payoffViewId').getBody().removeView('payoffLabelId');
                }
              }
            }
          }, { view: "resizer" },
          {
            cols: [
              {
                view: "scrollview",
                scroll: "auto",
                id: 'optionChainViewId',
                body: {
                  rows: [
                    {
                      view: "toolbar", padding: 3, id:'optionChainToolbarId', elements: [
                        { view: "label", label: "Option Chain" },
                        { 
                          view:"combo", width:200, labelWidth:50, id:"scriptId",
                          label: 'Script:',  placeholder:"Please Select",
                          options:[ 
                            { id:"NIFTY", value:"NIFTY" },
                            { id:"BANKNIFTY", value:"BANKNIFTY" }, 
                            { id:"BHARTIARTL", value:"BHARTIARTL" }
                          ],on:{
                            onChange: function(id){
                              console.dir(id)
                              SelectedScript = id
                            }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download",
                          width: 37, align: "left",
                          click: function () {
                            let s = $$('scriptId').getValue();
                            if(s == "") {
                              //alert('Please select script first :-)')
                              webix.message("Please select script first :-)")
                            } else {
                              downloadOptionChain(s)
                            }
                          }
                        },
                        {
                          view:"combo", width:250, labelWidth:100,
                          label: 'Algo Strategy:', placeholder:"Please Select",
                          options:[ 
                            { id:1, value:"Short Gamma" },
                            { id:2, value:"Short Strangle" }, 
                            { id:3, value:"Long Straddle" }
                          ]
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-google-analytics",
                          width: 37, align: "left",
                          click: function () {
                            let s = $$('scriptId').getValue();
                            if(s == "") {
                              //alert('Please select script first :-)')
                              webix.message("Please select script first :-)")
                            } else {
                              displayShortGamma()
                            }
                          }
                        },
                        {},
                      ]
                    },
                    { view: 'template', id: 'optionChainTemplateId', template: 'Option View' },
                  ]
                }
              },
              {
                id:'strategyViewId',
                hidden: true,
                cols: [
                  {
                    view: "scrollview",
                    width: 320,
                    scroll: "auto",
                    id: 'inputViewId',
                    body: {
                      rows: [
                        { view: 'template', id: 'inputHeaderId', height: 30, template: '' },
                        {
                          cols: [
                            { view: "label", label: '', align: "center" },
                            { view: "label", label: 'Strike', width: 90, align: "center" },
                            { view: "label", label: 'Price(1 lot)', width: 90, align: "center" },
    
                          ]
                        },
                      ]
                    }
                  }, { view: "resizer" },
                  {
                    view: "scrollview",
                    id: 'payoffViewId',
                    scroll: "auto",
                    body: {
                      cols: [
                        { view: 'label', id: 'payoffLabelId', label: 'Please select and enter the input' }
                      ]
                    }
                  }, { view: "resizer" },
                  {
                    view: 'template', id: 'payoffChartId', template: '<div id="chartId" style="width:100%; height: 100%"></div>'
                  },
                  { width: 5 }
                ]
              },
            ]
          }
        ]
      }
    ]
  })
  webix.delay(()=> webix.extend($$("mainWinId"), webix.ProgressBar))
}
dashboard()