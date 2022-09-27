let OptionChainData = webix.storage.local.get('OptionChainData')
if (!OptionChainData) {
  OptionChainData = {}
  webix.storage.local.put('OptionChainData', OptionChainData)
}
let OpstraSD = webix.storage.local.get('OpstraSD')
if (!OpstraSD) {
  OpstraSD = {}
  webix.storage.local.put('OpstraSD', OpstraSD)
} else {
  let k = Object.keys(OpstraSD)
  for (let i = 0; i < k.length; i++) {
    let t1 = new Date(k[i].split('&')[1]).getTime()
    if (t1 < new Date().getTime()) {
      delete OpstraSD[k[i]]
    }
  }
  webix.storage.local.put('OpstraSD', OpstraSD)
}
let DownloadTime = webix.storage.local.get('DownloadTime')
if (!DownloadTime) {
  DownloadTime = {}
  webix.storage.local.put('DownloadTime', DownloadTime)
}
let CashAndCarry = webix.storage.local.get('CashAndCarry')
if (!CashAndCarry) {
  CashAndCarry = []
  webix.storage.local.put('CashAndCarry', CashAndCarry)
}

let iChartScreener = webix.storage.local.get('iChartScreener')
if (!iChartScreener) {
  iChartScreener = []
  webix.storage.local.put('iChartScreener', iChartScreener)
}
/*
let PriceApi = webix.storage.local.get('PriceApi')
if(!PriceApi) {
  PriceApi = {}
  webix.storage.local.put('PriceApi', PriceApi)
}*/

// Cleanup old option chain script data
(function () {
  let d = new Date()
  d.setDate(d.getDate() - 5)
  Object.keys(OptionChainData).forEach(s => {
    let cd = OptionChainData[s]
    let ocDate = new Date(cd.timestamp)
    if (ocDate.getTime() < d.getTime()) {
      delete OptionChainData[s]
    }
  })
  webix.storage.local.put('OptionChainData', OptionChainData)
})()
let TableFilter = {}
let twoMinutes = 2 * 60 * 1000 + 15 * 1000
let DefaultTableConfig = {
  optimize: 'active',
  buildup: 'active'
}
let globalConfig = {
  'default': { lotSize: 1, lowerPer: 4, higherPer: 1, creditAmt: 3, skipDiffPer: 1, lowerLimitPer: 5, upperLimitPer: 5, outerLimitPer: 7, ironConderRange: 10 },
  'BANKNIFTY': { lotSize: 25, lowerPer: 6, higherPer: 6, creditAmt: 40, skipDiffPer: 1.45, lowerLimitPer: 12, upperLimitPer: 12, outerLimitPer: 4, ironConderRange: 500 },
  'NIFTY': { lotSize: 50, lowerPer: 4, higherPer: 4, creditAmt: 20, skipDiffPer: 1.45, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 2, ironConderRange: 300 },
  'TCS': { lotSize: 150, lowerPer: 1, higherPer: 1, creditAmt: 3, skipDiffPer: 1, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 5, ironConderRange: 10 },
}
let loader = '<div class="loader-wrp"><div class="spin-loader" aria-hidden="true"></div></div>'
let emptyRow = '<tr><td colspan="23" class="text-center emptyRow">No Record Found</td></tr>'
let selectScriptRow = '<tr><td colspan="23" class="text-center emptyRow">Please select script and click on download</td></tr>'
// [Strike Price, Bid Price, Ask Price, Volumn, OI, IV]
let PE_OTM = []
let PE_ITM = []
let CE_OTM = []
let CE_ITM = []
let Underlying_Value = 0
let SelectedScript = ''
let SelectedExpiryDate = ''
let CalenderUI = {}
let WatchObj = undefined
let OCChart
function fetchScriptConfig() {
  return globalConfig[SelectedScript] || globalConfig['default']
}
function fetchTableConfig(param) {
  return TableConfig[param] || DefaultTableConfig[param]
}
let TableConfig = webix.storage.local.get('TableConfig')
if (!TableConfig) {
  TableConfig = DefaultTableConfig
  webix.storage.local.put('TableConfig', TableConfig)
}
let WatchList = webix.storage.local.get('WatchList')
if (!WatchList) {
  WatchList = []
  webix.storage.local.put('WatchList', WatchList)
}
let MaxPainList = webix.storage.local.get('MaxPainList')
if (!MaxPainList) {
  MaxPainList = []
  webix.storage.local.put('MaxPainList', MaxPainList)
}
let ContinuousWiseData = webix.storage.local.get('ContinuousWiseData')
if (!ContinuousWiseData) {
  ContinuousWiseData = {}
  webix.storage.local.put('ContinuousWiseData', ContinuousWiseData)
}
let ScriptHistoryData = webix.storage.local.get('ScriptHistoryData')
if (!ScriptHistoryData) {
  ScriptHistoryData = {}
  webix.storage.local.put('ScriptHistoryData', ScriptHistoryData)
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
    { view: "label", label: '', width: 150, align: "center" },
    { view: "text", align: "center", width: 90, inputAlign: "center", },
    { view: "text", align: "center", width: 70, inputAlign: "center", },
    {
      view: "text", align: "center", width: 70, inputAlign: "center", value: 1,
      on: {
        onBlur: function () {
          let v = this.getValue().trim()
          if (v == '' || isNaN(v) || v < 1) {
            this.setValue(1)
          } else {
            this.setValue(v)
          }
        }
      }
    },
  ]
};
let keyIds = ['buyCall', 'sellCall', 'buyPut', 'sellPut', 'buyStock', 'sellStock'];
let strikeIds = ['buyCallStrike_', 'sellCallStrike_', 'buyPutStrike_', 'sellPutStrike_', 'buyStockStrike_', 'sellStockStrike_'];
let premiumIds = ['buyCallPremium_', 'sellCallPremium_', 'buyPutPremium_', 'sellPutPremium_'];
let lotIds = ['buyCallLot_', 'sellCallLot_', 'buyPutLot_', 'sellPutLot_'];

let submitButton = {
  cols: [
    { view: "label", label: '', width: 150, align: "center" },
    {
      view: "button", label: 'Done', align: "center", width: 90, click: function (id, event) {
        let arr = [[], [], [], [], [], []];
        for (let k = 0; k < 6; k++) {
          for (let i = 0; i < 3; i++) {
            if ($$(strikeIds[k] + i)) {
              let obj = {
                strikePrice: parseFloat($$(strikeIds[k] + i).getValue()),
                premium: $$(premiumIds[k] + i) != undefined ? parseFloat($$(premiumIds[k] + i).getValue()) : 0,
                lotSize: $$(lotIds[k] + i) != undefined ? parseFloat($$(lotIds[k] + i).getValue()) : 1
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
      view: "button", label: 'Reset', width: 70, align: "center", click: function (id, event) {

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
    }, { view: "label", label: '', align: "center" },]
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
        rowView.cols[0].label = labels[arr[i]] + (obj[arr[i] + 'Label'] !== undefined ? ' ' + obj[arr[i] + 'Label'][j] : '') + ' @';
        rowView.cols[0].id = webix.uid();
        rowView.cols[1].id = strikeIds[index] + j;
        if (premiumIds[index]) {
          rowView.cols[2].id = premiumIds[index] + j;
          rowView.cols[3].id = lotIds[index] + j;
          rowView.cols[3].value = val[j]
          rowView.cols[3]['on'] = optionViews['cols'][3]['on']
        } else {
          rowView.cols[2].view = 'label';
          rowView.cols[3].view = 'label';
        }
        $$('inputViewId').getBody().addView(rowView);
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
      view: 'datatable', id: 'payoffTableId', headerRowHeight: 120, autowidth: true, hover: "myhover", css: "rows",
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
  rowView.cols[0].label = label + ' @'
  rowView.cols[0].id = webix.uid()
  rowView.cols[1].id = strikeIds[strikeId] + config.count
  if (premiumIds[0]) {
    rowView.cols[2].id = premiumIds[premiumId] + config.count
    rowView.cols[3].id = lotIds[premiumId] + config.count
    rowView.cols[3].value = 1
    rowView.cols[3]['on'] = optionViews['cols'][3]['on']
  } else {
    rowView.cols[2].view = 'label'
    rowView.cols[3].view = 'label'
  }

  let viewId = $$('inputViewId').getBody().addView(rowView)
  config.count = config.count + 1

}
function prepareStrikeWithPremium() {

  // [Strike Price, Bid Price, Ask Price, Volumn, OI, IV]
  PE_OTM = []
  PE_ITM = []

  CE_OTM = []
  CE_ITM = []

  let sData = OptionChainData[SelectedScript]
  let ocArr = sData.data[SelectedExpiryDate] || []
  let allOcs = []
  for (let i = 0; i < ocArr.length; i++) {
    allOcs.push(Object.keys(ocArr[i])[0])
  }
  let closest = allOcs.reduce(function (prev, curr) {
    return Math.abs(curr - Underlying_Value) < Math.abs(prev - Underlying_Value) ? curr : prev;
  });

  for (let i = 0; i < ocArr.length; i++) {
    let stPrice = Object.keys(ocArr[i])[0]
    let pe = ocArr[i][stPrice]['PE']
    let ce = ocArr[i][stPrice]['CE']
    if (pe) {
      if (pe.strikePrice <= closest) {
        PE_OTM.push([pe.strikePrice, pe.bidprice, pe.askPrice, pe.totalTradedVolume, pe.openInterest, pe.impliedVolatility])
      } else {
        PE_ITM.push([pe.strikePrice, pe.bidprice, pe.askPrice, pe.totalTradedVolume, pe.openInterest, pe.impliedVolatility])
      }
    }
    if (ce) {
      if (ce.strikePrice <= closest) {
        CE_ITM.push([ce.strikePrice, ce.bidprice, ce.askPrice, ce.totalTradedVolume, ce.openInterest, ce.impliedVolatility])
      } else {
        CE_OTM.push([ce.strikePrice, ce.bidprice, ce.askPrice, ce.totalTradedVolume, ce.openInterest, ce.impliedVolatility])
      }
    }
  }
}
function optionChainPayoffCal(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr) {
  let arr = [].concat(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr);
  let spArr = [];
  arr.forEach(function (obj) { spArr.push(obj.strikePrice) });
  spArr.sort();

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
  let belowUpperLimitSt = Underlying_Value - parseInt(Underlying_Value * config.lowerLimitPer / 100)
  let aboveUpperLimitSt = Underlying_Value + parseInt(Underlying_Value * config.upperLimitPer / 100)

  let belowLowerLimitSt = Underlying_Value - parseInt(Underlying_Value * config.lowerPer / 100)
  let aboveLowerLimitSt = Underlying_Value + parseInt(Underlying_Value * config.higherPer / 100)

  peOTM = peOTM.filter(obj => obj[0] > belowUpperLimitSt && obj[0] < belowLowerLimitSt)
  ceOTM = ceOTM.filter(obj => obj[0] < aboveUpperLimitSt && obj[0] > aboveLowerLimitSt)

  let resultArr = []
  let rangeDiff = parseInt(Underlying_Value * config.skipDiffPer / 100)
  for (let sp = 0; sp < peOTM.length - 1; sp++) {
    for (let bp = sp + 1; bp < peOTM.length; bp++) {
      if (peOTM[sp][3] < 100 || peOTM[bp][3] < 100) {
        if ((peOTM[bp][0] - peOTM[sp][0]) > rangeDiff) {
          break;
        }
        continue;
      }
      for (let bc = 0; bc < ceOTM.length - 1; bc++) {
        for (let sc = bc + 1; sc < ceOTM.length; sc++) {
          if (ceOTM[bc][3] < 100 || ceOTM[sc][3] < 100) {
            if ((ceOTM[sc][0] - ceOTM[bc][0]) > rangeDiff) {
              break;
            }
            continue;
          }
          let peCreditAmt = (peOTM[sp][1] * 2) - peOTM[bp][2]
          let ceCreditAmt = (ceOTM[sc][1] * 2) - ceOTM[bc][2]
          let premiumRec = ceCreditAmt + peCreditAmt
          if (premiumRec < config.creditAmt) {
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

          let sellCall = {
            strikePrice: ceOTM[sc][0],
            premium: ceOTM[sc][1],
            lotSize: 2
          }
          let buyCall = {
            strikePrice: ceOTM[bc][0],
            premium: ceOTM[bc][2],
            lotSize: 1
          }
          let d = optionChainPayoffCal([buyCall], [sellCall], [buyPut], [sellPut], [], [])
          let [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer] = findLowerBoundUpperBound(Underlying_Value, d)

          resultArr.push({
            sellPut: sellPut,
            sellCall: sellCall,
            buyPut: buyPut,
            buyCall: buyCall,
            data: d,
            lowerBound: lowerBound,
            uppderBound: uppderBound,
            premiumRec: parseFloat(premiumRec).toFixed(2),

            sellPutSt: sellPut.strikePrice,
            sellCallSt: sellCall.strikePrice,
            buyPutSt: buyPut.strikePrice,
            buyCallSt: buyCall.strikePrice,

            sellPutPre: sellPut.premium,
            buyPutPre: buyPut.premium,
            sellCallPre: sellCall.premium,
            buyCallPre: buyCall.premium,

            peLS: buyPut.strikePrice - sellPut.strikePrice,
            ceSL: sellCall.strikePrice - buyCall.strikePrice,

            upPer: parseFloat((uppderBound - Underlying_Value) / Underlying_Value * 100).toFixed(2),
            downPer: parseFloat((lowerBound - Underlying_Value) / Underlying_Value * 100).toFixed(2),
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
  OTM 2 Short PUT at lower strike & 1 Long PUT at little higher strike than Short PUT
  OTM 2 Short CALL at higher strike & 1 Long CALL at little lower strike than Short CALL 
  */

  //let [ceITM, ceOTM, peITM, peOTM] = preparePremiumData();
  let d = shortGammaCal(PE_OTM, CE_OTM)

  webix.ui({
    view: "window",
    id: 'strategyWinId',
    width: window.innerWidth - 2,
    height: window.innerHeight - 2,
    position: 'center',
    head: {
      view: "toolbar", id: 'strategyWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Short Gamma Spread: " + SelectedScript + '  [' + SelectedExpiryDate + ']' },
        { view: "label", id: 'spotPriceId', label: SelectedScript + " Spot Price (SP): " + Underlying_Value },
        { view: "button", label: 'X', width: 50, align: 'right', click: function () { $$('strategyWinId').close(); } }
      ]
    },
    body: {
      view: "datatable",
      id: "strategyDatatableId",
      hover: "myhover", css: "rows",
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
        { id: "premiumRec", header: ["Premium Rec", { content: "numberFilter" }], width: 150, sort: "int", },

        { id: "peLS", header: ["PE Long-Short", { content: "numberFilter" }], width: 150, sort: "int", },
        { id: "ceSL", header: ["CE Short-Long", { content: "numberFilter" }], width: 150, sort: "int", },
        { id: "downPer", header: ["<-- %", { content: "numberFilter" }], width: 100, sort: "int" },
        { id: "upPer", header: ["--> %", { content: "numberFilter" }], width: 100, sort: "int" },
        { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>", fillspace: true },

      ],
      select: "row",
      data: d,
      onClick: {
        details_button: function (ev, id) {

          let obj = this.data.pull[id.row]
          let peSell = {
            buyOrSell: SELL,
            type: PE_TYPE,
            strikePrice: obj.sellPutSt,
            premium: obj.sellPutPre,
            lots: 2
          }

          let peBuy = {
            buyOrSell: BUY,
            type: PE_TYPE,
            strikePrice: obj.buyPutSt,
            premium: obj.buyPutPre,
            lots: 1
          }

          let ceSell = {
            buyOrSell: SELL,
            type: CE_TYPE,
            strikePrice: obj.sellCallSt,
            premium: obj.sellCallPre,
            lots: 2
          }

          let ceBuy = {
            buyOrSell: BUY,
            type: CE_TYPE,
            strikePrice: obj.buyCallSt,
            premium: obj.buyCallPre,
            lots: 1
          }

          strategyCal(Underlying_Value, SelectedScript, SelectedExpiryDate, [peSell, peBuy, ceSell, ceBuy])

        }
      }
    }
  }).show();
}

function findLowerBoundUpperBound(underlyingVal, data) {
  let lowerBound = 0
  let uppderBound = 0

  let lowerBoundPer = 0
  let uppderBoundPer = 0
  let totalIndex = 0
  if (data.length > 0) {
    totalIndex = Object.keys(data[0]).length - 1
  }
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i][totalIndex] > 0) {
      lowerBound = data[i][0]
      lowerBoundPer = parseFloat((lowerBound - underlyingVal) / underlyingVal * 100).toFixed(2) + '% ' + parseFloat((lowerBound - underlyingVal)).toFixed(2)
      break
    }
  }
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][totalIndex] > 0) {
      uppderBound = data[i][0]
      uppderBoundPer = parseFloat((uppderBound - underlyingVal) / underlyingVal * 100).toFixed(2) + '% ' + parseFloat((uppderBound - underlyingVal)).toFixed(2)
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
function findActiveCallAndPut() {

  // [Strike Price, Bid Price, Ask Price, Volumn, OI]

  let ceVol = []
  CE_OTM.forEach(a => ceVol.push(a[3]))
  ceVol.sort((a, b) => { return b - a })
  let peVol = []
  PE_OTM.forEach(a => peVol.push(a[3]))
  peVol.sort((a, b) => { return b - a })

  let R = []
  CE_OTM.forEach(a => {
    if (a[3] == ceVol[1]) {
      R.push(a[0])
    } else if (a[3] == ceVol[0]) {
      R.push(a[0])
    }
  })
  R.sort()
  let S = []
  PE_OTM.forEach(a => {
    if (a[3] == peVol[1]) {
      S.push(a[0])
    } else if (a[3] == peVol[0]) {
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
      "lineColor": "black",
      "lineAlpha": 1,
      "dashLength": 10,
      "inside": false,
      "label": lowerBound + '(' + lowerBoundPer + ')',
      "position": top
    })
  }
  if (uppderBound != 0) {
    guides.push({
      "category": uppderBound,
      "lineColor": "black",
      "lineAlpha": 1,
      "dashLength": 10,
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
function initEventListeners() {
  let optionChainResId = document.querySelector('#optionChainResId')
  optionChainResId.addEventListener('change', (e) => {
    //let tempData = webix.storage.session.get('tempData')
    let tempData = JSON.parse(e.target.value)
    e.target.value = ''
    let expiryDates = Object.keys(tempData.data).sort((a, b) => { if (new Date(a) > new Date(b)) { return 1 } else { return -1 } })
    if (expiryDates.length > 4) {
      let near = new Date(expiryDates[0])
      let nearArr = near.toDateString().split(' ')

      let next = new Date(expiryDates[0])
      next.setMonth(next.getMonth() + 1)
      let nextArr = next.toDateString().split(' ')

      let far = new Date(expiryDates[0])
      far.setMonth(far.getMonth() + 2)
      let farArr = far.toDateString().split(' ')

      let dsArr = [nearArr[1] + '-' + nearArr[3], nextArr[1] + '-' + nextArr[3], farArr[1] + '-' + farArr[3],]
      for (let i = 0; i < expiryDates.length; i++) {
        if (!dsArr.includes(expiryDates[i].substring(3))) {
          delete tempData.data[expiryDates[i]]
        }
      }
    }
    if (SelectedExpiryDate == '') {
      expiryDates = Object.keys(tempData.data).sort((a, b) => { if (new Date(a) > new Date(b)) { return 1 } else { return -1 } })
      $$('expiryDateId').define('options', expiryDates)
      tempData.SelectedExpiryDate = expiryDates[0].id
      SelectedExpiryDate = tempData.SelectedExpiryDate
      $$('expiryDateId').setValue(SelectedExpiryDate)
    } else {
      tempData.SelectedExpiryDate = SelectedExpiryDate
    }

    OptionChainData[SelectedScript] = tempData
    webix.storage.local.put('OptionChainData', OptionChainData)
    let sData = OptionChainData[SelectedScript]
    Underlying_Value = sData.underlyingValue
    $$('optionChainTemplateId').setValues({
      data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp,
      selectedStrike: TableFilter['selectedStrike'], expiryDate: TableFilter['expiryDate'], ceITM: TableFilter['ceITM'], peITM: TableFilter['peITM']
    })
  })

  let optionHistoryResId = document.querySelector('#optionHistoryResId')
  optionHistoryResId.addEventListener('change', (e) => {
    let optionHistory = webix.storage.session.get('optionHistory')
    let input = webix.storage.session.get('optionHistoryInput')
    let d = []
    if (!optionHistory || !optionHistory.data) {
      alert('Something went wrong :-)');
    }
    let t = optionHistory.data
    for (let i = 0; i < t.length - 1; i++) {
      let per = parseFloat((t[i]['FH_SETTLE_PRICE'] - t[i + 1]['FH_SETTLE_PRICE']) / t[i + 1]['FH_SETTLE_PRICE'] * 100).toFixed(2)
      d.push({
        'dateId': t[i]['FH_TIMESTAMP'], 'priceId': t[i]['FH_SETTLE_PRICE'], 'perId': per + '%',
        changeId: parseFloat((t[i]['FH_SETTLE_PRICE'] - t[i + 1]['FH_SETTLE_PRICE'])).toFixed(2),
        oi: t[i]['FH_OPEN_INT'], changeOI: parseInt(t[i]['FH_CHANGE_IN_OI'])
      })
    }
    webix.ui({
      view: "window",
      height: 450,
      width: 650,
      move: true,
      modal: true,
      id: 'optionHisWinId',
      head: {
        view: "toolbar", id: 'strategyWinToolbarId', cols: [
          { width: 4 },
          { view: "label", label: "Type: " + input.optionType + ", " + input.strikePrice + ", " + input.expiryDate + ", " + input.symbol },
          { view: "button", label: 'X', width: 50, align: 'left', click: function () { $$('optionHisWinId').close(); } }
        ]
      },
      position: "center",
      body: {
        view: "datatable", hover: "myhover", css: "rows",
        columns: [{ id: 'dateId', header: 'Date' }, { id: 'priceId', header: 'Price' },
        { id: 'changeId', header: 'Change' }, { id: 'perId', header: '%' },
        { id: 'oi', header: 'OI' }, { id: 'changeOI', header: 'Change In OI', width: 120 }],
        data: d
      }
    }).show();

  })

  let etDatepickerResId = document.querySelector('#etDatepickerResId')
  etDatepickerResId.addEventListener('change', (e) => {
    let jsonArr = webix.storage.session.get('tempETDatepickerRes')
    $$('etDatatableId').clearAll()
    $$('etDatatableId').parse(jsonArr.searchResult)
  })

  let mcResultCalendarResId = document.querySelector('#mcResultCalendarResId')
  mcResultCalendarResId.addEventListener('change', (e) => {
    let html = localStorage.getItem('AllResultCalendar')
    $$('allResultCalendarId').setHTML(html);

    let rcArr = webix.storage.local.get('AllResultCalendarArr')
    let s = new Set()
    rcArr.forEach(r => {
      s.add(r[2])
    })

    let l = $$('resultDateId').getList()
    l.clearAll()
    let vArr = ['All']
    for (var value of s) {
      vArr.push(value);
    }
    l.parse(['All', ...vArr.sort()])
    $$('allResultCalendarTempId').refresh()
  })

  let maxPainStocksResId = document.querySelector('#maxPainStocksResId')
  maxPainStocksResId.addEventListener('change', (e) => {
    MaxPainList = webix.storage.local.get('MaxPainList')
    $$('maxPainForAllDatatableId').clearAll()
    $$('maxPainForAllDatatableId').parse(MaxPainList)
    $$('maxPainTempId').refresh()
  })

  let nifty50StocksResId = document.querySelector('#nifty50StocksResId')
  nifty50StocksResId.addEventListener('change', (e) => {
    let Nifty50Stocks = webix.storage.session.get('Nifty50Stocks')
    $$('nifty50StockDatatableId').clearAll()
    $$('nifty50StockDatatableId').parse(Nifty50Stocks)
  })

  let ocGraphResId = document.querySelector('#ocGraphResId')
  ocGraphResId.addEventListener('change', (e) => {
    showOptionChart()
  })

  let googleGraphResId = document.querySelector('#googleGraphResId')
  googleGraphResId.addEventListener('change', (e) => {
    let html = sessionStorage.getItem('GoogleGraph')
    let googleGraph = document.querySelector('#googleGraph')
    googleGraph.innerHTML = html
  })

  let messageStatusId = document.querySelector('#messageStatusId')
  messageStatusId.addEventListener('change', (e) => {
    let vArr = e.target.value.split('$')
    let type = vArr[1] || 'info'
    webix.message({ text: vArr[0], type: type, expire: 1500 })
  })

  let ichartSentimentResId = document.querySelector('#ichartSentimentResId')
  ichartSentimentResId.addEventListener('change', (e) => {
    webix.ui({
      view: "window",
      fullscreen: true,
      id: 'ichartSentimentWinId',
      head: {
        view: "toolbar", id: 'strategyWinToolbarId', cols: [
          { width: 4 },
          { view: "label", label: "i Chart Sentiment:" },
          {
            view: "button", label: 'X', width: 40, align: 'left', click: function () {
              $$('ichartSentimentWinId').close();
            }
          }]
      },
      position: "center",
      body: {
        rows: [
          { view: 'template', template: '<div id="iChartSentiment" style="width:100%;height:100%;overflow: auto;"></div>' },
          { height: 10 }]
      },
      on: {
        onShow: function () {
          document.getElementById("iChartSentiment").innerHTML = sessionStorage.getItem('iChartSentiment')
        }
      }
    }).show();
  })

  let cashAndCarryResId = document.querySelector('#cashAndCarryResId')
  cashAndCarryResId.addEventListener('change', (e) => {
    CashAndCarry = webix.storage.session.get('CashAndCarry')
    $$('cashAndCarryDatatableId').refresh()
    $$('revCashAndCarryDatatableId').refresh()
  })

  let priceApiResId = document.querySelector('#priceApiResId')
  priceApiResId.addEventListener('change', (e) => {
    let id = $$("scriptCalendarId").getValue()
    if (id) {
      CalenderUI = processDataForCalenderUI(id)
      $$('script_calendar').refresh()
    }
  })

  let optionAllHistoryResId = document.querySelector('#optionAllHistoryResId')
  optionAllHistoryResId.addEventListener('change', async (e) => {
    //let json = webix.storage.session.get('optionAllHistoryTemp')
    let json = JSON.parse(e.target.value)
    e.target.value = ''
    let ed = json['ed']
    json = json.data
    if (json) {
      let od = await getDataSyncOptionHistoryStore(ed)
      let d = json
      if (od) {
        d = {...od, ...json}
      }
      let flag = await putDataSyncOptionHistoryStore(d, ed)
      flag && console.dir('Successfully added response')
    }
  })

}
let ViewIds = ['strategyViewId', 'worldMarketViewId', 'calendarWiseViewId', 'optionChainViewId', 'etResultCalendarViewId', 'etEconomicCalendarViewId',
  'continuousWiseViewId', 'yearWiseViewId', 'watchListViewId', 'maxPainForAllViewId', 'nifty50StockViewId',
  'moneycontroRCViewId', 'cashAndCarryViewId']
webix.ready(function () {
  initEventListeners()
  var menu_strategies = []
  menu_strategies.push({ id: 'customStrategy', value: 'Custom Strategy' })
  var sArr = Object.keys(strategiesObj)
  for (var i = 0; i < sArr.length; i++) {
    menu_strategies.push({ id: sArr[i], value: strategiesObj[sArr[i]].label })
  }

  var menu_data_multi = []
  menu_data_multi.push({ id: 'optionChain', value: 'Option Chain' })
  menu_data_multi.push({ id: 'moneycontroRC', value: 'All Result Calendar' })
  menu_data_multi.push({ id: 'nifty50Stocks', value: 'Nifty 50 Stocks' })
  menu_data_multi.push({ id: 'maxPainStocks', value: 'Max Pain For Stocks' })
  menu_data_multi.push({ id: 'worldMarket', value: 'World Market' })
  menu_data_multi.push({ id: 'etResultCalendar', value: 'Result Calendar' })
  menu_data_multi.push({ id: 'etEconomicCalendar', value: 'Economic Calendar' })
  menu_data_multi.push({ id: 'watchList', value: 'Watch List' })
  menu_data_multi.push({
    id: 'analytics', value: 'Script Analytics', data: [
      { id: 'calendarWise', value: 'Calendar Wise' },
      { id: 'continuousWiseId', value: 'Continuous Wise' },
      { id: 'yearWiseId', value: 'Year Wise' },
    ]
  })
  menu_data_multi.push({
    id: 'news', value: 'News', data: [
      { id: 'businesstodayId', value: 'Business Today' },
      { id: 'moneycontrolId', value: 'Moneycontrol' },
      { id: 'dalalstreetId', value: 'Dalal Street' },
    ]
  })
  menu_data_multi.push({ id: 'cashAndCarry', value: 'Cash & Carry Arbitrage' })
  menu_data_multi.push({
    id: 'externalLinks', value: 'External Links', data: [
      { id: 'liveTV', value: 'Live TV' },
      { id: 'indianMarket', value: 'Indian Market' },
      { id: 'resultCalendar', value: 'Result Calendar' },
      { id: 'earningsCalendar', value: 'Earnings Calendar' },
      { id: 'trendlyne', value: 'Trendlyne' },
      { id: 'niftyMaxPain', value: 'Nifty Max Pain' },
      { id: 'niftyTaDesk', value: 'Nifty TA Desk' },
      { id: 'tradingView', value: 'Trading View' },
      { id: 'icharts', value: 'i Charts' },
      { id: 'tickertape', value: 'Ticker Tape' },
      { id: 'allStrategyGraph', value: 'All Option Strategies' },

    ]
  })

  menu_data_multi.push({
    id: 'usefulWebsites', value: 'Useful Websites', data: [
      { id: 'opstraId', value: 'Opstra Options Analysis' }, { id: 'neostoxId', value: 'Neostox' },
      { id: 'pasiId', value: 'Pasi Technologies' }, { id: 'eqsisId', value: 'Eqsis' }, { id: 'niftyIndicesId', value: 'Nifty Indices' },
    ]
  })

  //menu_data_multi.push({ id: 'strategies', value: 'Option Strategies', data: menu_strategies })
  webix.ui({
    id: 'mainWinId',
    rows: [
      {
        view: "toolbar", padding: 3, id: 'mainToolbarId', elements: [
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
            view: "template", id: "tradingViewTempId", width: 50, template: function (obj) {
              return '<div class="webix_tv"><svg width="36" height="28" viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg"><path d="M14 22H7V11H0V4h14v18zM28 22h-8l7.5-18h8L28 22z" fill="currentColor"></path><circle cx="20" cy="8" r="4" fill="currentColor"></circle></svg></div>'
            }, onClick: {
              "webix_tv": function (ev, id) {
                let s = $$('scriptId').getValue()
                if (s == '') {
                  alert('Please select Script')
                } else if (s == 'NIFTY') {
                  window.open('https://www.moneycontrol.com/mc/indianindices/chart?indice_id=9')
                } else if (s == 'BANKNIFTY') {
                  window.open('https://www.moneycontrol.com/mc/indianindices/chart?indice_id=23')
                } else {
                  window.open('https://www.moneycontrol.com/mc/stock/chart?scId=' + s + '&exchangeId=' + s + '&ex=NSE&theme=dark')
                }
                return false;
              }
            }
          },
          { view: "button", label: "Technical", width: 85, click: function () { showStreakAnalytics() } },
          { view: "button", label: "Open Strategy", width: 120, click: function () { strategyCal() } },
          {
            view: "button", type: "icon", icon: "mdi mdi-history", id: "scriptHistoryId", width: 30, align: "left", click: function () {
              if (SelectedScript) {
                openScriptDailyDetails(SelectedScript)
              } else {
                alert('Please select script')
              }
            }
          },
          {
            view: "button", /*type: "image", image:"/images/ag-grid.png"*/type: "icon", icon: "mdi mdi-view-grid", id: "optionAllHistoryButtonId", width: 30, align: "left", click: function () {
              displayOptionAllHistoryData()
            }
          },
          {
            view: "button", type: "icon", icon: "mdi mdi-account-details", id: "ichartSentimentId", width: 30, align: "left", click: function () {
              if (SelectedScript) {
                dispatchChangeEvent('#ichartSentimentReqId', SelectedScript)
                //dispatchChangeEvent('#priceApiReqId', SelectedScript)
                //dispatchChangeEvent('#businesstodayReqId')
              } else {
                alert('Please select script')
              }
            }
          },
          {
            view: 'template', id: 'scriptAnalyticsId', css: 'webix-control', width: 650, template: function (obj) {
              if (webix.isArray(obj)) {
                let d1 = obj[3] > 0 ? `<span class="green">${obj[3]}%</span>` : `<span class="red">${obj[3]}%</span>`
                let w1 = obj[4] > 0 ? `<span class="green">${obj[4]}%</span>` : `<span class="red">${obj[4]}%</span>`
                let m1 = obj[5] > 0 ? `<span class="green">${obj[5]}%</span>` : `<span class="red">${obj[5]}%</span>`
                let m3 = obj[6] > 0 ? `<span class="green">${obj[6]}%</span>` : `<span class="red">${obj[6]}%</span>`
                let y1 = obj[7] > 0 ? `<span class="green">${obj[7]}%</span>` : `<span class="red">${obj[7]}%</span>`
                let yearWise = yearWisePercentageCal(SelectedScript)[0]
                let yearW = yearWise['below52WksPer'] > 0 ? `<span class="green">${yearWise['below52WksPer']}%</span>` : `<span class="red">${yearWise['below52WksPer']}%</span>`
                let h = `1D: ${d1}  1W: ${w1}  1M: ${m1}  3M: ${m3}  1Y: ${y1} Below 1Y: ${yearW} On Date: ${obj[44]}`
                return h
              } else {
                return ''
              }
            }
          },
        ]
      },
      {
        cols: [
          {
            view: "sidebar", id: "sidebarId", width: 155, scroll: "auto",
            data: menu_data_multi, on: {
              onAfterSelect: function (id) {
                if (id === 'optionChain') { showViewId('optionChainViewId') }
                else if (id == 'worldMarket') {
                  showViewId('worldMarketViewId')
                  dispatchChangeEvent('#worldMarketId')
                } else if (id === 'liveTV') { window.open('https://www.cnbctv18.com/live-tv/') }
                else if (id === 'indianMarket') { window.open('https://content.indiainfoline.com/_media/iifl/img/research_reports/pdf/morning-note.pdf?t=' + new Date().getTime()) }
                else if (id === 'resultCalendar') { window.open('https://www.moneycontrol.com/markets/earnings/results-calendar/') }
                else if (id === 'earningsCalendar') { window.open('https://www.moneycontrol.com/earnings-calendar') }
                else if (id === 'trendlyne') { window.open('https://trendlyne.com/my-trendlyne/recommended/') }
                else if (id === 'calendarWise') { showViewId('calendarWiseViewId') }
                else if (id == 'niftyMaxPain') { window.open('https://www.niftytrader.in/options-max-pain-chart-live/nifty') }
                else if (id == 'niftyTaDesk') { window.open('https://stockezee.com/nifty-ta-desk') }
                else if (id == 'opstraId') { window.open('https://opstra.definedge.com/') }
                else if (id == 'neostoxId') { window.open('https://neostox.com/') }
                else if (id == 'pasiId') { window.open('http://www.pasitechnologies.com/') }
                else if (id == 'eqsisId') { window.open('https://www.eqsis.com/nse-max-pain-analysis/') }
                else if (id == 'niftyIndicesId') {
                  window.open('https://www.niftyindices.com/market-data/live-index-watch')
                }
                else if (id == 'businesstodayId') {
                  window.open('https://www.businesstoday.in/markets');
                  window.open('https://www.businesstoday.in/latest/corporate')
                }
                else if (id == 'moneycontrolId') {
                  window.open('https://www.moneycontrol.com/news/business/markets/')
                }
                else if (id == 'dalalstreetId') {
                  window.open('https://www.dsij.in/insight/trending-news/mindshare');
                  window.open('https://www.dsij.in/markets/reports/market-reports');
                  window.open('https://www.dsij.in/markets/reports/broker-reports');
                }
                else if (id == 'etResultCalendar') { showViewId('etResultCalendarViewId') }
                else if (id == 'etEconomicCalendar') { window.open('https://www.moneycontrol.com/economic-calendar'); }
                else if (id == 'moneycontroRC') { showViewId('moneycontroRCViewId') }
                else if (id == 'cashAndCarry') { showViewId('cashAndCarryViewId') }
                else if (id == 'maxPainStocks') {
                  showViewId('maxPainForAllViewId')
                  //dispatchChangeEvent('#maxPainStocksReqId')
                }
                else if (id == 'nifty50Stocks') {
                  showViewId('nifty50StockViewId')
                }
                else if (id == 'watchList') {
                  showViewId('watchListViewId')
                  watchListCal()
                  $$('watchListDatatableId').clearAll()
                  $$('watchListDatatableId').parse(WatchList)
                }
                else if (id == 'tradingView') { window.open('https://www.tradingview.com/chart/uFSqmfFr/') }
                else if (id == 'allStrategyGraph') { window.open('charts.png') }
                else if (id == 'icharts') { window.open('https://main.icharts.in/hcharts-v4.html') }
                else if (id == 'tickertape') { window.open('https://www.tickertape.in/stocks') }
                else if (id == 'continuousWiseId') {
                  showViewId('continuousWiseViewId')
                  continuousWiseAllCal()
                  displayContinuousData()
                } else if (id == 'yearWiseId') {
                  showViewId('yearWiseViewId')
                  let sArr = yearWisePercentageCal()
                  $$('yearWiseDatatableId').clearAll()
                  $$('yearWiseDatatableId').parse(sArr)
                }
                else {
                  $$('strategyViewId').show()
                  showViewId('strategyViewId')
                  $$('inputViewId').getBody().reconstruct()
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
                    strategyLabel = strategiesObj[id].label
                    prepareStrategy(strategiesObj[id])
                  }
                  $$('inputHeaderId').setHTML('<center><b>' + strategyLabel + '</b></center>')
                  $$('payoffViewId').getBody().reconstruct()
                  $$('payoffViewId').getBody().removeView('payoffLabelId')
                  $$('payoffChartId').refresh()
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
                      view: "toolbar", padding: 3, id: 'optionChainToolbarId', elements: [
                        //{ view: "label", width:100, label: "Option Chain" },
                        { view: "button", type: "icon", width: 37, align: "left", icon: "mdi mdi-table-settings", id: "tableSettingsId", popup: "table_pop" },
                        {
                          view: "combo", width: 130, id: "scriptId",
                          placeholder: "Select Script",
                          options: ['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()],
                          on: {
                            onChange: function (id) {
                              SelectedScript = id
                              $$('maxPainLabelId').setHTML('')
                              if (id == '') {
                                $$('algoStrategyId').setValue('')
                                $$('underlyingValId').setHTML('')
                                $$('expiryDateId').define('options', [])
                                $$('expiryDateId').setValue('')
                                SelectedExpiryDate = ''
                              } else {
                                DownloadTime['lastViewedScript'] = id
                                webix.storage.local.put('DownloadTime', DownloadTime)
                                TableFilter = {}
                                let sData = OptionChainData[SelectedScript]
                                if (!sData) {
                                  $$('expiryDateId').define('options', [])
                                  $$('expiryDateId').setValue('')
                                  SelectedExpiryDate = ''
                                }
                                if (SelectedScript && sData) {
                                  let sData = OptionChainData[SelectedScript]
                                  Underlying_Value = sData.underlyingValue

                                  let expiryDates = Object.keys(sData.data).sort((a, b) => { if (new Date(a) > new Date(b)) { return 1 } else { return -1 } })
                                  $$('expiryDateId').define('options', expiryDates)

                                  if (sData.SelectedExpiryDate) {
                                    SelectedExpiryDate = sData.SelectedExpiryDate
                                  } else {
                                    SelectedExpiryDate = expiryDates[0].id
                                  }

                                  $$('expiryDateId').setValue(SelectedExpiryDate)
                                  $$('optionChainTemplateId').setValues({ data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp })
                                } else {
                                  $$('expiryDateId').define('options', [])
                                  webix.delay(() => document.getElementById("indices-body").innerHTML = selectScriptRow)
                                }
                                MaxPainList = webix.storage.local.get('MaxPainList')
                                MaxPainList.forEach(v => {
                                  if (v.symbol_name == SelectedScript) {
                                    $$('maxPainLabelId').setHTML('Max Pain: <b>' + v.max_pain + '</b>')
                                  }
                                })
                                $$('scriptAnalyticsId').setValues(webix.storage.local.get('iChartScreener')[id])
                              }
                            },
                            onAfterRender: function () {
                              $$('scriptId').setValue(DownloadTime['lastViewedScript'] || 'NIFTY')
                            }
                          }
                        },
                        {
                          view: "combo", width: 210, labelWidth: 85, id: "expiryDateId",
                          label: 'Expiry Date:', placeholder: "Select Date",
                          options: [], on: {
                            onChange: function (id) {
                              //console.dir(id)
                              if (id != '') {
                                if (SelectedExpiryDate != id) {
                                  SelectedExpiryDate = id
                                  let sData = OptionChainData[SelectedScript]
                                  Underlying_Value = sData.underlyingValue
                                  sData.SelectedExpiryDate = SelectedExpiryDate
                                  $$('strikePriceId').hide()
                                  $$('algoStrategyId').show()
                                  $$('algoStrategyButtonId').show()
                                  TableFilter = {}
                                  $$('optionChainTemplateId').setValues({ data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp })
                                }
                              }
                            }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download", id: "scriptDownloadId",
                          width: 37, align: "left",
                          click: function () {
                            $$("sidebarId").hide();
                            let s = $$('scriptId').getValue();
                            if (s == "") {
                              webix.message({ text: "Please select script :-)", type: "info " })
                            } else {
                              let sData = OptionChainData[SelectedScript]
                              if (sData) {
                                let d = new Date(sData.fetchTime)
                                let now = new Date()
                                if (now.getTime() > (d.getTime() + twoMinutes)) {
                                  dispatchChangeEvent('#optionChainReqId', s)
                                } else {
                                  Underlying_Value = sData.underlyingValue
                                  //$$('optionChainTemplateId').setValues({data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp})
                                  $$('optionChainTemplateId').setValues({
                                    data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp,
                                    selectedStrike: TableFilter['selectedStrike'], expiryDate: TableFilter['expiryDate'], ceITM: TableFilter['ceITM'], peITM: TableFilter['peITM']
                                  })
                                }
                              } else {
                                dispatchChangeEvent('#optionChainReqId', s)
                              }
                            }
                          }
                        },
                        { view: 'label', width: 350, id: 'strikePriceId', hidden: true },
                        {
                          view: "combo", width: 250, labelWidth: 100, id: 'algoStrategyId',
                          label: 'Algo Strategy:', placeholder: "Select Strategy", popupWidth: 600,
                          options: [
                            { id: 1, value: "Short Gamma Spread" },
                            { id: 2, value: "Short Strangle" },
                            { id: 3, value: "Iron Condor Spread" }
                          ]
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-google-analytics", id: 'algoStrategyButtonId',
                          width: 37, align: "left",
                          click: function () {

                            $$("sidebarId").hide();
                            let s = $$('scriptId').getValue();
                            if (s == "") {
                              webix.message({ text: "Please select script :-)", type: "info " })
                            } else {
                              let algoSel = $$('algoStrategyId').getValue()
                              if (algoSel == '') {
                                webix.message({ text: "Please select also strategy :-)", type: "info " })
                              } else {
                                switch (algoSel) {
                                  case '1':
                                    $$('mainWinId').showProgress();
                                    webix.delay(() => { displayShortGamma(); $$('mainWinId').hideProgress() })
                                    break
                                  case '2':
                                    $$('mainWinId').showProgress();
                                    webix.delay(() => { displayShortStrangle(); $$('mainWinId').hideProgress() })
                                    break
                                  case '3':
                                    $$('mainWinId').showProgress();
                                    webix.delay(() => { displayIronConderStrangle(); $$('mainWinId').hideProgress() })
                                    break
                                }
                              }
                            }
                          }
                        },
                        {},
                        { view: 'template', width: 140, template: '', id: 'maxPainLabelId', borderless: true },
                        { view: 'template', width: 200, template: '', id: 'underlyingValId', borderless: true },
                        {
                          view: "button", type: "icon", width: 35, id: 'upArrowId', icon: "mdi mdi-arrow-up", click: function () {
                            $$('downArrowId').show()
                            $$('mainToolbarId').hide()
                            $$('upArrowId').hide()
                          }
                        },
                        {
                          view: "button", type: "icon", width: 35, id: 'downArrowId', icon: "mdi mdi-arrow-down", hidden: true, click: function () {
                            $$('upArrowId').show()
                            $$('mainToolbarId').show()
                            $$('downArrowId').hide()
                          }
                        },
                      ]
                    },
                    {
                      view: 'template', id: 'optionChainTemplateId', template: function (obj) {
                        //console.dir(obj)

                        let start = `<div class="optionChainApp1" style="overflow:auto;width:100%;height:100%;"><div class="customTable-width optionChainTable wordBreak borderTD">
                      <table id="optionChainTable-indices" class="common_table w-100">
                        <thead>
                        <tr>
                          <th class="text-center" colspan="11">CALLS</th>
                          <th></th>
                          <th class="text-center" colspan="11">PUTS</th>
                        </tr>
                        <tr>
                          <th width="2.34%"><span> </span></th><th width="5.14%" title="Open Interest in contracts">OI<span> </span></th>
                          <th width="4.34%" title="Change in Open Interest (Contracts)">Chng in OI<span> </span></th>
                          <th width="5.54%" title="Volume in Contracts">Volume<span> </span></th>
                          <th width="3.34%" title="Implied Volatility">IV<span> </span></th>
                          <th width="4.34%" title="Last Traded Price">LTP<span> </span></th>
                          <th width="4.34%" title="Change w.r.t to Previous Close">Chng<span> </span></th>
                          <th width="4.34%" title="Best Bid/Buy Qty">Bid Qty<span> </span></th>
                          <th width="4.34%" title="Best Bid/Buy Price">Bid Price<span> </span></th>
                          <th width="4.34%" title="Best Ask/Sell Price">Ask Price<span> </span></th>
                          <th width="4.34%" title="Best Ask/Sell Qty">Ask Qty<span> </span></th>
                          <th width="6.34%">${obj.selectedStrike ? 'EXPIRY DATE' : 'Strike Price'} <span> </span></th>
                          <th width="4.34%" title="Best Bid/Buy Qty">Bid Qty<span> </span></th>
                          <th width="4.34%" title="Best Bid/Buy Price">Bid Price<span> </span></th>
                          <th width="4.34%" title="Best Ask/Sell Price">Ask Price<span> </span></th>
                          <th width="4.34%" title="Best Ask/Sell Qty">Ask Qty<span> </span></th>
                          <th width="4.34%" title="Change w.r.t to Previous Close">Chng<span> </span></th>
                          <th width="4.34%" title="Last Traded Price">LTP<span> </span></th>
                          <th width="3.34%" title="Implied Volatility">IV<span> </span></th>
                          <th width="5.54%" title="Volume in Contracts">Volume<span> </span></th>
                          <th width="4.34%" title="Change in Open Interest (Contracts)">Chng in OI<span> </span></th>
                          <th width="5.14%" title="Open Interest in contracts">OI<span> </span></th>
                          <th width="2.34%"><span> </span></th>
                        </tr>
                        </thead>
                        <tbody id="indices-body">`

                        if (obj.selectedStrike) {
                          let expiryDates = Object.keys(OptionChainData[SelectedScript].data).sort((a, b) => { if (new Date(a) > new Date(b)) { return 1 } else { return -1 } })

                          for (let i = 0; i < expiryDates.length; i++) {
                            let strikeSelect = undefined
                            OptionChainData[SelectedScript].data[expiryDates[i]].forEach(e => {
                              if (e[obj.selectedStrike]) {
                                strikeSelect = e[obj.selectedStrike]
                              }
                            })
                            if (strikeSelect == undefined) {
                              continue;
                            }
                            let st = obj.selectedStrike
                            let ceHis = `<span onclick="fetchOptionHistory('CE', '${DecimalFixed(st).replaceAll(',', '')}', '${expiryDates[i]}', '${SelectedScript}')" class="webix_icon_btn mdi mdi-history" style="color: #2f79e0;cursor:pointer;"></span>`
                            let peHis = `<span onclick="fetchOptionHistory('PE', '${DecimalFixed(st).replaceAll(',', '')}', '${expiryDates[i]}', '${SelectedScript}')" class="webix_icon_btn mdi mdi-history" style="color: #2f79e0;cursor:pointer;"></span>`
                            let ce = strikeSelect['CE'] || {}
                            let pe = strikeSelect['PE'] || {}

                            let stRow = `<td width="6.34%"><a class="bold" onclick="showAllPriceOfStrike(undefined, '${expiryDates[i]}')" href="javascript:;">${expiryDates[i]}</a></td>`
                            let ceClass = obj.ceITM
                            let peClass = obj.peITM

                            let r = `
                            <tr>
                            <td width="2.34%">${ceHis}</td>
                            <td width="5.14%" class="${ceClass}">${DecimalFixed(ce.openInterest, true)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.changeinOpenInterest, true)}</td>
                            <td width="5.54%" class="${ceClass}">${DecimalFixed(ce.totalTradedVolume, true)}</td>
                            <td width="3.34%" class="${ceClass}">${DecimalFixed(ce.impliedVolatility)}</td>
                            <td width="4.34%" class="${ceClass}"><a class="bold" href="javascript:;">${DecimalFixed(ce.lastPrice)}</a></td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.change)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.bidQty, true)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.bidprice)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.askPrice)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.askQty, true)}</td>`

                              + stRow +
                              `
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.bidQty, true)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.bidprice)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.askPrice)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.askQty, true)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.change)}</td>
                            <td width="4.34%" class="${peClass}"><a class="bold" href="javascript:;">${DecimalFixed(pe.lastPrice)}</a></td>
                            <td width="3.34%" class="${peClass}">${DecimalFixed(pe.impliedVolatility)}</td>
                            <td width="5.54%" class="${peClass}"><a class="bold" href="javascript:;">${DecimalFixed(pe.totalTradedVolume, true)}</a></td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.changeinOpenInterest, true)}</td>
                            <td width="5.14%" class="${peClass}">${DecimalFixed(pe.openInterest, true)}</td>
                            <td width="2.34%">${peHis}</td>
                            </tr>`
                            start = start + r
                          }
                        } else if (Object.keys(obj).length > 0) {
                          prepareStrikeWithPremium()
                          let [S1, S2, R1, R2] = findSupportResistence()
                          let [PEV1, PEV2, CEV1, CEV2] = findSupportResistence()
                          let arr = obj.data

                          let fivePerLower = Underlying_Value - (Underlying_Value * 5 / 100)
                          let fivePerHigher = Underlying_Value + (Underlying_Value * 5 / 100)

                          let pePerLower = Underlying_Value - (Underlying_Value * 10 / 100)

                          let sData = OptionChainData[SelectedScript]
                          let ocArr = sData.data[SelectedExpiryDate]
                          let allOcs = []
                          for (let i = 0; i < ocArr.length; i++) {
                            allOcs.push(Object.keys(ocArr[i])[0])
                          }
                          let closest = allOcs.reduce(function (prev, curr) {
                            return Math.abs(curr - Underlying_Value) < Math.abs(prev - Underlying_Value) ? curr : prev;
                          })

                          for (let i = 0; i < arr.length; i++) {
                            let row = arr[i]
                            let st = Object.keys(row)[0]
                            let ce = row[st]['CE'] || {}
                            let pe = row[st]['PE'] || {}
                            if (fetchTableConfig('optimize') == 'active') {
                              if (ce.totalTradedVolume == 0 && pe.totalTradedVolume == 0) {
                                continue;
                              }
                              if (Underlying_Value > st && !pe.bidPrice && !pe.askPrice) {
                                continue;
                              } else if (Underlying_Value < st && !ce.bidPrice && !ce.askPrice) {
                                continue;
                              }
                            }


                            let ceIdentifier = ce.identifier
                            let peIdentifier = pe.identifier
                            let ceClass = st <= closest ? 'bg-yellow' : ''
                            let peClass = st > closest ? 'bg-yellow' : ''
                            let stPer = DecimalFixed(((st - Underlying_Value) / Underlying_Value * 100)) + '%&#010;(' + DecimalFixed(st - Underlying_Value) + ')'
                            let stRow = `<td width="6.34%"><a class="bold" title="${stPer}" onclick="showAllPriceOfStrike('${st}', undefined, '${ceClass}', '${peClass}')" href="javascript:;">${DecimalFixed(st)}</a> <img src="/grficon.gif" style="width: 13px;cursor:pointer;" onclick="showOptionGraph('${ceIdentifier}', '${peIdentifier}', '${parseInt(st)}', '${SelectedExpiryDate}')"/></td>`
                            if (parseInt(st) > fivePerLower && parseInt(st) < fivePerHigher) {
                              stRow = `<td width="6.34%" style="background-color: #c1e7f1"><a class="bold" title="${stPer}" onclick="showAllPriceOfStrike('${st}', undefined, '${ceClass}', '${peClass}')" href="javascript:;">${DecimalFixed(st)}</a> <img src="/grficon.gif" style="width: 13px;cursor:pointer;" onclick="showOptionGraph('${ceIdentifier}', '${peIdentifier}', '${parseInt(st)}', '${SelectedExpiryDate}')"/></td>`
                            }
                            let ceChangeTx = ' redTxt'
                            if (ce.change > 0) {
                              ceChangeTx = ' greenTxt'
                            }
                            let peChangeTx = ' redTxt'
                            if (pe.change > 0) {
                              peChangeTx = ' greenTxt'
                            }

                            let ceHis = `<span onclick="fetchOptionHistory('CE', '${DecimalFixed(st).replaceAll(',', '')}', '${SelectedExpiryDate}', '${SelectedScript}')" class="webix_icon_btn mdi mdi-history" style="color: #2f79e0;cursor:pointer;"></span>`
                            let peHis = `<span onclick="fetchOptionHistory('PE', '${DecimalFixed(st).replaceAll(',', '')}', '${SelectedExpiryDate}', '${SelectedScript}')" class="webix_icon_btn mdi mdi-history" style="color: #2f79e0;cursor:pointer;"></span>`

                            let ceVol1 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == CEV1) {
                              ceVol1 = 'green1'
                            }
                            let ceVol2 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == CEV2) {
                              ceVol2 = 'green2'
                            }

                            let peVol1 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == PEV1) {
                              peVol1 = 'green1'
                            }
                            let peVol2 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == PEV2) {
                              peVol2 = 'green2'
                            }

                            let ceOI1 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == R1) {
                              ceOI1 = 'green1'
                            }
                            let ceOI2 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == R2) {
                              ceOI2 = 'green2'
                            }

                            let peOI1 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == S1) {
                              peOI1 = 'green1'
                            }
                            let peOI2 = ''
                            if (DecimalFixed(st).replaceAll(',', '') == S2) {
                              peOI2 = 'green2'
                            }

                            let ceBuildUp = ''
                            let ceBuildUpTip = ''
                            let peBuildUp = ''
                            let peBuildUpTip = ''
                            if (fetchTableConfig('buildup') == 'active') {
                              if (ce.changeinOpenInterest == ce.openInterest || ce.totalTradedVolume == 0 || ce.changeinOpenInterest == 0) {
                                ceBuildUp = ''
                                ceBuildUpTip = 'Unchanged'
                              } else if (ce.changeinOpenInterest > 0) {
                                if (ce.change > 0) {
                                  ceBuildUp = 'background-color: rgb(0, 128, 0)'
                                  ceBuildUpTip = 'Long Buildup'
                                } else {
                                  ceBuildUp = 'background-color: rgb(255, 0, 0)'
                                  ceBuildUpTip = 'Short Buildup'
                                }
                              } else {
                                if (ce.change > 0) {
                                  ceBuildUp = 'background-color: rgb(144, 238, 144)'
                                  ceBuildUpTip = 'Short Covering'
                                } else {
                                  ceBuildUp = 'background-color: rgb(255, 165, 0)'
                                  ceBuildUpTip = 'Long Unwinding'
                                }
                              }

                              if (pe.changeinOpenInterest == pe.openInterest || pe.totalTradedVolume == 0 || pe.changeinOpenInterest == 0) {
                                peBuildUp = ''
                                peBuildUpTip = 'Unchanged'
                              } else if (pe.changeinOpenInterest > 0) {
                                if (pe.change > 0) {
                                  peBuildUp = 'background-color: rgb(0, 128, 0)'
                                  peBuildUpTip = 'Long Buildup'
                                } else {
                                  peBuildUp = 'background-color: rgb(255, 0, 0)'
                                  peBuildUpTip = 'Short Buildup'
                                }
                              } else {
                                if (pe.change > 0) {
                                  peBuildUp = 'background-color: rgb(144, 238, 144)'
                                  peBuildUpTip = 'Short Covering'
                                } else {
                                  peBuildUp = 'background-color: rgb(255, 165, 0)'
                                  peBuildUpTip = 'Long Unwinding'
                                }
                              }
                            }
                            let peSellClass = ''
                            if (parseInt(st) < pePerLower && pe.bidprice > 100 && pe.askPrice > 100) {
                              peSellClass = 'bg-purple'
                            }

                            let r = `
                            <tr>
                            <td width="2.34%" style="${ceBuildUp}" title="${ceBuildUpTip}">${ceHis}</td>
                            <td width="5.14%" class="${ceClass} ${ceOI1} ${ceOI2}">${DecimalFixed(ce.openInterest, true)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.changeinOpenInterest, true)}</td>
                            <td width="5.54%" class="${ceClass} ${ceVol1} ${ceVol2}">${DecimalFixed(ce.totalTradedVolume, true)}</td>
                            <td width="3.34%" class="${ceClass}">${DecimalFixed(ce.impliedVolatility)}</td>
                            <td width="4.34%" class="${ceClass}"><a class="bold" href="javascript:;">${DecimalFixed(ce.lastPrice)}</a></td>
                            <td width="4.34%" class="${ceClass} ${ceChangeTx}">${DecimalFixed(ce.change)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.bidQty, true)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.bidprice)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.askPrice)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.askQty, true)}</td>`

                              + stRow +
                              `
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.bidQty, true)}</td>
                            <td width="4.34%" class="${peClass} ${peSellClass}">${DecimalFixed(pe.bidprice)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.askPrice)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.askQty, true)}</td>
                            <td width="4.34%" class="${peClass} ${peChangeTx}">${DecimalFixed(pe.change)}</td>
                            <td width="4.34%" class="${peClass}"><a class="bold" href="javascript:;">${DecimalFixed(pe.lastPrice)}</a></td>
                            <td width="3.34%" class="${peClass}">${DecimalFixed(pe.impliedVolatility)}</td>
                            <td width="5.54%" class="${peClass} ${peVol1} ${peVol2}"><a class="bold" href="javascript:;">${DecimalFixed(pe.totalTradedVolume, true)}</a></td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.changeinOpenInterest, true)}</td>
                            <td width="5.14%" class="${peClass} ${peOI1} ${peOI2}">${DecimalFixed(pe.openInterest, true)}</td>
                            <td width="2.34%" style="${peBuildUp}" title="${peBuildUpTip}">${peHis}</td>
                            </tr>`
                            start = start + r
                          }

                          let currVal = '<b>' + Underlying_Value + '</b> ' + '<br>' + obj.timestamp
                          try {
                            let dStr = obj.timestamp.substr(0, 11)
                            let preClose = '0'
                            if (dStr == ScriptHistoryData[SelectedScript][0][0]) {
                              preClose = ScriptHistoryData[SelectedScript][1][4]
                            } else {
                              preClose = ScriptHistoryData[SelectedScript][0][4]
                            }

                            let per = toFixed((Underlying_Value - preClose) / Underlying_Value * 100, 2) + '%'
                            let diff = toFixed(Underlying_Value - preClose, 2)

                            let detailsLink = ''
                            if (SelectedScript == 'NIFTY' || SelectedScript == 'BANKNIFTY') {
                              detailsLink = Underlying_Value
                            } else {
                              if (parseFloat(per) < 0) {
                                detailsLink = '<a style="color:#fd505c;text-decoration: underline;" target="_blank" href="https://nseindia.com/companytracker/cmtracker.jsp?symbol=' + SelectedScript + '&cName=cmtracker_nsedef.css">' + Underlying_Value + '</a>'
                              } else {
                                detailsLink = '<a style="color:#02a68a;text-decoration: underline;" target="_blank" href="https://nseindia.com/companytracker/cmtracker.jsp?symbol=' + SelectedScript + '&cName=cmtracker_nsedef.css">' + Underlying_Value + '</a>'
                              }
                            }
                            if (parseFloat(per) < 0) {
                              currVal = '<span style="color:#fd505c">' + '<b>' + detailsLink + '</b> ' + per + '(' + diff + ')</span>' + '<br>' + obj.timestamp
                            } else {
                              currVal = '<span style="color:#02a68a">' + '<b>' + detailsLink + '</b> ' + per + '(' + diff + ')</span>' + '<br>' + obj.timestamp
                            }
                          } catch (e) { }

                          $$('underlyingValId').setHTML(currVal)
                        } else {
                          $$('underlyingValId').setHTML('')
                          webix.delay(() => document.getElementById("indices-body").innerHTML = selectScriptRow)
                        }
                        let end = `  </tbody>
                      </table></div></div>`
                        //webix.delay(()=> attachBuySellButtons(), 100);
                        return start + end
                      }
                    },
                    { view: 'template', template: '<div style="background-color: blue"></div>', height: 10 }
                  ]
                }
              },
              {
                id: 'strategyViewId',
                hidden: true,
                cols: [
                  {
                    view: "scrollview",
                    width: 380,
                    scroll: "auto",
                    id: 'inputViewId',
                    body: {
                      rows: [
                        { view: 'template', id: 'inputHeaderId', height: 30, template: '' },
                        {
                          cols: [
                            { view: "label", label: '', width: 150, align: "center" },
                            { view: "label", label: 'Strike', width: 90, align: "center" },
                            { view: "label", label: 'Premium', width: 70, align: "center" },
                            { view: "label", label: 'Lot(s)', width: 70, align: "center" },
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
              {
                view: "scrollview",
                scroll: "auto",
                id: 'worldMarketViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      view: "button", type: "icon", icon: "mdi mdi-refresh", height: 35, width: 37, align: "center",
                      click: function () {
                        $('#worldMarket').empty();
                        $('#worldMarket').append('Loading ...');
                        $('#sgxNifty').empty();
                        $('#sgxNifty').append('Loading ...');
                        dispatchChangeEvent('#worldMarketId')
                      }
                    },
                    {
                      cols: [
                        { view: 'template', template: '<div style="overflow:auto;width:100%;height:98%;font-size: large;"><div id="worldMarket">Loading ...</div</div>' },
                        { view: 'template', width: 400, template: '<div style="overflow:auto;width:100%;height:98%;font-size: large;"><div id="sgxNifty">Loading ...</div</div>' },
                      ]
                    }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'calendarWiseViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      cols: [
                        {
                          view: "combo", width: 180, labelWidth: 50, id: "scriptCalendarId",
                          label: 'Script:', placeholder: "Please Select",
                          options: ['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()],
                          on: {
                            onChange: function (id) {
                              CalenderUI = processDataForCalenderUI(id)
                              $$('script_calendar').refresh()
                            },
                            onAfterRender: function () {
                              $$("scriptCalendarId").setValue(DownloadTime['lastViewedScript'])
                            }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download",
                          width: 37, align: "left",
                          click: function () {
                            let id = $$('scriptCalendarId').getValue()
                            if (id != '') {
                              //dispatchChangeEvent('#scriptHistoryId', id)
                              dispatchChangeEvent('#priceApiReqId', id)
                            } else {

                            }
                          }
                        }, {},
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download", label: 'i Chart',
                          width: 130, align: "left",
                          click: function () {
                            if (window.confirm('Are you sure to download all sripts')) {
                              //dispatchChangeEvent('#ichartScreenerReqId')
                              dispatchChangeEvent('#economicCalendarReqId')
                            }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download", label: 'Download All',
                          width: 130, align: "left",
                          click: function () {
                            if (window.confirm('Are you sure to download all sripts')) {
                              //dispatchChangeEvent('#scriptHistoryId', ['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()].toString() )
                              dispatchChangeEvent('#priceApiReqId', ['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()].toString())
                            }
                          }
                        }, { width: 15 }
                      ]
                    },
                    {
                      view: "calendar",
                      id: "script_calendar",
                      calendarHeader: "%F, %Y",
                      weekHeader: true,
                      skipEmptyWeeks: true,
                      cellHeight: 70,
                      events: webix.Date.isHoliday,
                      align: 'center',
                      dayTemplate: function (date) {
                        let dArr = date.toDateString().split(' ')
                        let dStr = dArr[2] + '-' + dArr[1] + '-' + dArr[3]

                        var html = "<div class='day'>" + date.getDate() + "</div>";
                        if (CalenderUI[dStr]) {
                          let per = parseFloat((CalenderUI[dStr][1] - CalenderUI[dStr][0]) / CalenderUI[dStr][0] * 100).toFixed(2)
                          let pol = parseFloat((CalenderUI[dStr][1] - CalenderUI[dStr][0])).toFixed(2)

                          if (pol > 0) {
                            html = "<div class='day' title='" + date.getDate() + "'style='width:100%;height:100%;line-height: normal;color:#1d922a;font-size: medium;'><b>" + per + "%</b> (" + pol + ")<br><span style='font-size: small;color: black;''>" + CalenderUI[dStr][1] + "</span></div>"
                          } else {
                            html = "<div class='day' title='" + date.getDate() + "'style='width:100%;height:100%;line-height: normal;color:#d21616;font-size: medium;'><b>" + per + "%</b> (" + pol + ")<br><span style='font-size: small;color: black;''>" + CalenderUI[dStr][1] + "</span></div>"
                          }
                        } else if (dArr[0] == 'Sat') {
                          let sat = new Date(dStr)
                          sat.setDate(sat.getDate() - 5)
                          dArr = sat.toDateString().split(' ')
                          dStr = dArr[2] + '-' + dArr[1] + '-' + dArr[3]
                          let sDate = ''
                          let eDate = ''
                          for (let i = 0; i < 5; i++) {
                            if (sDate == '' && CalenderUI[dStr]) {
                              sDate = dStr
                            } else if (sDate != '' && CalenderUI[dStr]) {
                              eDate = dStr
                            }
                            sat.setDate(sat.getDate() + 1)
                            dArr = sat.toDateString().split(' ')
                            dStr = dArr[2] + '-' + dArr[1] + '-' + dArr[3]
                          }
                          if (sDate != '' && eDate != '') {
                            let per = parseFloat((CalenderUI[eDate][1] - CalenderUI[sDate][0]) / CalenderUI[sDate][0] * 100).toFixed(2)
                            let pol = parseFloat((CalenderUI[eDate][1] - CalenderUI[sDate][0])).toFixed(2)

                            if (pol > 0) {
                              html = "<div class='day' title='" + date.getDate() + "' style='width:100%;height:100%;line-height: normal;color:#1d922a;font-size: medium;background-color: lightblue;'><b>" + per + "%</b> <br/>" + pol + "</div>";
                            } else {
                              html = "<div class='day' title='" + date.getDate() + "'style='width:100%;height:100%;line-height: normal;color:#d21616;font-size: medium;background-color: lightblue;'> <b>" + per + "%</b> <br/>" + pol + "</div>";
                            }
                          }
                        }
                        return html;
                      },
                      on: {
                        onAfterMonthChange: function (prev_date, next_date) {
                          displayMonthWisePer(prev_date)
                        },
                        onAfterZoom: function () {
                          let months = $('.webix_cal_body>.webix_cal_block span')
                          if (months.length > 0) {
                            let year = $('.webix_cal_month span').get(0).innerHTML
                            for (let i = 0; i < months.length; i++) {
                              let my = months.get(i).innerHTML + '-' + year
                              let cArr = Object.keys(CalenderUI)
                              let sDate = ''
                              let eDate = ''
                              for (let i = 0; i < cArr.length - 1; i++) {
                                let d = cArr[i]
                                if (eDate == '' && my == d.substr(3)) {
                                  sDate = d
                                  eDate = d
                                } else if (eDate != '' && my == d.substr(3)) {
                                  sDate = d
                                }
                              }
                              if (sDate != '' && eDate != '') {
                                let per = parseFloat((CalenderUI[eDate][1] - CalenderUI[sDate][0]) / CalenderUI[sDate][0] * 100).toFixed(2)
                                let pol = parseFloat((CalenderUI[eDate][1] - CalenderUI[sDate][0])).toFixed(2)
                                if (pol > 0) {
                                  html = "<span style='color:#1d922a;'><b>" + per + "%</b> (" + pol + ")</span>";
                                } else {
                                  html = "<span style='color:#d21616;'> <b>" + per + "%</b> (" + pol + ")</span>";
                                }
                                months.get(i).innerHTML = months.get(i).innerHTML + ' ' + html
                              }
                            }
                            $('.webix_cal_block.webix_selected').removeClass('webix_selected')
                          }
                        },
                        onAfterRender: function () {
                          let mHeader = $('[view_id="script_calendar"]>.webix_cal_month>.webix_cal_month_name>.day').length
                          if (mHeader == 0 && $$('scriptCalendarId').getValue() != '') {
                            displayMonthWisePer($$('script_calendar').config.date)
                            //console.dir('onAfterRender')
                          }
                        },
                      }
                    },
                    { height: 10 },
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'etResultCalendarViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      height: 40,
                      cols: [{},
                      { view: "datepicker", id: 'etDatepickerId', value: new Date(), stringResult: true, width: 200 },
                      {
                        view: "button", type: "icon", icon: "mdi mdi-download", height: 35, width: 37, align: "center",
                        click: function () {
                          let sDate = $$('etDatepickerId').getValue().substr(0, 10)
                          dispatchChangeEvent('#etDatepickerReqId', sDate)
                        }
                      }, {
                        view: "button", value: '7 Days', height: 35, width: 45, align: "center",
                        click: function () {
                          dispatchChangeEvent('#etDatepickerReqId', 7)
                        }
                      }, {}
                      ]
                    },
                    {
                      view: "align", align: "middle,center",
                      body: {
                        view: 'datatable', hover: "myhover", css: "rows", id: 'etDatatableId', height: 500, width: 900,
                        data: [{ name: 'Hint :-)', event: 'Please select date and click download' }],
                        columns: [
                          {
                            id: 'name', header: 'Company Name', width: 200, template: function (obj) {
                              return obj.companyId != undefined ? `<a target="_blank" href="https://economictimes.indiatimes.com/${obj.seoName}/stocks/companyid-${obj.companyId}.cms">${obj.name}</a>` : obj.name;
                            }
                          },

                          { id: 'event', header: 'Event', width: 450, fillspace: true }]
                      }
                    },
                    { height: 30 }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'moneycontroRCViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      height: 35,
                      cols: [
                        {
                          view: "combo", width: 150, id: "resultDateId",
                          placeholder: "Select Date",
                          options: ['All'],
                          on: {
                            onChange: function (id) {
                              if (id === 'All') {

                              } else {

                              }
                            }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-refresh", width: 37, align: "center",
                          click: function () {
                            dispatchChangeEvent('#mcResultCalendarReqId')
                          }
                        },
                        {
                          view: "template", id: "allResultCalendarTempId", template: function (obj) {
                            return 'Last Downloaded: ' + webix.storage.local.get('DownloadTime')['AllResultCalendarArr']
                          }
                        },
                        {}
                      ]
                    },

                    {
                      view: 'template', width: 100, template: function (obj) {
                        return localStorage.getItem('AllResultCalendar')
                      }, id: 'allResultCalendarId', scroll: "auto"
                    },
                    { height: 30 }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'cashAndCarryViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      height: 35,
                      cols: [
                        {
                          view: "button", type: "icon", icon: "mdi mdi-refresh", width: 37, align: "center",
                          click: function () {
                            dispatchChangeEvent('#cashAndCarryReqId')
                          }
                        },
                        {
                          view: "template", id: "cashAndCarryTempId", template: function (obj) {
                            return 'Last Downloaded: ' + webix.storage.local.get('DownloadTime')['CashAndCarry']
                          }
                        },]
                    },
                    {
                      cols: [
                        {
                          rows: [{ view: 'template', template: function () { return '<center><b>Buy cash and Sell future</b></center>' }, height: 30 },
                          {
                            view: 'datatable', id: 'cashAndCarryDatatableId',
                            data: prepareCashAndCarryData()[0],
                            columns: [
                              { id: 'company', header: ['Company', { content: 'textFilter' }], width: 140, sort: 'string' },
                              { id: 'future', header: 'Future' },
                              { id: 'spot', header: 'Spot' },
                              { id: 'basis', header: 'Basis' },
                              { id: 'basisPer', header: 'Basis Per', sort: 'int' },
                              { id: 'preBasis', header: 'Pre Basis' },
                              { id: 'change', header: 'Change', sort: 'int' },
                              { id: 'lotSize', header: 'Lot Size' },
                            ]
                          },]
                        },
                        {
                          rows: [{ view: 'template', template: function () { return '<center><b>Sell cash and Buy future</b></center>' }, height: 30 },
                          {
                            view: 'datatable', id: 'revCashAndCarryDatatableId',
                            data: prepareCashAndCarryData()[1],
                            columns: [
                              { id: 'company', header: ['Company', { content: 'textFilter' }], width: 140, sort: 'string' },
                              { id: 'future', header: 'Future' },
                              { id: 'spot', header: 'Spot' },
                              { id: 'basis', header: 'Basis' },
                              { id: 'basisPer', header: 'Basis Per', sort: 'int' },
                              { id: 'preBasis', header: 'Pre Basis' },
                              { id: 'change', header: 'Change', sort: 'int' },
                              { id: 'lotSize', header: 'Lot Size' },
                            ]
                          },]
                        },
                      ]
                    },
                    { height: 30 }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'continuousWiseViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      body: {
                        id: "scriptDetailsContinuousId",
                        cols: [
                          {
                            header: "Continuous Loss",
                            css: 'red-background',
                            body: {
                              id: "continuousLossId",
                              view: "tabview",
                              tabbar: {
                                id: "continuousLossTabbarId"
                              },
                              cells: generateContinuousCells('Loss'),
                              data: []
                            }
                          },
                          {
                            header: "Continuous Profit",
                            css: 'green-background',
                            body: {
                              view: "tabview",
                              id: "continuousProfitId",
                              tabbar: {
                                id: "continuousProfitTabbarId"
                              },
                              cells: generateContinuousCells('Profit'),
                              data: []
                            }
                          }
                        ]
                      }
                    },
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'yearWiseViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      view: "align", align: "middle,center",
                      body: {
                        view: 'datatable', hover: "myhover", css: "rows", id: 'yearWiseDatatableId', height: 500, width: 900, rowHeight: 70,
                        data: [],
                        columns: [
                          { id: 'name', header: ['Script Name', { content: "textFilter" }], width: 200, sort: 'string' },
                          {
                            id: '52Wks', header: 'High/Low', width: 220, template: function (obj) {
                              return obj.highPrice + ' / ' + obj.lowPrice + '<br>[' + obj.highPriceDate + ' / ' + obj.lowPriceDate + ']'
                            }
                          },
                          {
                            id: 'per', header: '52 Wks %', width: 200, sort: 'int', template: function (obj) {
                              return obj['per'] + '%' + "(" + obj['pol'] + ")"
                            }
                          },
                          {
                            id: 'below52WksPer', header: 'Below 52 Wks', width: 150, sort: 'int', fillspace: true, template: function (obj) {
                              return obj['below52WksPer'] + '%' + "(" + obj['below52Wks'] + ")"
                            }
                          }
                        ]
                      }
                    },
                    { height: 30 }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'watchListViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      view: 'datatable', hover: "myhover", css: "rows", id: 'watchListDatatableId',
                      data: [],
                      rowHeight: 180,
                      columns: [
                        { id: 'script', header: ['Script Details', { content: 'textFilter' }], width: 150, sort: 'text' },
                        {
                          id: 'pol', header: ['Profit / Loss'], width: 400, sort: 'int', fillspace: true, template: function (obj) {
                            return displayStrategyLatestDetails(obj)
                          }
                        },
                        {
                          id: 'action', header: 'Action', width: 100, template: function (obj) {
                            return '<span class="webix_icon_btn mdi mdi-delete-forever" onclick="deleteWatchList(\'' + obj.key + '\')" style="max-width:32px;cursor:pointer;"></span>'
                          }
                        },
                      ]
                    }
                  ]
                }
              },
              {
                id: 'maxPainForAllViewId',
                hidden: true,
                body: {
                  rows: [{
                    height: 35, cols: [
                      {},
                      {
                        view: "button", type: "icon", icon: "mdi mdi-refresh", width: 50, align: "center",
                        click: function () {
                          dispatchChangeEvent('#maxPainStocksReqId')
                        }
                      }, {
                        view: "template", id: "maxPainTempId", template: function (obj) {
                          return 'Last Downloaded: ' + webix.storage.local.get('DownloadTime')['MaxPainList']
                        }
                      }, {}
                    ]
                  },
                  {
                    view: 'datatable', hover: "myhover", css: "rows", id: 'maxPainForAllDatatableId',
                    data: webix.storage.local.get('MaxPainList'),
                    columns: [
                      { id: 'symbol_name', header: ['Symbol Name', { content: 'textFilter' }], width: 200, sort: 'string' },
                      { id: 'max_pain', header: 'Max Pain', width: 200, },
                      { id: 'today_close', header: 'Todays Close', width: 200 },
                      { id: 'prev_close', header: 'Previous Close', width: 200, fillspace: true },
                    ]
                  }
                  ]
                }
              },
              {
                id: 'nifty50StockViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      height: 35, cols: [
                        {},
                        {
                          view: "button", type: "icon", icon: "mdi mdi-refresh", width: 50, align: "center",
                          click: function () {
                            dispatchChangeEvent('#nifty50StocksReqId')
                          }
                        }, {}
                      ]
                    },
                    {
                      view: 'datatable', hover: "myhover", css: "rows", id: 'nifty50StockDatatableId',
                      data: [],
                      columns: [
                        { id: 'symbol_name', header: ['Symbol Name', { content: 'textFilter' }], width: 200, sort: 'string' },
                        { id: 'last_trade_price', header: 'LTP', width: 200, },
                        { id: 'change', header: 'Change', width: 200, },
                        { id: 'change_per', header: ['Percentage (%)', { content: 'numberFilter' }], width: 200, sort: 'int' },
                        { id: 'dummy', header: '', fillspace: true },
                      ]
                    }
                  ]
                }
              },
            ]
          }
        ]
      }
    ]
  })
  webix.delay(() => webix.extend($$("mainWinId"), webix.ProgressBar))
  webix.ui({
    view: "popup",
    id: "table_pop",
    width: 220,
    body: {
      rows: [
        {
          height: 30,
          cols: [{ view: 'template', template: 'Optimize Table', borderless: true },
          {
            view: 'template', borderless: true, width: 50, template: function () {
              return `<div class="tgl_vid_aud ${fetchTableConfig('optimize')}" data-action="optimize"><span class="tgic"></span></div>`
            }
          }
          ]
        },
        /*{ height: 30,
          cols: [{view: 'template', template: 'Auto Refresh(2min)', borderless: true},
            {view: 'template', borderless: true, width: 50, template: `
            <div class="tgl_vid_aud active" data-action="autoRefresh"><span class="tgic"></span></div>
            `}
          ]
        },*/
        {
          height: 30,
          cols: [{ view: 'template', template: 'Buildup', borderless: true },
          {
            view: 'template', borderless: true, width: 50, template: `
            <div class="tgl_vid_aud ${fetchTableConfig('buildup')}" data-action="buildup"><span class="tgic"></span></div>
            `}
          ]
        },
        {
          height: 30,
          cols: [{ view: 'template', template: 'Volatility Skew', borderless: true },
          {
            view: 'button', type: 'icon', width: 30, icon: "mdi mdi-open-in-new", click: function () {
              showVolatilitySmileChart()
            }
          }
          ]
        },
        {
          height: 30,
          cols: [{ view: 'template', template: 'Int-Ext', borderless: true },
          {
            view: 'button', type: 'icon', width: 30, icon: "mdi mdi-open-in-new", click: function () {
              showIntExtChart()
            }
          }
          ]
        },
      ]
    }
  }).hide();
})
function shortStrangleCal(peOTM, ceOTM) {
  peOTM = peOTM.filter(obj => obj[1] > 10 && obj[0] < (Underlying_Value - 300))
  ceOTM = ceOTM.filter(obj => obj[1] > 10 && obj[0] > (Underlying_Value + 300))

  let resultArr = []
  for (let i = 0; i < peOTM.length; i++) {
    if (peOTM[i][5] < 2 || peOTM[i][3] < 100) {
      continue;
    }
    let sellPut = {
      strikePrice: peOTM[i][0],
      premium: peOTM[i][1],
      lotSize: 1
    }
    for (let j = 0; j < ceOTM.length; j++) {
      if (ceOTM[j][5] < 2 || ceOTM[j][3] < 100) {
        continue;
      }
      let sellCall = {
        strikePrice: ceOTM[j][0],
        premium: ceOTM[j][1],
        lotSize: 1
      }

      let d = optionChainPayoffCal([], [sellCall], [], [sellPut], [], [])
      let [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer] = findLowerBoundUpperBound(Underlying_Value, d)
      resultArr.push({
        data: d,
        lowerBound: lowerBound,
        lowerBoundDiff: lowerBound + " (-" + parseInt(Underlying_Value - lowerBound) + ")",
        uppderBound: uppderBound,
        uppderBoundDiff: uppderBound + " (+" + parseInt(uppderBound - Underlying_Value) + ")",
        premiumRec: parseFloat(sellPut.premium + sellCall.premium).toFixed(2),
        range: sellPut.strikePrice + ' - ' + sellCall.strikePrice,
        ceSt: sellCall.strikePrice,
        cePre: sellCall.premium,
        ceiv: ceOTM[j][5],
        peSt: sellPut.strikePrice,
        pePre: sellPut.premium,
        peiv: peOTM[i][5],
        upPer: parseFloat((uppderBound - Underlying_Value) / Underlying_Value * 100).toFixed(2),
        downPer: parseFloat((lowerBound - Underlying_Value) / Underlying_Value * 100).toFixed(2),
      })
    }
  }
  //console.dir(resultArr)
  return resultArr;
}
function displayShortStrangle() {
  prepareStrikeWithPremium()
  let d = shortStrangleCal(PE_OTM, CE_OTM)
  webix.ui({
    view: "window",
    id: 'strategyWinId',
    width: window.innerWidth - 2,
    height: window.innerHeight - 2,
    position: 'center',
    head: {
      view: "toolbar", id: 'strategyWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Short Strangle: " + SelectedScript + '  [' + SelectedExpiryDate + ']' },
        { view: "label", id: 'spotPriceId', label: "Spot Price (SP): " + Underlying_Value },
        { view: "button", label: 'X', width: 50, align: 'left', click: function () { $$('strategyWinId').close(); } }
      ]
    },
    body: {
      view: "datatable", hover: "myhover", css: "rows",
      columns: [
        { id: "range", header: ["Strike Price"], width: 150, },
        {
          id: "lowerBound", header: ["Lower Bound", { content: "numberFilter" }], width: 120, sort: "int", template: function (obj) {
            return obj.lowerBoundDiff
          }
        },
        {
          id: "uppderBound", header: ["Upper Bound", { content: "numberFilter" }], width: 120, sort: "int", template: function (obj) {
            return obj.uppderBoundDiff
          }
        },
        { id: "pePre", header: ["PE Premium", { content: "numberFilter" }], width: 150, sort: "int", },
        { id: "cePre", header: ["CE Premium", { content: "numberFilter" }], width: 150, sort: "int", },
        { id: "premiumRec", header: ["Premium Received", { content: "numberFilter" }], width: 160, sort: "int" },
        { id: "downPer", header: ["<-- %", { content: "numberFilter" }], width: 100, sort: "int" },
        { id: "upPer", header: ["--> %", { content: "numberFilter" }], width: 100, sort: "int" },
        { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>", fillspace: true },
      ],
      select: "row",
      data: d,
      onClick: {
        details_button: function (ev, id) {

          let obj = this.data.pull[id.row]
          let sellPutSt = obj.peSt
          let sellPutPre = obj.pePre

          let sellCallSt = obj.ceSt
          let sellCallPre = obj.cePre
          let premiumRec = obj.premiumRec

          let ceSell = {
            buyOrSell: SELL,
            type: CE_TYPE,
            strikePrice: obj.ceSt,
            premium: obj.cePre,
            lots: 1
          }
          let peSell = {
            buyOrSell: SELL,
            type: PE_TYPE,
            strikePrice: obj.peSt,
            premium: obj.pePre,
            lots: 1
          }

          strategyCal(Underlying_Value, SelectedScript, SelectedExpiryDate, [ceSell, peSell])
        }
      }
    },
  }).show()
}
function ironConderCal(peOTM, ceOTM) {

  let config = fetchScriptConfig()
  peOTM = peOTM.filter(obj => obj[1] > 10 && obj[0] < (Underlying_Value - config.ironConderRange))
  ceOTM = ceOTM.filter(obj => obj[1] > 10 && obj[0] > (Underlying_Value + config.ironConderRange))

  let resultArr = []
  for (let bp = 0; bp < peOTM.length - 1; bp++) { // bp = Buy Put, sp = Sell Put
    for (let sp = bp + 1; sp < peOTM.length; sp++) {
      let peCreditAmt = peOTM[sp][1] - peOTM[bp][2]

      if (peOTM[sp][3] < 100 || peOTM[bp][3] < 100) {
        //if ((peOTM[bp][0] - peOTM[sp][0]) > rangeDiff) {
        //  break;
        //}
        continue;
      }

      for (let sc = 0; sc < ceOTM.length - 1; sc++) { // sc = Sell Call, bc = Buy Call
        for (let bc = sc + 1; bc < ceOTM.length; bc++) {
          let ceCreditAmt = ceOTM[sc][1] - ceOTM[bc][2]

          if (ceOTM[sc][3] < 100 || ceOTM[bc][3] < 100) {
            //if ((peOTM[bp][0] - peOTM[sp][0]) > rangeDiff) {
            //  break;
            //}
            continue;
          }

          if ((peOTM[sp][0] - peOTM[bp][0]) != (ceOTM[bc][0] - ceOTM[sc][0])) {
            continue;
          }

          if ((ceCreditAmt + peCreditAmt) < 30) {
            continue;
          }
          let buyPut = {
            strikePrice: peOTM[bp][0],
            premium: peOTM[bp][2],
            lotSize: 1
          }

          let sellPut = {
            strikePrice: peOTM[sp][0],
            premium: peOTM[sp][1],
            lotSize: 1
          }
          let sellCall = {
            strikePrice: ceOTM[sc][0],
            premium: ceOTM[sc][1],
            lotSize: 1
          }
          let buyCall = {
            strikePrice: ceOTM[bc][0],
            premium: ceOTM[bc][2],
            lotSize: 1
          }

          let d = optionChainPayoffCal([buyCall], [sellCall], [buyPut], [sellPut], [], [])
          let [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer] = findLowerBoundUpperBound(Underlying_Value, d)
          resultArr.push({
            data: d,
            lowerBound: lowerBound,
            lowerBoundDiff: lowerBound + " (-" + parseInt(Underlying_Value - lowerBound) + ")",
            uppderBound: uppderBound,
            uppderBoundDiff: uppderBound + " (+" + parseInt(uppderBound - Underlying_Value) + ")",
            premiumRec: parseFloat(ceCreditAmt + peCreditAmt).toFixed(2),
            maxLoss: parseFloat(sellPut.strikePrice - buyPut.strikePrice - (ceCreditAmt + peCreditAmt)).toFixed(2),
            buyPutSt: buyPut.strikePrice,
            buyPutPre: buyPut.premium,
            sellPutSt: sellPut.strikePrice,
            sellPutPre: sellPut.premium,
            buyCallSt: buyCall.strikePrice,
            buyCallPre: buyCall.premium,
            sellCallSt: sellCall.strikePrice,
            sellCallPre: sellCall.premium,

            range: sellPut.strikePrice + ' - ' + sellCall.strikePrice,
            ceSt: sellCall.strikePrice,
            cePre: sellCall.premium,
            peSt: sellPut.strikePrice,
            pePre: sellPut.premium,
            sellPutIV: peOTM[sp][5],
            buyPutIV: peOTM[bp][5],
            sellCallIV: ceOTM[sc][5],
            buyCallIV: ceOTM[bc][5],
            upPer: parseFloat((uppderBound - Underlying_Value) / Underlying_Value * 100).toFixed(2),
            downPer: parseFloat((lowerBound - Underlying_Value) / Underlying_Value * 100).toFixed(2),
          })
        }
      }
    }
  }
  //console.dir(resultArr)
  return resultArr;
}
function displayIronConderStrangle() {
  prepareStrikeWithPremium()
  let d = ironConderCal(PE_OTM, CE_OTM)
  webix.ui({
    view: "window",
    id: 'strategyWinId',
    width: window.innerWidth - 2,
    height: window.innerHeight - 2,
    position: 'center',
    zIndex: 9999,
    head: {
      view: "toolbar", id: 'strategyWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Iron Condor Spread : " + SelectedScript + '  [' + SelectedExpiryDate + ']' },
        { view: "label", id: 'spotPriceId', label: "Spot Price (SP): " + Underlying_Value },
        { view: "button", label: 'X', width: 30, align: 'left', click: function () { $$('strategyWinId').close(); } }
      ]
    },
    body: {
      view: "datatable", hover: "myhover", css: "rows",
      columns: [
        { id: "range", header: ["Strike Price"], width: 150, },
        {
          id: "lowerBound", header: ["Lower Bound", { content: "numberFilter" }], width: 120, sort: "int", template: function (obj) {
            return obj.lowerBoundDiff
          }
        },
        {
          id: "uppderBound", header: ["Upper Bound", { content: "numberFilter" }], width: 120, sort: "int", template: function (obj) {
            return obj.uppderBoundDiff
          }
        },

        { id: "premiumRec", header: ["Premium Received", { content: "numberFilter" }], width: 160, sort: "int" },
        { id: "maxLoss", header: "Max Loss", width: 100, sort: "int" },
        { id: "downPer", header: ["<-- %", { content: "numberFilter" }], width: 100, sort: "int" },
        { id: "upPer", header: ["--> %", { content: "numberFilter" }], width: 100, sort: "int" },
        { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>", fillspace: true },
      ],
      select: "row",
      data: d,
      onClick: {
        details_button: function (ev, id) {

          let obj = this.data.pull[id.row]
          let peBuy = {
            buyOrSell: BUY,
            type: PE_TYPE,
            strikePrice: obj.buyPutSt,
            premium: obj.buyPutPre,
            lots: 1
          }

          let peSell = {
            buyOrSell: SELL,
            type: PE_TYPE,
            strikePrice: obj.sellPutSt,
            premium: obj.sellPutPre,
            lots: 1
          }

          let ceBuy = {
            buyOrSell: BUY,
            type: CE_TYPE,
            strikePrice: obj.buyCallSt,
            premium: obj.buyCallPre,
            lots: 1
          }
          let ceSell = {
            buyOrSell: SELL,
            type: CE_TYPE,
            strikePrice: obj.sellCallSt,
            premium: obj.sellCallPre,
            lots: 1
          }

          strategyCal(Underlying_Value, SelectedScript, SelectedExpiryDate, [peBuy, peSell, ceBuy, ceSell])
        }
      }
    },
  }).show()
}
function DecimalFixed(val) {
  var noDecimal = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var escapeHypen = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  //return parseFloat(val).toFixed(2);
  //return val.toLocaleString();
  // A more complex example:
  val = parseFloat(val) || 0;
  var num = val === 0 && !escapeHypen ? '-' : val.toLocaleString("en-IN", {
    // minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    minimumFractionDigits: noDecimal ? 0 : 2,
    maximumFractionDigits: noDecimal ? 0 : 2
  });
  return num;
}
function fetchOptionHistory(optionType, strikePrice, expiryDate, symbol) {
  webix.storage.session.put('optionHistoryInput', { optionType, strikePrice, expiryDate, symbol })
  dispatchChangeEvent('#optionHistoryId')
}
let GlobalMarketHeader = [{ id: 'country', header: 'Country' }, { id: 'exchange', header: 'Stock Exchange' },
{ id: 'index', header: 'Index' }, { id: 'openTime', header: 'Opening Time (India Time)' }, { id: 'closeTime', header: 'Closing Time (India Time)' }]
let GlobalMarketTimings = [
  { country: 'Japan', exchange: 'Japan Exchange Group', index: 'Nikkei', openTime: '5 : 30 AM', closeTime: '11 : 30 AM' },
  { country: 'Australia', exchange: 'Australian Securities Exchange', index: 'S&P ASX', openTime: '5 : 30 AM', closeTime: '11 : 30 AM' },
  { country: 'South Korea', exchange: 'KRX Korean Exchange', index: 'Kospi', openTime: '5 : 30 AM', closeTime: '11 : 30 AM' },
  { country: 'Hong Kong', exchange: 'HKEX Hong Kong Exchange', index: 'Hang Seng', openTime: '6 : 45 AM', closeTime: '1 : 30 PM' },
  { country: 'China', exchange: 'Shanghai Stock Exchange & Shenzen stock Exchange', index: 'SSE', openTime: '7 : 00 AM', closeTime: '12 : 30 PM' },
  { country: 'India', exchange: 'NSE & BSE ', index: 'Nifty & Sensex', openTime: '9 : 15 AM', closeTime: '3 : 30 PM' },
  { country: 'Germany', exchange: 'Deutsche Börse AG', index: 'DAX', openTime: '12 : 30 PM', closeTime: '2 : 30 AM' },
  { country: 'UK', exchange: 'London Stock Exchange', index: 'FTSE', openTime: '1 : 30 PM', closeTime: '10 : 00 PM' },
  { country: 'USA', exchange: 'NYSE, NASDAQ', index: 'Dow, NASDAQ, S&P 500', openTime: '7 : 00 PM', closeTime: '1 : 30 AM' }
]

function dispatchChangeEvent(elementId, eleVal) {
  let e = new Event("change")
  let element = document.querySelector(elementId)
  if (eleVal) {
    element.value = eleVal
  }
  element.dispatchEvent(e)
}
function processDataForCalenderUI(id) {
  let ScriptHistoryData = webix.storage.local.get('ScriptHistoryData')
  let data = ScriptHistoryData[id]
  let cData = {}
  data.forEach(function (currentValue, index, arr) {
    if (data[index + 1]) {
      cData[currentValue[0]] = [data[index + 1][4], currentValue[4]]
    }
  })
  return cData;
}
function showViewId(id) {
  ViewIds.forEach(v => {
    if (v == id) {
      $$(v) && $$(v).show()
    } else {
      $$(v) && $$(v).hide()
    }
  })
}
function generateContinuousCells(type) {
  let cells = [];
  for (let i = 10; i > 0; i--) {
    cells.push({
      id: i + 'd' + (type === 'Loss' ? 'l' : 'p'),
      header: i + "D",
      body: {
        id: i + "d" + type + "Id",
        view: "datatable",
        columns: [
          { id: 'id', header: 'Script', width: 150 },
          {
            id: 'per', header: '% (Rs)', width: 310, template: function (obj) {
              return getTemplateForContinues(obj['per'], obj['pol'], obj['closePrice'], obj['prevClose']);
            }, sort: 'int', fillspace: true
          },
        ],
        data: [],
        on: {
          onAfterLoad: function () {
            this.sort("per", "desc");
            this.markSorting("per", "desc");
          }
        }
      }
    })
  }
  cells.push({
    id: 'Alld' + (type === 'Loss' ? 'l' : 'p'),
    header: "All",
    body: {
      id: "Alld" + type + "Id",
      view: "datatable",
      columns: [
        { id: 'id', header: 'Script', width: 150 },
        {
          id: 'per', header: '% (Rs)', width: 310, template: function (obj) {
            return getTemplateForContinues(obj['per'], obj['pol'], obj['closePrice'], obj['prevClose']);
          }, sort: 'int'
        },
        {
          id: 'days', header: '(?)D', width: 310, template: function (obj) {
            return obj['days']
          }, sort: 'int', fillspace: true
        },
      ],
      data: [],
      on: {
        onAfterLoad: function () {
          this.sort("per", "desc");
          this.markSorting("per", "desc");
        }
      }
    }
  })
  return cells;
}
function getTemplateForContinues(per, pol, closePrice, pClose) {
  return per < 0 ? ("<span style='color:#fd505c'>" + per + "% (" + pol + ")</span>" +
    " <span style='color:#fd505c'>[CP: " + closePrice + " , PC: " + pClose + "]</span>")
    : ("<span style='color:#02a68a'>" + per + "% (" + pol + ")</span> " +
      " <span style='color:#02a68a'>[CP: " + closePrice + " , PC: " + pClose + "]</span>")
}
function continuousWiseAllCal() {
  let dd = webix.storage.local.get('ScriptHistoryData')
  Object.keys(dd).forEach(k => continuousWiseCal(k))
}
function continuousWiseCal(scriptName) {
  let dd = webix.storage.local.get('ScriptHistoryData')
  let data = dd[scriptName]
  if (!data) {
    console.dir(scriptName);
    return;
  }
  let calculatedData = {
    id: scriptName,
    conWise: {
      pos: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      neg: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    },
  }

  for (let i = 10; i > 0; i--) {
    let v = data.slice(0, i + 1).filter(function (val, index, array) {
      return array[index + 1] && parseFloat((val[4] - array[index + 1][4]).toFixed(2)) > 0
    }).map(function (val) {
      return val;
    })
    if (v.length === i) {
      calculatedData.conWise.pos[i - 1] = {
        pol: parseFloat((v[0][4] - data[i][4]).toFixed(2)),
        per: (parseFloat(((v[0][4] - data[i][4]) * 100 / data[i][4]).toFixed(2))),
        closePrice: v[0][4],
        prevClose: data[i][4]
      }
      break;
    }
    v = data.slice(0, i + 1).filter(function (val, index, array) {
      return array[index + 1] && parseFloat((val[4] - array[index + 1][4]).toFixed(2)) < 0
    }).map(function (val) {
      return val;
    })
    if (v.length === i) {
      calculatedData.conWise.neg[i - 1] = {
        pol: parseFloat((v[0][4] - data[i][4]).toFixed(2)),
        per: (parseFloat(((v[0][4] - data[i][4]) * 100 / data[i][4]).toFixed(2))),
        closePrice: v[0][4],
        prevClose: data[i][4]
      }
      break;
    }
  }

  ContinuousWiseData[scriptName] = calculatedData
  webix.storage.local.put('ContinuousWiseData', ContinuousWiseData)
}
function displayContinuousData() {
  let dd = webix.storage.local.get('ContinuousWiseData')
  let posArr = {
    '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': []
  }
  let negArr = {
    '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': []
  }
  Object.keys(dd)
  Object.keys(dd).forEach(k => {
    let s = dd[k]
    let obj = { id: s.id }
    for (let i = 9; i >= 0; i--) {
      if (Object.keys(s.conWise.pos[i]).length > 0) {
        obj['pol'] = s.conWise.pos[i]['pol']
        obj['per'] = s.conWise.pos[i]['per']
        obj['prevClose'] = s.conWise.pos[i]['prevClose']
        obj['closePrice'] = s.conWise.pos[i]['closePrice']
        obj['days'] = i + 1
        posArr[i].push(obj)
        break;
      }
    }
    for (let i = 9; i >= 0; i--) {
      if (Object.keys(s.conWise.neg[i]).length > 0) {
        obj['pol'] = s.conWise.neg[i]['pol']
        obj['per'] = s.conWise.neg[i]['per']
        obj['prevClose'] = s.conWise.neg[i]['prevClose']
        obj['closePrice'] = s.conWise.neg[i]['closePrice']
        obj['days'] = i + 1
        negArr[i].push(obj)
        break;
      }
    }
  })
  let posAll = []
  Object.keys(posArr).forEach(k => {
    let kInt = parseInt(k)
    let id = (kInt + 1) + 'dProfitId'
    $$(id).parse(posArr[k])
    posAll = posAll.concat(posArr[k])
    $$('continuousProfitId').getTabbar().config.options[(9 - kInt)].value = (kInt + 1) + 'D (' + posArr[k].length + ')'
    if (posArr[k].length === 0) {
      $$('continuousProfitTabbarId').hideOption(id)
    } else {
      $$('continuousProfitTabbarId').showOption(id)
    }
  })
  $$('AlldProfitId').parse(posAll)
  $$('continuousProfitId').getTabbar().render()
  let negAll = []
  Object.keys(negArr).forEach(k => {
    let kInt = parseInt(k)
    let id = (kInt + 1) + 'dLossId'
    $$(id).parse(negArr[k])
    negAll = negAll.concat(negArr[k])
    $$('continuousLossId').getTabbar().config.options[(9 - kInt)].value = (kInt + 1) + 'D (' + negArr[k].length + ')'
    if (negArr[k].length === 0) {
      $$('continuousLossTabbarId').hideOption(id)
    } else {
      $$('continuousLossTabbarId').showOption(id)
    }
  })
  $$('AlldLossId').parse(negAll)
  $$('continuousLossId').getTabbar().render()
}
function yearWisePercentageCal(scriptName) {
  let dd = webix.storage.local.get('ScriptHistoryData')
  let sArr = []
  if (scriptName) {
    let temp = {}
    temp[scriptName] = dd[scriptName]
    dd = temp
    if (!temp[scriptName]) {
      return {}
    }
  }
  Object.keys(dd).forEach(s => {
    let d = dd[s]
    let cDate = d[0][0]
    let cClose = d[0][4]
    let oneYearDate = new Date(cDate);
    oneYearDate.setFullYear(oneYearDate.getFullYear() - 1);
    let oneYearClose = 0
    let lowPrice = d[0][3]
    let highPrice = d[0][2]
    let lowPriceDate = d[0][0]
    let highPriceDate = d[0][0]
    d.forEach(a => {
      if (new Date(a[0]) >= oneYearDate) {
        oneYearClose = a[4]
        if (lowPrice > a[3]) {
          lowPrice = a[3]
          lowPriceDate = a[0]
        }
        if (highPrice < a[2]) {
          highPrice = a[2]
          highPriceDate = a[0]
        }
      }
    })
    sArr.push({
      name: s,
      pol: parseFloat(cClose - oneYearClose).toFixed(2),
      per: parseFloat((cClose - oneYearClose) / oneYearClose * 100).toFixed(2),
      lowPrice: lowPrice,
      lowPriceDate: lowPriceDate,
      highPrice: highPrice,
      highPriceDate: highPriceDate,
      below52WksPer: parseFloat((cClose - highPrice) / highPrice * 100).toFixed(2),
      below52Wks: parseFloat(cClose - highPrice).toFixed(2)
    })
  })
  //console.dir(sArr)
  return sArr
}
function watchListCal() {
  let OptionData = webix.storage.local.get('OptionChainData')
  WatchList = webix.storage.local.get('WatchList')
  for (let i = 0; i < WatchList.length; i++) {
    let strategy = WatchList[i]
    strategy.pol = 0
    let lotSize = 0;
    if (strategy.script == 'NIFTY') {
      lotSize = 50
    } else if (strategy.script == 'BANKNIFTY') {
      lotSize = 25
    } else {
      lotSize = ScriptNames[strategy.script].lotSize
    }
    let optionDataArr = OptionData[strategy.script]['data'][strategy.expiryDate]
    if (optionDataArr) {
      let dArr = strategy.list
      for (let i = 0; i < dArr.length; i++) {
        let json = dArr[i]
        if (json.type == '') {
          json.latestPremium = OptionData[strategy.script]['underlyingValue']
          if (json.buyOrSell == 1) {
            json.pl = lotSize * (json.latestPremium - json.premium) * json.lots
          } else {
            json.pl = lotSize * (json.premium - json.latestPremium) * json.lots
          }
          strategy.pol += json.pl
        } else {
          for (let k = 0; k < optionDataArr.length; k++) {
            let st = Object.keys(optionDataArr[k])[0]
            if (st == json.strikePrice) {
              let ceOrpe = optionDataArr[k][st][json.type == 1 ? 'CE' : 'PE']
              if (ceOrpe) {
                json.latestPremium = json.buyOrSell == 1 ? ceOrpe.bidprice : ceOrpe.askPrice
                if (json.buyOrSell == 1) {
                  json.pl = lotSize * (json.latestPremium - json.premium) * json.lots
                } else {
                  json.pl = lotSize * (json.premium - json.latestPremium) * json.lots
                }
                strategy.pol += json.pl
                break
              }
            }
          }
        }
      }
      strategy.pol = parseFloat(parseFloat(strategy.pol).toFixed(2))
    }
  }
  webix.storage.local.put('WatchList', WatchList)
}

function displayStrategyLatestDetails(obj) {
  let time_difference = new Date().getTime() - new Date(obj.createDate).getTime()
  let days_difference = parseInt(time_difference / (1000 * 60 * 60 * 24))
  let remainingDays = parseInt((new Date(obj.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  let html = `<div style="width:100%;height:100%;overflow:auto;">Expiry Date: <b>${obj.expiryDate}</b>, Purchased Underlying @ <b>${obj.UV}</b>, `
  html += `DTE: <b>${remainingDays}</b>, Created Date: ${obj.createDate} <br>`
  let opStArr = obj.list
  for (let i = 0; i < opStArr.length; i++) {
    if (opStArr[i].type == '') {
      html = html + `${opStArr[i].buyOrSell == 1 ? 'Buy ' : 'Sell '} ${opStArr[i].lots} Lot(s) Futures ₹ <b>${opStArr[i].premium}</b> [${opStArr[i].latestPremium}]`
    } else {
      html = html + `${opStArr[i].buyOrSell == 1 ? 'Buy ' : 'Sell '} ${opStArr[i].lots} Lot(s) <b>${opStArr[i].strikePrice}</b> ${opStArr[i].type == 1 ? 'CE' : 'PE'}  @  ₹ <b>${opStArr[i].premium}</b> [${opStArr[i].latestPremium}]`
    }
    html = html + ` ₹ <b><span style="color:${opStArr[i].pl < 0 ? '#ec6500' : '#18c915'}">${parseFloat(opStArr[i].pl).toFixed(2)}</span></b> <br>`
  }
  html = html + `Profit/Loss: ₹<b><span style="color:${obj.pol < 0 ? '#ec6500' : '#18c915'}">${obj.pol}</span></b></div>`
  return html
}
function deleteWatchList(key) {
  if (confirm('Are you sure to delete the strategy?')) {
    WatchList = webix.storage.local.get('WatchList')
    let tempList = []
    let flag = false
    for (let i = 0; i < WatchList.length; i++) {
      if (WatchList[i].key != key) {
        tempList.push(WatchList[i])
      } else {
        flag = true
      }
    }
    flag && webix.delay(() => {
      webix.message({ text: "Deleted the strategy item", type: "success" })
      $$('watchListDatatableId').clearAll()
      $$('watchListDatatableId').parse(tempList)
    })
    WatchList = tempList
    webix.storage.local.put('WatchList', WatchList)
  }

}
function showOptionGraph(ce, pe, st, ed) {
  webix.ui({
    view: "window",
    height: 500,
    width: 590,
    move: true,
    modal: true,
    id: 'optionChartWinId',
    head: {
      view: "toolbar", id: 'strategyWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Chart: Strike Price: " + st + ", Expiry Date: " + ed },
        {
          view: "button", label: 'X', width: 40, align: 'left', click: function () {
            $$('optionChartWinId').close();
            OCChart && OCChart.destroy();
          }
        }]
    },
    position: "center",
    body: {
      rows: [
        { view: 'template', template: '<div id="optionChainGraph" style="width:100%;height:100%;"></div>' }]
    },
    on: {
      onShow: function () {
        document.getElementById("optionChainGraph").innerHTML = loader
        dispatchChangeEvent('#ocGraphReqId', ce + "," + pe)
      }
    }
  }).show();
}
function showOptionChart() {
  document.getElementById("optionChainGraph").innerHTML = ''
  let seriesOptions = webix.storage.session.get('OptionChainGraph')
  try {
    OCChart = Highcharts.stockChart('optionChainGraph', {
      rangeSelector: {
        enabled: false,
        selected: 2,
        inputEnabled: false
      },
      credits: {
        enabled: false
      },
      navigator: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      yAxis: {
        opposite: false,
        plotLines: [{
          value: 0,
          width: 2,
          color: 'silver'
        }]
      },
      plotOptions: {
        series: {
          compare: 'percent',
          showInNavigator: true
        }
      },
      tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
        valueDecimals: 2,
        split: true
      },
      series: seriesOptions
    });
  } catch (err) {
    console.log('err', err);
  }
}
function showVolatilitySmileChart() {

  !SelectedScript && webix.message({ text: "Please select script", type: "error", expire: 500 })
  SelectedScript && webix.ui({
    view: "window",
    height: 500,
    width: 590,
    move: true,
    modal: true,
    id: 'volatilityWinId',
    head: {
      view: "toolbar", id: 'strategyWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Volatility Skew of " + SelectedScript },
        {
          view: "button", label: 'X', width: 40, align: 'left', click: function () {
            $$('volatilityWinId').close();
            OCChart && OCChart.destroy();
          }
        }]
    },
    position: "center",
    body: {
      rows: [
        { view: 'template', template: '<div id="volatilityGraph" style="width:100%;height:100%;"></div>' }]
    },
    on: {
      onShow: function () {
        prepareStrikeWithPremium()
        let vs = []
        CE_OTM.reverse().filter(v => v[5] > 0).forEach(v => vs.push(v[5]))
        PE_OTM.reverse().filter(v => v[5] > 0).forEach(v => vs.push(v[5]))
        try {
          OCChart = Highcharts.chart('volatilityGraph', {
            title: { text: '' },
            yAxis: {
              title: { text: '' }
            },

            series: [{
              name: 'Volatility Smile',
              data: vs
            },],
          });
        } catch (e) {
        }
      }
    }
  }).show();
}
function showIntExtChart() {
  !SelectedScript && webix.message({ text: "Please select script", type: "error", expire: 500 })
  SelectedScript && webix.ui({
    view: "window",
    height: 500,
    width: 630,
    move: true,
    modal: true,
    id: 'intExtWinId',
    head: {
      view: "toolbar", id: 'IntExtWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Intrinsic & Extrinsic of " + SelectedScript },
        {
          view: "switch", onLabel: "CE", width: 70, offLabel: "PE", value: 1, on: {
            onChange: function (newValue, oldValue, config) {
              OCChart && OCChart.destroy();
              prepareDataForIntExt(newValue == 1 ? 'CE' : 'PE')
            }
          }
        },
        {
          view: "button", label: 'X', width: 40, align: 'left', click: function () {
            $$('intExtWinId').close();
            OCChart && OCChart.destroy();
          }
        }]
    },
    position: "center",
    body: {
      rows: [
        { view: 'template', template: '<div id="intExtGraph" style="width:100%;height:100%;"></div>' }]
    },
    on: {
      onShow: function () {
        prepareDataForIntExt('CE')
      }
    }
  }).show();
}
function prepareDataForIntExt(type) {
  let sData = OptionChainData[SelectedScript]
  let ocArr = sData.data[SelectedExpiryDate]
  let allOcs = []
  for (let i = 0; i < ocArr.length; i++) {
    allOcs.push(Object.keys(ocArr[i])[0])
  }
  let closest = allOcs.reduce(function (prev, curr) {
    return Math.abs(curr - Underlying_Value) < Math.abs(prev - Underlying_Value) ? curr : prev;
  });

  let tenPer = Underlying_Value * 5 / 100
  let upper = Underlying_Value + tenPer
  let lower = Underlying_Value - tenPer

  let intExt = []
  for (let i = 0; i < ocArr.length; i++) {
    let stPrice = Object.keys(ocArr[i])[0]
    if (type == 'CE') {
      let ce = ocArr[i][stPrice]['CE']
      if (ce) {
        if (ce.strikePrice > lower && ce.strikePrice < upper) {
          if (ce.strikePrice < Underlying_Value) {
            let int = Underlying_Value - ce.strikePrice
            intExt.push([ce.strikePrice, parseInt(int), parseInt(ce.lastPrice - int)])
          } else {
            intExt.push([ce.strikePrice, 0, parseInt(ce.lastPrice)])
          }
        }
      }
    } else {
      let pe = ocArr[i][stPrice]['PE']
      if (pe) {
        if (pe.strikePrice > lower && pe.strikePrice < upper) {
          if (pe.strikePrice > Underlying_Value) {
            let int = pe.strikePrice - Underlying_Value
            intExt.push([pe.strikePrice, parseInt(int), parseInt(pe.lastPrice - int)])
          } else {
            intExt.push([pe.strikePrice, 0, parseInt(pe.lastPrice)])
          }
        }
      }
    }
  }

  try {
    OCChart = Highcharts.chart('intExtGraph', {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Intrinsic & Extrinsic'
      },
      xAxis: {
        categories: intExt.map(s => s[0])
      },
      yAxis: {
        min: 0,
        title: {
          text: ''
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: ( // theme
              Highcharts.defaultOptions.title.style &&
              Highcharts.defaultOptions.title.style.color
            ) || 'gray'
          }
        }
      },
      legend: {
        align: 'right',
        x: -30,
        verticalAlign: 'top',
        y: 25,
        floating: true,
        backgroundColor:
          Highcharts.defaultOptions.legend.backgroundColor || 'white',
        borderColor: '#CCC',
        borderWidth: 1,
        shadow: false
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true
          }
        }
      },
      series: [{
        name: 'Extrinsic',
        data: intExt.map(s => s[2])
      }, {
        name: 'Intrinsic',
        data: intExt.map(s => s[1])
      }]
    });
  } catch (e) {
  }
}
function toFixed(num, fixed) {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
}
function displayMonthWisePer(prev_date) {

  if ($('.webix_cal_month_name .day').length == 0) {
    let date = prev_date
    let dArr = date.toDateString().split(' ')
    let dStr = dArr[2] + '-' + dArr[1] + '-' + dArr[3]
    let ds = dStr.substr(3)

    let sDate = ''
    let eDate = ''
    let cArr = Object.keys(CalenderUI)
    for (let i = 0; i < cArr.length - 1; i++) {
      let d = cArr[i]
      if (eDate == '' && ds == d.substr(3)) {
        sDate = d
        eDate = d
      } else if (eDate != '' && ds == d.substr(3)) {
        sDate = d
      }
    }

    if (sDate != '' && eDate != '') {
      let per = parseFloat((CalenderUI[eDate][1] - CalenderUI[sDate][0]) / CalenderUI[sDate][0] * 100).toFixed(2)
      let pol = parseFloat((CalenderUI[eDate][1] - CalenderUI[sDate][0])).toFixed(2)

      if (pol > 0) {
        html = "<span class='day' style='width:100%;height:100%;line-height: normal;color:#1d922a;font-size: medium;'><b>" + per + "%</b> (" + pol + ")</span>";
      } else {
        html = "<span class='day' style='width:100%;height:100%;line-height: normal;color:#d21616;font-size: medium;'> <b>" + per + "%</b> (" + pol + ")</span>";
      }
      $('.webix_cal_month_name').html($('.webix_cal_month_name').text() + ' ' + html)
    }
  }

}
function showAllPriceOfStrike(selectedStrike, expiryDate, ceITM, peITM) {
  let sData = OptionChainData[SelectedScript]
  if (expiryDate) {
    SelectedExpiryDate = expiryDate
    $$('expiryDateId').setValue(SelectedExpiryDate)
    $$('algoStrategyId').show()
    $$('algoStrategyButtonId').show()
    $$('strikePriceId').hide()
    $$('strikePriceId').setValue('')
  }
  let d = { data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp, ceITM, peITM }
  if (selectedStrike) {
    d['selectedStrike'] = selectedStrike
    $$('algoStrategyId').hide()
    $$('algoStrategyButtonId').hide()
    $$('strikePriceId').show()
    let stPer = DecimalFixed(((selectedStrike - Underlying_Value) / Underlying_Value * 100)) + '% (' + DecimalFixed(selectedStrike - Underlying_Value) + ')'
    $$('strikePriceId').setValue('Selected Strike : ' + DecimalFixed(selectedStrike) + ' ' + stPer)
  }

  $$('optionChainTemplateId').setValues(d)
  TableFilter['selectedStrike'] = selectedStrike
  TableFilter['expiryDate'] = expiryDate
  TableFilter['ceITM'] = ceITM
  TableFilter['peITM'] = peITM
  return false
}
function showGoogleGraph() {
  webix.ui({
    view: "window",
    width: window.innerWidth - 2,
    height: window.innerHeight - 2,
    position: 'center',
    move: true,
    modal: true,
    id: 'googleChartWinId',
    head: {
      view: "toolbar", id: 'strategyWinToolbarId', cols: [
        {
          view: "button", label: 'X', width: 40, align: 'left', click: function () {
            $$('googleChartWinId').close();
          }
        }]
    },
    position: "center",
    body: {
      rows: [
        { view: 'template', template: '<div id="googleGraph" style="width:100%;height:100%;"></div>' }]
    },
    on: {
      onShow: function () {
        document.getElementById("googleGraph").innerHTML = loader
        dispatchChangeEvent('#googleGraphReqId', '')
      }
    }
  }).show();
}
function attachBuySellButtons() {

  $('#indices-body>tr>td:nth-child(14)').mouseleave((e) => {
    $('.peSell').remove()
  })

  $('#indices-body>tr>td:nth-child(14)').mouseenter((e) => {
    let peSell = e.target.innerText
    let st = $(e.target).parent().find('td:nth-child(12)').get(0).innerText.trim().replaceAll(',', '')
    $(e.target).append(`
      <div class="peSell">
      <div style="transition-delay: 0.05s;">
      <button type="button" class="sellButton" onclick="displayPESell('${st}', '${peSell}')">
        <div>
        <span class="fa-stack">
          <strong class="fa-stack-1x">S</strong>
        </span>
        </div>
      </button>
      </div>
      </div>
  `)
  })

}
function displayPESell(strikePrice, peSell) {
  prepareStrikeWithPremium()
  let sellPut = {
    strikePrice: parseInt(strikePrice),
    premium: peSell,
    lotSize: 1
  }
  let d = optionChainPayoffCalCEPE([], [], [], [sellPut], [], [])
  let [lowerBound, lowerBoundPer, uppderBound, uppderBoundPer] = findLowerBoundUpperBound(Underlying_Value, d)
  let resultArr = []
  resultArr.push({
    data: d,
    lowerBound: lowerBound,
    lowerBoundDiff: lowerBound + " (-" + parseInt(Underlying_Value - lowerBound) + ")",
    uppderBound: uppderBound,
    uppderBoundDiff: uppderBound + " (+" + parseInt(uppderBound - Underlying_Value) + ")",
    premiumRec: 0,
  })

  webix.ui({
    view: "window",
    width: window.innerWidth - 2,
    height: window.innerHeight - 2,
    position: 'center',
    id: 'chartWinId',
    head: {
      view: "toolbar", id: 'strategyChartToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Sell Put : " + SelectedScript + '  [' + SelectedExpiryDate + ']' },
        {
          view: "button", type: 'icon', width: 30, icon: "mdi mdi-information", click: function () {
            if ($$("inputInfoId").isVisible()) {
              $$("inputInfoId").hide();
            } else {
              $$("inputInfoId").show();
            }
          }
        },
        { view: "button", label: 'X', width: 50, align: 'left', click: function () { $$('chartWinId').close(); } }
      ]
    },
    body: {
      rows: [
        {
          id: 'inputInfoId', height: 70, cols: [

            {
              rows: [
                { view: 'template', template: '' },
                { view: 'template', borderless: true, template: '<div style="text-align: center;">Premium Received: ₹<b>' + 0 + '</b></div>' },
              ]
            },
          ]
        },
        { view: 'template', template: '<div id="strategyChartId" style="width: 100%;height: 100%;background-color: aliceblue;"></div>' },
      ]
    }
  }).show();

}
function optionChainPayoffCalCEPE(buyCallArr, sellCallArr, buyPutArr, sellPutArr, buyStockArr, sellStockArr) {

  let lowerStrike = sellPutArr[0].strikePrice - 400;
  let higherStrike = sellPutArr[0].strikePrice + 400;

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
function openScriptDailyDetails(scriptName) {
  let dd = webix.storage.local.get('ScriptHistoryData')
  let sData = dd[scriptName].slice(0);
  for (var i = 0; i < sData.length - 1; i++) {
    let s = sData[i]
    s.push(parseFloat(sData[i][4] - sData[i + 1][4]).toFixed(2))
    s.push(parseFloat((sData[i][4] - sData[i + 1][4]) / sData[i + 1][4] * 100).toFixed(2))
    s.push(parseFloat(sData[i][2] - sData[i][3]).toFixed(2))
  }

  webix.ui({
    view: "window",
    id: "scriptWindowId",
    fullscreen: true,
    /*modal: true,
    position: "center",
    minHeight: 400,
    scroll: "xy",
    resize: true,
    minWidth: 955,*/
    head: {
      rows: [
        {
          view: "toolbar", cols: [
            {
              view: "label", label: scriptName, align: 'center', template: "<a target='_blank' href='https://nseindia.com/companytracker/cmtracker.jsp?symbol="
                + scriptName + "&cName=cmtracker_nsedef.css'> " + scriptName + " </a>"
            },
            { view: "button", label: 'X', width: 30, align: 'right', click: "  $$('scriptWindowDataTableId').config.profitDaysChart.destroy();$$('scriptWindowDataTableId').config.lossDaysChart.destroy();$$('scriptWindowId').destructor();" }
          ]
        },
        {
          cols: [
            {
              view: "select", id: "scriptSelectionId", width: 100,
              options: [{ id: 0, value: "1 week" }, { id: 1, value: "2 weeks" }, { id: 2, value: "3 weeks" }, { id: 3, value: "1 month" },
              { id: 4, value: "3 months" }, { id: 5, value: "1 year" }],
              on: {
                onChange: function (selectedVal) {
                  $$('scriptWindowDataTableId').clearAll()
                  let dataWeek = weeksData.weeksWise[parseInt(selectedVal)]
                  let index = (parseInt(selectedVal) + 1)
                  if (selectedVal === '4') {
                    index = 12
                  } else if (selectedVal === '5') {
                    index = 52
                  }
                  let endDate = dataWeek[index + 'weeks-date'].substr(14)
                  let endDataIndex = dd.scriptData[scriptName].findIndex(function (val) { return val[DateStr] === endDate })
                  let sData = dd.scriptData[scriptName].slice(0, endDataIndex + 1);
                  $$('scriptWindowDataTableId').parse(sData)
                  $$('scriptWindowDataTableId').config.total = sData.length;

                  let summaryLabel = "Date: " + dataWeek[index + 'weeks-date'] + " PL: " + fetchBGColor(dataWeek[index + 'weeks-pol'])
                    + " %: " + fetchBGColor(dataWeek[index + 'weeks-per']) + " High: <span style='color:green;'> " + dataWeek[index + 'weeks-high'] + "</span>"
                    + "( " + dataWeek[index + 'weeks-highDate'] + ")"
                    + " Low: " + + dataWeek[index + 'weeks-low'] + "( " + dataWeek[index + 'weeks-lowDate'] + ")"

                  $$('summaryId').setHTML(summaryLabel)
                  drawCharts(sData)
                }
              }
            },
            {
              view: "label", id: "summaryId", label: "Date: " + '1weeks-date' + " PL: " + fetchBGColor(10)
                + " %: " + fetchBGColor(1) + " High: " + '1weeks-high' + "( " + 1 + ")"
                + " Low: " + + 1 + "( " + 1 + ")"
            },
          ]
        }
      ]
    }
    ,
    body: {
      cols: [
        {
          id: "scriptWindowDataTableId",
          view: "datatable",
          scroll: "xy",
          select: "row",
          columns: [
            {
              id: 0, header: "Date", template: function (obj) {
                return obj[0]
              }
            },
            {
              id: 4, header: "Close", template: function (obj) {
                return obj[4]
              }
            },
            {
              id: 5, header: ["PL", { content: "numberFilter" }], width: 70, sort: "int", template: function (obj) {
                return fetchBGColor(obj[5])
              }
            },
            {
              id: 6, header: ["%", { content: "numberFilter" }], width: 70, sort: "int", template: function (obj) {
                return fetchBGColor(obj[6])
              }
            },
            {
              id: 1, header: "Open", width: 70
            },
            {
              id: 3, header: "Low", width: 70
            },
            {
              id: 2, header: "High", width: 70
            },
            {
              id: 7, header: ["H-L", { content: "numberFilter" }], sort: "int", width: 70
            }
          ],
          data: sData,
          total: sData.length,
          on: {
            onAfterFilter: function () {
              webix.message("No.of records: " + this.count() + ' of ' + $$('scriptWindowDataTableId').config.total);
            }
          }
        },
        { view: "resizer" },
        {
          rows: [
            {
              view: 'template', id: 'profitId', template: '<div style="width:100%;height:100%;" id="profitDaysId"></div>'
            },
            {
              view: 'template', id: 'lossId', template: '<div style="width:100%;height:100%;" id="lossDaysId"></div>'
            },
          ]
        }]
    },
    on: {
      onShow: function () {
        drawCharts(sData)
      }
    }
  }).show();
}
function fetchBGColor(val) {
  let cls = 'class="' + (val > 0 ? 'green' : 'red') + '"'
  return '<span ' + cls + '>' + val + '</span>'
}
function drawCharts(sData) {
  let commonChart = {
    chart: {
      renderTo: '',
      type: 'pie',
      margin: [0, 200, 0, 0],
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0
    },
    title: {
      //verticalAlign: 'middle',
      floating: true,
      text: '',
    },
    yAxis: {
      title: {
        text: ''
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        colors: [],
        dataLabels: {
          enabled: true,
          color: '#000000',
          connectorColor: '#000000',
          formatter: function () {
            return '<b>' + this.point.name + '</b>: ' + this.y + ' days';
          }
        }
      }
    },
    tooltip: {
      formatter: function () {
        return '<b>' + this.point.name + '</b>: ' + this.y + ' days';
      }
    },
    legend: {
      enabled: true,
      floating: true,
      verticalAlign: 'xbottom',
      align: 'right',
      layout: 'vertical',
      y: 5,
      labelFormatter: function () {
        return this.name + '-->' + '<span style=\"color:' + this.color + '\">' + this.y + ' days</span>';
      }
    },
    credits: { enabled: false },
    series: [{
      name: 'Profit Days',
      data: [],
      innerSize: '55%',
      showInLegend: true,
      dataLabels: {
        enabled: true
      }
    }]
  }

  commonChart.chart.renderTo = 'profitDaysId'
  commonChart.series[0].name = 'Profit Days',
    commonChart.series[0].data = [["(0<1)%", 0], ["(1<2)%", 0], ["(2<3)%", 0], ["(3<4)%", 0], ["(4<5)%", 0], ["(5<6)%", 0], ["(6<7)%", 0], ["(7<8%)", 0], ["(8<9)%", 0], ["(>9)%", 0]]

  for (let d of sData) {
    if (d[6] >= 0 && d[6] < 1) {
      commonChart.series[0].data[0][1] = commonChart.series[0].data[0][1] + 1
    } else if (d[6] >= 1 && d[6] < 2) {
      commonChart.series[0].data[1][1] = commonChart.series[0].data[1][1] + 1
    } else if (d[6] >= 2 && d[6] < 3) {
      commonChart.series[0].data[2][1] = commonChart.series[0].data[2][1] + 1
    } else if (d[6] >= 3 && d[6] < 4) {
      commonChart.series[0].data[3][1] = commonChart.series[0].data[3][1] + 1
    } else if (d[6] >= 4 && d[6] < 5) {
      commonChart.series[0].data[4][1] = commonChart.series[0].data[4][1] + 1
    } else if (d[6] >= 5 && d[6] < 6) {
      commonChart.series[0].data[5][1] = commonChart.series[0].data[5][1] + 1
    } else if (d[6] >= 6 && d[6] < 7) {
      commonChart.series[0].data[6][1] = commonChart.series[0].data[6][1] + 1
    } else if (d[6] >= 7 && d[6] < 8) {
      commonChart.series[0].data[7][1] = commonChart.series[0].data[7][1] + 1
    } else if (d[6] >= 8 && d[6] < 9) {
      commonChart.series[0].data[8][1] = commonChart.series[0].data[8][1] + 1
    } else if (d[6] >= 9) {
      commonChart.series[0].data[9][1] = commonChart.series[0].data[9][1] + 1
    }
  }
  let pdata = []
  for (let i = 0; i < 10; i++) {
    if (commonChart.series[0].data[i][1] != 0) {
      pdata.push(commonChart.series[0].data[i])
    }
  }
  commonChart.series[0].data = pdata
  if ($$('scriptWindowDataTableId').config.profitDaysChart) {
    $$('scriptWindowDataTableId').config.profitDaysChart.destroy()
  }
  commonChart.plotOptions.pie.colors = ['#98FB98', '#90EE90', '#3CB371', '#20B2AA', '#ADFF2F', '#00FF7F', '#00FA9A', '#008000', '#00FF00', '#2E8B57',]
  $$('scriptWindowDataTableId').config.profitDaysChart = new Highcharts.Chart(commonChart);
  commonChart.chart.renderTo = 'lossDaysId'
  commonChart.series[0].name = 'Loss Days',
    commonChart.series[0].data = [["<-1%", 0], ["<-2%", 0], ["<-3%", 0], ["<-4%", 0], ["<-5%", 0], ["<-6%", 0], ["<-7%", 0], ["<-8%", 0], ["<-9%", 0], [">-9%", 0]]
  for (let d of sData) {
    if (d[6] < 0 && d[6] >= -1) {
      commonChart.series[0].data[0][1] = commonChart.series[0].data[0][1] + 1
    } else if (d[6] < -1 && d[6] >= -2) {
      commonChart.series[0].data[1][1] = commonChart.series[0].data[1][1] + 1
    } else if (d[6] < -2 && d[6] >= -3) {
      commonChart.series[0].data[2][1] = commonChart.series[0].data[2][1] + 1
    } else if (d[6] < -3 && d[6] >= -4) {
      commonChart.series[0].data[3][1] = commonChart.series[0].data[3][1] + 1
    } else if (d[6] < -4 && d[6] >= -5) {
      commonChart.series[0].data[4][1] = commonChart.series[0].data[4][1] + 1
    } else if (d[6] < -5 && d[6] >= -6) {
      commonChart.series[0].data[5][1] = commonChart.series[0].data[5][1] + 1
    } else if (d[6] < -6 && d[6] >= -7) {
      commonChart.series[0].data[6][1] = commonChart.series[0].data[6][1] + 1
    } else if (d[6] < -7 && d[6] >= -8) {
      commonChart.series[0].data[7][1] = commonChart.series[0].data[7][1] + 1
    } else if (d[6] < -8 && d[6] >= -9) {
      commonChart.series[0].data[8][1] = commonChart.series[0].data[8][1] + 1
    } else if (d[6] < -9) {
      commonChart.series[0].data[9][1] = commonChart.series[0].data[9][1] + 1
    }
  }
  let ldata = []
  for (let i = 0; i < 10; i++) {
    if (commonChart.series[0].data[i][1] != 0) {
      ldata.push(commonChart.series[0].data[i])
    }
  }
  commonChart.series[0].data = ldata
  if ($$('scriptWindowDataTableId').config.lossDaysChart) {
    $$('scriptWindowDataTableId').config.lossDaysChart.destroy()
  }

  commonChart.plotOptions.pie.colors = ['#FFA07A', '#FA8072', '#CD5C5C', '#DC143C', '#FF4500', '#E9967A', '#CD5C5C', '#FF6347', '#FF0000', '#8B0000',]
  $$('scriptWindowDataTableId').config.lossDaysChart = new Highcharts.Chart(commonChart);
}
function prepareCashAndCarryData() {
  let buyCash = []
  let sellCash = []
  CashAndCarry.forEach(a => {
    let obj = {
      company: a[0],
      future: a[1],
      spot: a[2],
      basis: a[3],
      basisPer: a[4],
      preBasis: a[5],
      change: a[6],
      lotSize: a[7],
    }
    if (parseFloat(a[2].replaceAll(',', '')) < parseFloat(a[1].replaceAll(',', ''))) {
      buyCash.push(obj)
    } else {
      sellCash.push(obj)
    }

  })
  return [buyCash, sellCash]
}

//let spArr = ["16000.00"]//, "16100.00"]
let spArr = ["10000.00", "10500.00", "10900.00",
  "11000.00", "11100.00", "11200.00", "11300.00", "11400.00", "11500.00", "11600.00", "11700.00", "11800.00", "11900.00",
  "12000.00", "12100.00", "12200.00", "12300.00", "12500.00", "12600.00", "12700.00", "12800.00", "12900.00",
  "13000.00", "13100.00", "13200.00", "13300.00", "13400.00", "13500.00", "13800.00", "13850.00", "13900.00", "13950.00",

  "14000.00", "14050.00", "14100.00", "14150.00", "14200.00", "14250.00", "14300.00", "14350.00", "14400.00", "14450.00",
  "14500.00", "14550.00", "14600.00", "14650.00", "14700.00", "14750.00", "14800.00", "14850.00", "14900.00", "14950.00",

  "15000.00", "15050.00", "15100.00", "15150.00", "15200.00", "15250.00", "15300.00", "15350.00", "15400.00", "15450.00",
  "15500.00", "15550.00", "15600.00", "15650.00", "15700.00", "15750.00", "15800.00", "15850.00", "15900.00", "15950.00",

  "16000.00", "16050.00", "16100.00", "16150.00", "16200.00", "16250.00", "16300.00", "16350.00", "16400.00",
  "16450.00", "16500.00", "16550.00", "16600.00", "16650.00", "16700.00", "16750.00", "16800.00", "16850.00", "16900.00", "16950.00",

  "17000.00", "17050.00", "17100.00", "17150.00", "17200.00", "17250.00", "17300.00", "17350.00", "17400.00", "17450.00",
  "17500.00", "17550.00", "17600.00", "17650.00", "17700.00", "17750.00", "17800.00", "17850.00", "17900.00", "17950.00",

  "18000.00", "18050.00", "18100.00", "18150.00", "18200.00", "18250.00", "18300.00", "18350.00", "18400.00", "18450.00",
  "18500.00", "18550.00", "18600.00", "18650.00", "18700.00", "18750.00", "18800.00", "18850.00", "18900.00", "18950.00",

  "19000.00", "19050.00", "19100.00", "19150.00", "19200.00", "19250.00", "19300.00", "19350.00", "19400.00", "19450.00", "19500.00", "19550.00",
  "19600.00", "19650.00", "19700.00", "19750.00", "19800.00", "19850.00", "19900.00", "19950.00",

  "20000.00"]


function generateExpiryDates() {
  let expiryDates = []
  let from = new Date('01-Jan-2021')
  from.setMonth(from.getMonth() + 1)
  from.setDate(from.getDate()-1)
  
  let to = new Date()
  to.setMonth(to.getMonth() + 3)
  
  while(from.getTime() < to.getTime()) {
      if(from.toDateString().indexOf('Thu')>-1) {
          //console.dir(from)
          let tempD = new Date(from)
          tempD = tempD.toDateString().split(' ')
          tempD = (tempD[2].length == 1 ? '0' + tempD[2] : tempD[2]) + '-' + tempD[1] + '-' + tempD[3]
      
          expiryDates.push(tempD)
          from.setDate(1)
          from.setMonth(from.getMonth() + 2)
          from.setDate(from.getDate()-1)
      } else {
          from.setDate(from.getDate()-1)    
      }
  }
  return expiryDates
}

function displayOptionAllHistoryData() {
  delete gridOptions['api']
  let edArr = generateExpiryDates().reverse()
  webix.ui({
    view: "window",
    id: "allOptionHistoryWindowId",
    fullscreen: true,
    head: {
      rows: [
        {
          view: "toolbar", cols: [
            {
              view: "combo", width: 210, labelWidth: 85, id: "expiryDateHistoryId",
              label: 'Expiry Date:', placeholder: "Select Date", value:edArr[0],
              options: edArr, on: {
                onChange: function (id) {
                  //console.dir(id)
                }
              }
            },
            {
              view: "combo", width: 210, labelWidth: 85, id: "strikePriceHistoryId", value:'All',
              label: 'Strike Price:', placeholder: "Select Date",
              options: ['All', ...spArr], on: {
                onChange: function (id) {
                  //console.dir(id)
                }
              }
            },
            {
              view: "button", type: "icon", icon: "mdi mdi-download", id: "optionDownloadId",
              width: 37, align: "left",
              click: function () {
                let ed = $$('expiryDateHistoryId').getValue()
                let sp = $$('strikePriceHistoryId').getValue()
                if(ed != '' && sp != '') {
                  if(sp == 'All') {
                    dispatchChangeEvent('#optionAllHistoryReqId', ed + '=' + spArr.join(','))
                  } else {
                    dispatchChangeEvent('#optionAllHistoryReqId', ed + '=' + sp)
                  }
                  allData = undefined
                  niftyObj = undefined
                  nifty = []
                }
              }
            },
            {},
            { view: "button", label: 'X', width: 30, align: 'right', click: "$$('allOptionHistoryWindowId').destructor();" }
          ]
        },
        {
          cols: [
            { view:"text", value:"10", label:"Enter % : "  , width: 150, format:"1.00", id: 'optionAllPercentageId' },
            { view:"text", value:"100", label:"Price : "  , width: 155, format:"1.00", id: 'optionAllPriceId' },
            { view:"button", id:"btn1", label:'Go', width: 50, click:function(id,event){
              calculateOptionAllHistory($$('optionAllPercentageId').getValue(), $$('optionAllPriceId').getValue())
            }
          },
          { view:'template', id: 'optionAllHisTotalId', template: ''},
          {
            view: "button", type: "icon", icon: "mdi mdi-refresh", height: 35, width: 37, align: "center",
            click: function () {
              gridOptions.api.setFilterModel(null);
            }
          },
          ]
        }
      ]
    }
    ,
    body: {
      cols: [
        {
          view: 'template', id: 'optionAllHistoryId', template: '<div class="ag-theme-alpine" style="width:100%;height:100%;" id="optionAllHistoryagGrid"></div>'
        },
        ]
    },
    on: {
      onShow: function () {
      }
    }
  }).show();
}

class ActionRenderer {
  // gets called once before the renderer is used
  init(params) {
    this.eGui = document.createElement('div');
    if(params.data) {
      // create the cell
      
      this.eGui.innerHTML = `<span class="webix_icon_btn mdi mdi-chart-areaspline btn-simple" style="max-width:32px;cursor: pointer"></span>`
      //` <span><button class="btn-simple">Graph</button></span>`;

      // get references to the elements we want
      this.eButton = this.eGui.querySelector('.btn-simple');
      // add event listener to button
      this.eventListener = () => displayOptionStrikeChart(params.data);
      this.eButton.addEventListener('click', this.eventListener);
    }
  }

  getGui() {
    return this.eGui;
  }

  // gets called whenever the cell refreshes
  refresh(params) {
    this.eValue.innerHTML = this.cellValue;
    return true;
  }

  // gets called when the cell is removed from the grid
  destroy() {
    // do cleanup, remove event listener from button
    if (this.eButton) {
      // check that the button element exists as destroy() can be called before getGui()
      this.eButton.removeEventListener('click', this.eventListener);
    }
  }

  getValueToDisplay(params) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}

let gridOptions = {
  // each entry here represents one column
  columnDefs: [
    { headerName:'Year', field: "year" , rowGroup: true, enableRowGroup: true, hide: true},
    { headerName:'Date', field: "sellDate" ,filter: true},
    { headerName:'Price',field: "niftyPrice" ,filter: false, suppressMenu: true},
    { headerName:'NCP',field: "niftyClosePrice" ,filter: true, suppressMenu: true,headerTooltip: 'Nify Close Price'},
    { field: "expiryDate" , filter: true, rowGroup: true, enableRowGroup: true, hide: true},
    { headerName:'Strike Price', field: "strikePrice" , filter: true, rowGroup: true, enableRowGroup: true, hide: true},
    { headerName:'%', field: "percentage", type: 'numericColumn', sortable: true, filter: 'agNumberColumnFilter' },
    { field: "sellPrice" ,filter: false},
    { headerName:'CP', field: "closePrice" , suppressMenu: true,headerTooltip: 'Option Close Price'},
    { headerName:'👍' + '/' +  '🔻', field: "result" ,filter: true},
    { field: "DTE", sortable: true, filter: 'agNumberColumnFilter',headerTooltip: 'Days To Expiry'},
    { headerName:'Chart',field: 'action', minWidth: 100, cellRenderer: ActionRenderer, suppressMenu: true},
  ],

  // default col def properties get applied to all columns
  defaultColDef: { resizable: true, flex: 1, minWidth: 120},
  rowSelection: 'multiple', // allow rows to be selected
  animateRows: true, // have rows animate to new positions when sorted
  rowGroupPanelShow: 'always',
  autoGroupColumnDef: {
    filter: true,
    filterValueGetter: params => params.data.year, 
    minWidth: 200,
    //headerName: 'Group',//custom header name for group
    pinned: 'left',//force pinned left. Does not work in columnDef
    cellRendererParams: {
        suppressCount: false,//remove number in Group Column
    }
  },
  // set background colour on even rows again, this looks bad, should be using CSS classes
  getRowStyle: params => {
    if(!params.data) {
      return null
    } else if (params.node.rowIndex % 2 === 0) {
        //return { background: 'red' };
    }
    return null
  },
  // example event handler
  onCellClicked: params => {
    //console.log('cell was clicked', params)
  },
  onGridReady: (event) => event.api.sizeColumnsToFit(),
  onFilterChanged: function() {
    //console.log('onFilterChanged')
    filterResult()
  },
  onFilterModified: function() {
    //console.log('onFilterModified')
  }
};

let optionAllHistoryCalData = []
async function calculateOptionAllHistory(percentage, price) {
  if(!gridOptions.api) {
    const eGridDiv = document.getElementById("optionAllHistoryagGrid");
    // new grid instance, passing in the hosting DIV and Grid Options
     new agGrid.Grid(eGridDiv, gridOptions);
  }
  
  //gridOptions.api.setRowData([]);
  await (async () => { return new Promise((resolve, reject) => { gridOptions.api.showLoadingOverlay(); setTimeout(()=>{ resolve()}, 250); })})()
  
  optionAllHistoryCalData = await calculateOptionAllHistoryPercent(percentage, price)
  gridOptions.api.setRowData(optionAllHistoryCalData)
  //gridOptions.api.hideOverlay()
  gridOptions.api.setFilterModel(null);
  filterResult()
  autoSizeAll(false)
}
let allData = undefined
let niftyObj = undefined
let nifty = []

function autoSizeAll(skipHeader) {
  const allColumnIds = [];
  gridOptions.columnApi.getColumns().forEach((column) => {
    allColumnIds.push(column.getId());
  });

  gridOptions.columnApi.autoSizeColumns(allColumnIds, skipHeader);
}

async function calculateOptionAllHistoryPercent(percentage, price) {
  if(!niftyObj) {
    let data = JSON.parse(localStorage.getItem('ScriptHistoryData'))
    let sArr = data['NIFTY']
    for(let i=0; i<sArr.length-1; i++) {
        let n = sArr[i]
        let pn = sArr[i+1]
        nifty.push([n[0], n[4], n[4]-pn[4]])
    }
    niftyObj = {}
    nifty.forEach(n => { niftyObj[n[0]] = [n[1], n[2]] })
    nifty.reverse()
  }
  let result = []
  allData = allData || await getAllDataSyncOptionHistoryStore();
  for(let i=0;i<nifty.length;i++) {
      let n = nifty[i];
      let tenPer = n[1] - (n[1] * percentage/100);
      for(let j=0; j<allData.length; j++) {
          let op = allData[j];
          let stArr = Object.keys(op)
          for(let s=0; s<stArr.length; s++) {
              let v = op[stArr[s]]
              let data = v['PE']['data']
              if(stArr[s] <= tenPer && data.length > 0) {
                  for(let d=data.length-1;d>0; d--) {
                      let odata = data[d]
                      if(odata['FH_TIMESTAMP'] == n[0] && odata['FH_CHANGE_IN_OI'] > 10 && odata['FH_LAST_TRADED_PRICE'] >= price) {
                          let fdata = data[0]
                          let edTemp = odata['FH_EXPIRY_DT']
                          let edArrTemp = edTemp.split('-')
                          let edTrim = edArrTemp[0] + '-' + edArrTemp[1] + '-' + edArrTemp[2].substring(2)
                          let d1 = new Date(n[0])
                          let d2 = new Date(edTemp)

                          let sdArrTemp = n[0].split('-')

                          niftyObj[edTemp] && result.push({
                              monthYear: edTemp.substring(3),
                              year: edTemp.substring(7),
                              sellDate: sdArrTemp[0] + '-' + sdArrTemp[1] + '-' + sdArrTemp[2].substring(2),
                              niftyPrice: n[1],
                              expiryDate: edTrim,
                              expiryDateOrg: edTemp,
                              strikePrice: parseFloat(parseFloat(odata['FH_STRIKE_PRICE']).toFixed(2)),
                              sellPrice: parseFloat(parseFloat(odata['FH_LAST_TRADED_PRICE']).toFixed(2)),
                              closePrice:  parseFloat(parseFloat(fdata['FH_LAST_TRADED_PRICE']).toFixed(2)),
                              result: (odata['FH_LAST_TRADED_PRICE'] - fdata['FH_LAST_TRADED_PRICE']) > 0 ? '👍' : '🔻' ,
                              niftyClosePrice: niftyObj[edTemp][0],
                              percentage: -1 * parseFloat(parseFloat((n[1] - stArr[s]) / stArr[s] * 100).toFixed(2)) ,
                              lowPrice: odata['FH_TRADE_LOW_PRICE'],
                              DTE: (d2.getTime()-d1.getTime())/(24*60*60*1000)
                          })
                          break;
                      }
                  }
              }
          }
      }
  }
  console.table(result, ['sellDate', 'niftyPrice', 'niftyClosePrice', 'expiryDate', 'strikePrice', 'percentage', 'sellPrice', 'closePrice', 'result'])
  return result
}

function filterResult() {
  let win = 0
  let loss = 0
  optionAllHistoryCalData.forEach(v => {
    if(v['result'] === '👍') {
      win++
    } else {
      loss++
    }
  })
  let h = 'Total Rows ' + optionAllHistoryCalData.length + ' : (' + win + ' 👍' + ' / ' + loss + ' 🔻)'
  let displayCount = gridOptions.api.getDisplayedRowCount()
  if(gridOptions.api.getDisplayedRowAtIndex(0) && gridOptions.api.getDisplayedRowAtIndex(0)['data'] === undefined) {
    let d = []
    for(let i=0;i<displayCount;i++) {
      if(gridOptions.api.getDisplayedRowAtIndex(i)['data']) {
        d.push(gridOptions.api.getDisplayedRowAtIndex(i)['data'])
      } else if(gridOptions.api.getDisplayedRowAtIndex(i)['childrenAfterFilter']) {
        let leafChildren1 = gridOptions.api.getDisplayedRowAtIndex(i)['childrenAfterFilter']
        for(let j=0;j<leafChildren1.length;j++) {
          if(leafChildren1[j]['childrenAfterFilter']) {
            let leafChildren2 = leafChildren1[j]['childrenAfterFilter']
            for(let k=0;k<leafChildren2.length;k++){
              if(leafChildren2[k]['childrenAfterFilter']) {
                let leafChildren3 = leafChildren2[k]['childrenAfterFilter']
                for(let l=0;l<leafChildren3.length;l++){
                  if(leafChildren3[l]['data']) {
                    d.push(leafChildren3[l]['data'])
                  }
                }
              } else if(leafChildren2[k]['data']) {
                d.push(leafChildren2[k]['data'])
              }
            }
          } else if(leafChildren1[j]['data']) {
            d.push(leafChildren1[j]['data'])
          }
        }
      }
    }
    let win = 0
    let loss = 0
    d.forEach(v => {
      if(v['result'] === '👍') {
        win++
      } else {
        loss++
      }
    })
    if(optionAllHistoryCalData.length != d.length) {
      h += ' , Filter Rows: ' + d.length + ' : (' + win + ' 👍' + ' / ' + loss + ' 🔻)'
    }
    $$('optionAllHisTotalId').setHTML(h)
  } else {
    $$('optionAllHisTotalId').setHTML(h)
  }
}

function displayOptionStrikeChart(cData) {
  //console.dir(cData)
  let sp = cData['strikePrice'] + '.00'
  let ed = cData['expiryDateOrg']
  let data = []
  for(let i=0;i<allData.length;i++){
    let obj = allData[i]
    let spData = obj[sp]['PE']
    if(spData) {
      let meta = spData['meta']
      if(meta['expiryDate'] == ed) {
        data = [...spData['data']].reverse()
        break
      }
    }
  }
  let chartData = []
  for(let i=0;i<data.length;i++) {
    if(data[i]['FH_CHANGE_IN_OI'] > 10 || data[i]['FH_CHANGE_IN_OI'] < 0) {
      chartData.push({ 
        price: parseFloat(parseFloat(data[i]['FH_LAST_TRADED_PRICE']).toFixed(2)),
        date: data[i]['FH_TIMESTAMP'].substring(0, 6),
        nifty: niftyObj[data[i]['FH_TIMESTAMP']][1]
      })
    }
  }

  let title = 'Expiry Date:' + ed + ' , Strike Price: ' + sp

  webix.ui({
    view: "window",
    id: "optionChartId",
    fullscreen: true,
    head: {
      rows: [
        {
          view: "toolbar", cols: [
            {
              view: "label", label: '', align: 'center', template: "<a target='_blank' href='https://nseindia.com/companytracker/cmtracker.jsp?symbol="
                + '' + "&cName=cmtracker_nsedef.css'>  </a>"
            },
            { view: "button", label: 'X', width: 30, align: 'right', click: "$$('optionChartId').destructor();" }
          ]
        }
      ]
    }
    ,
    body: {
      cols: [
        {
          view: 'template', id: 'optionChartBodyId', template: '<div class="ag-theme-alpine" style="width:100%;height:100%;" id="optionChartBodyDivId"></div>'
        },
        ]
    },
    on: {
      onShow: function () {
        displayOptionChart(chartData, title)
      }
    }
  }).show();
}

function displayOptionChart(data, title) {
  const options = {
    container: document.getElementById('optionChartBodyDivId'),
    autoSize: true,
    title: {
      text: title,
    },
    data: data,
    series: [
      {
        xKey: 'date',
        yKey: 'price',
        yName: 'Premium',
        label: {
          //fontWeight: 'bold',
          color: 'white'
        },
      },
      {
        xKey: 'date',
        yKey: 'nifty',
        yName: 'Nifty',
        label: {
          //fontWeight: 'bold',
          //color: 'white'
        },
      },
    ],
    theme: {
      baseTheme: 'ag-default-dark'
    }
  };

  agCharts.AgChart.create(options);
}

async function OptionAllHistoryAnalytics() {
  if(!niftyObj) {
    let data = JSON.parse(localStorage.getItem('ScriptHistoryData'))
    let sArr = data['NIFTY'].reverse()
    
    for(let i=0; i<sArr.length; i++) {
        let n = sArr[i]
        nifty.push([n[0], n[4]])
    }
    niftyObj = {}
    nifty.forEach(n => { niftyObj[n[0]] = n[1] })
  }
  let result = []
  allData = allData || await getAllDataSyncOptionHistoryStore();
  for(let i=0;i<nifty.length;i++) {
      let n = nifty[i]
      for(let j=0; j<allData.length; j++) {
          let op = allData[j];
          let stArr = Object.keys(op)
          for(let s=0; s<stArr.length; s++) {
            //Temporary code begin
            if(stArr[s] !== '17500.00') {
              continue;
            }
            if(op[stArr[s]]['meta']['expiryDate'] != '27-Jan-2022') {
              continue;
            }
            // end
              let v = op[stArr[s]]
              let data = v['data']
              if(data.length > 0) {
                  for(let d=data.length-1;d>0; d--) {
                      let odata = data[d]
                      if(odata['FH_TIMESTAMP'] == n[0]) {// && odata['FH_CHANGE_IN_OI'] > 10 && odata['FH_LAST_TRADED_PRICE'] >= 10) {
                          let fdata = data[0]
                          let d1 = new Date(n[0])
                          let d2 = new Date(odata['FH_EXPIRY_DT'])
                          niftyObj[odata['FH_EXPIRY_DT']] && result.push({
                              monthYear: odata['FH_EXPIRY_DT'].substring(3),
                              year: odata['FH_EXPIRY_DT'].substring(7),
                              sellDate: n[0],
                              niftyPrice: n[1],
                              expiryDate: odata['FH_EXPIRY_DT'],
                              strikePrice: parseFloat(parseFloat(odata['FH_STRIKE_PRICE']).toFixed(2)),
                              sellPrice: parseFloat(parseFloat(odata['FH_LAST_TRADED_PRICE']).toFixed(2)),
                              closePrice:  parseFloat(parseFloat(fdata['FH_LAST_TRADED_PRICE']).toFixed(2)),
                              result: (odata['FH_LAST_TRADED_PRICE'] - fdata['FH_LAST_TRADED_PRICE']) > 0 ? '👍' : '🔻' ,
                              niftyClosePrice: niftyObj[odata['FH_EXPIRY_DT']],
                              percentage: -1 * parseFloat(parseFloat((n[1] - stArr[s]) / stArr[s] * 100).toFixed(2)) ,
                              lowPrice: odata['FH_TRADE_LOW_PRICE'],
                              dte: (d2.getTime()-d1.getTime())/(24*60*60*1000)
                          })
                          break;
                      }
                  }
              }
          }
      }
  }
  console.table(result, ['sellDate', 'niftyPrice', 'niftyClosePrice', 'expiryDate', 'strikePrice', 'percentage', 'sellPrice', 'closePrice', 'dte', 'result'])
  return result
}