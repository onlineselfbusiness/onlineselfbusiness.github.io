
let globalConfig = {
  'default': { lotSize: 1, lowerPer: 4, higherPer: 4, creditAmt: 3, skipDiffPer: 1.45, lowerLimitPer: 5, upperLimitPer: 5, outerLimitPer: 7, ironConderRange: 10 },
  'BANKNIFTY': { lotSize: 25, lowerPer: 6, higherPer: 6, creditAmt: 40, skipDiffPer: 1.45, lowerLimitPer: 12, upperLimitPer: 12, outerLimitPer: 4, ironConderRange: 500 },
  'NIFTY': { lotSize: 50, lowerPer: 4, higherPer: 4, creditAmt: 20, skipDiffPer: 1.45, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 2, ironConderRange: 300 },
}
let loader = '<div class="loader-wrp"><div class="spin-loader" aria-hidden="true"></div></div>'
let emptyRow = '<tr><td colspan="23" class="text-center emptyRow">No Record Found</td></tr>'
let selectScriptRow = '<tr><td colspan="23" class="text-center emptyRow">Please select script and click on download</td></tr>'
// [Strike Price, Bid Price, Ask Price, Volumn, OI]
let PE_OTM = []
let PE_ITM = []
let CE_OTM = []
let CE_ITM = []
let Underlying_Value = 0
let SelectedScript = ''
let SelectedExpiryDate = ''
let CalenderUI = {}
let WatchObj = undefined
function fetchScriptConfig() {
  return globalConfig[SelectedScript] || globalConfig['default']
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

let OptionChainData = webix.storage.local.get('OptionChainData')
if (!OptionChainData) {
  OptionChainData = {}
  webix.storage.local.put('OptionChainData', OptionChainData)
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
    { view: "text", align: "center", width: 70, inputAlign: "center", value: 1, 
      on: {
        onBlur: function() {
        let v = this.getValue().trim()
        if(v == '' || isNaN(v) || v < 1 ) {
          this.setValue(1)
        } else {
          this.setValue(v)
        }
      }
    }},
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
    },{ view: "label", label: '', align: "center" },]
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
      view: 'datatable', id: 'payoffTableId', headerRowHeight: 120, autowidth: true, hover:"myhover",css: "rows",
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
let twoMinutes = 2 * 60 * 1000 + 15 * 1000

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

  let sData = OptionChainData[SelectedScript]
  Underlying_Value = parseInt(sData.underlyingValue)
  let ocArr = sData.data[SelectedExpiryDate]
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

            upPer: parseFloat((uppderBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
            downPer: parseFloat((lowerBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
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
      view: "toolbar", id:'strategyWinToolbarId', cols: [
        { width: 4 },
        { view: "label", label: "Short Gamma Spread: "+ SelectedScript + '  [' + SelectedExpiryDate + ']' },
        { view: "label", id: 'spotPriceId', label: SelectedScript + " Spot Price (SP): " + Underlying_Value },
        { view: "button", label: 'X', width: 50, align: 'right', click: function () { $$('strategyWinId').close(); } }
      ]
    },
    body: {
      view: "datatable",
      id: "strategyDatatableId",
      hover:"myhover",css: "rows",
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
        { id:"downPer",	header:["<-- %", { content: "numberFilter" }] , width:100,	sort:"int"},
        { id:"upPer",	header:["--> %", { content: "numberFilter" }] , width:100,	sort:"int"},
        { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>", fillspace:true },

      ],
      select: "row",
      data: d,
      onClick: {
        details_button: function (ev, id) {

          let obj = this.data.pull[id.row]
          let sellPutSt = obj.sellPutSt
          let sellPutPre = obj.sellPutPre
          let buyPutSt = obj.buyPutSt
          let buyPutPre = obj.buyPutPre

          let sellCallSt = obj.sellCallSt
          let sellCallPre = obj.sellCallPre
          let buyCallSt = obj.buyCallSt
          let buyCallPre = obj.buyCallPre
          let premiumRec = obj.premiumRec

          WatchObj = {
            key: SelectedScript+","+SelectedExpiryDate+","+sellPutSt+","+buyPutSt+","+sellCallSt+","+buyCallSt,
            name: 'Short Gamma',
            script: SelectedScript,
            expiryDate: SelectedExpiryDate,
            lotSize: fetchScriptConfig().lotSize,
            createDate: new Date,
            pol:0,
            sellPut: [{strikePrice: sellPutSt, lots: 2, entryPremium: sellPutPre, entryIV: 12, latestPremium: sellPutPre, latestIV: 12, pl: 0}],
            sellCall: [{strikePrice: sellCallSt, lots: 2, entryPremium: sellCallPre, entryIV: 12, latestPremium: sellCallPre, latestIV: 12, pl: 0}],

            buyPut: [{strikePrice: buyPutSt, lots: 1, entryPremium: buyPutPre, entryIV: 12, latestPremium: buyPutPre, latestIV: 12, pl: 0}],
            buyCall: [{strikePrice: buyCallSt, lots: 1, entryPremium: buyCallPre, entryIV: 12, latestPremium: buyCallPre, latestIV: 12, pl: 0}],
          }
          webix.ui({
            view: "window",
            width: window.innerWidth - 2,
            height: window.innerHeight - 2,
            position: 'center',
            id: 'chartWinId',
            head: {
              view: "toolbar", id: 'strategyChartToolbarId', cols: [
                { width: 4 },
                { view: "label", label: "Short Gamma Spread : " + SelectedScript + '  [' + SelectedExpiryDate + ']'},
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
                { id: 'inputInfoId', height: 70, cols: [
                  {
                    rows: [
                      {view:'template', template: '<div style="text-align: center;"><b>PUT</b></div>'},
                      {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Sell 2</b> Lots ' + SelectedScript + ' <b>' + sellPutSt + '</b>PE @ ₹<b>'+ sellPutPre + '</b></div>'},
                      {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Buy 1</b> Lot ' + SelectedScript + ' <b>' + buyPutSt + '</b>PE @ ₹<b>'+ buyPutPre + '</b></div>'},
                    ]
                  },
                  {
                    rows: [
                      {view:'template', template: '<div style="text-align: center;"><b>CALL</b></div>'},
                      {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Sell 2</b> Lots ' + SelectedScript + ' <b>' + sellCallSt + '</b>CE @ ₹<b>'+ sellCallPre + '</b></div>'},
                      {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Buy 1</b> Lot ' + SelectedScript + ' <b>' + buyCallSt + '</b>CE @ ₹<b>'+ buyCallPre + '</b></div>'},
                    ]
                  },
                  {
                    rows: [
                      {view:'template', template: ''},
                      {view: 'template', borderless:true, template: '<div style="text-align: center;">Premium Received: ₹<b>'+premiumRec+'</b></div>'},
                      {view:'button', label: 'Watch It', click: function() {

                        let r = WatchList.filter(obj => obj.key == WatchObj.key)
                        if(r.length == 0) {
                          WatchList.push(WatchObj)
                          webix.storage.local.put('WatchList', WatchList)
                          webix.message({text: 'Added the strategy to watch list :)', type:"success", expire: 500})
                        } else {
                          webix.message({text: 'Sorry, Could not add same combination', type:"error", expire: 500})
                        }
                      }},
                    ]
                  },
                ]},
                {view: 'template', template: '<div id="strategyChartId" style="width: 100%;height: 100%;background-color: aliceblue;"></div>'},
              ]
            }
          }).show();
          displayStrategyChart(this.data.pull[id.row].data, Underlying_Value)
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
  let totalIndex = 0
  if(data.length>0) {
    totalIndex = Object.keys(data[0]).length - 1
  }
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i][totalIndex] > 0) {
      lowerBound = data[i][0]
      lowerBoundPer = parseFloat((lowerBound - underlyingVal) / underlyingVal * 100).toFixed(2) + '% ' + (lowerBound - underlyingVal)
      break
    }
  }
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][totalIndex] > 0) {
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
function initEventListeners() {
  let optionChainResId = document.querySelector('#optionChainResId')
  optionChainResId.addEventListener('change', (e) => {
    let tempData = webix.storage.session.get('tempData')
    if(SelectedExpiryDate == '') {
      let expiryDates = Object.keys(tempData.data).sort((a,b) => {if(new Date(a) > new Date(b)) {return 1} else {return -1}})
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
    $$('optionChainTemplateId').setValues({data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp})

  })

  let optionHistoryResId = document.querySelector('#optionHistoryResId')
  optionHistoryResId.addEventListener('change', (e) => {
    let optionHistory = webix.storage.session.get('optionHistory')
    let input = webix.storage.session.get('optionHistoryInput')
    let d = []
    
    let t = optionHistory.data
    for(let i=0; i<t.length-1; i++) {
      let per = parseFloat((t[i]['FH_SETTLE_PRICE'] - t[i+1]['FH_SETTLE_PRICE']) / t[i+1]['FH_SETTLE_PRICE'] * 100).toFixed(2)
      d.push({'dateId': t[i]['FH_TIMESTAMP'], 'priceId': t[i]['FH_SETTLE_PRICE'], 'perId': per + '%', changeId: parseFloat((t[i]['FH_SETTLE_PRICE'] - t[i+1]['FH_SETTLE_PRICE'])).toFixed(2)})
    }
    webix.ui({
      view:"window",
      height:450,
      width:400,
      move: true,
      modal: true,
      id: 'optionHisWinId',
      head:{ view:"toolbar", id:'strategyWinToolbarId',cols:[
        { width:4 },
        { view:"label", label: "Type: " + input.optionType + ", " + input.strikePrice + ", " + input.expiryDate + ", " + input.symbol },
        { view:"button", label: 'X', width: 50, align: 'left', click:function(){ $$('optionHisWinId').close(); }}
      ]
      },
      position:"center",
      body:{
        view:"datatable", hover:"myhover",css: "rows",
        columns:[{id: 'dateId', header: 'Date'},{id:'priceId', header: 'Price'},
        {id:'changeId', header: 'Change'}, {id: 'perId', header: '%', fillspace:true}],
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
  
  let maxPainStocksResId = document.querySelector('#maxPainStocksResId')
  maxPainStocksResId.addEventListener('change', (e) => {
    MaxPainList = webix.storage.local.get('MaxPainList')
    $$('maxPainForAllDatatableId').clearAll()
    $$('maxPainForAllDatatableId').parse(MaxPainList)
  })

  let nifty50StocksResId = document.querySelector('#nifty50StocksResId')
  nifty50StocksResId.addEventListener('change', (e) => {
    let Nifty50Stocks = webix.storage.session.get('Nifty50Stocks')
    $$('nifty50StockDatatableId').clearAll()
    $$('nifty50StockDatatableId').parse(Nifty50Stocks)
  })

  let messageStatusId = document.querySelector('#messageStatusId')
  messageStatusId.addEventListener('change', (e) => {
    webix.message({ text: e.target.value, type:"info", expire: 500})
  })
}
let ViewIds = ['strategyViewId', 'worldMarketViewId', 'calendarWiseViewId', 'optionChainViewId', 'etResultCalendarViewId', 
            'continuousWiseViewId', 'yearWiseViewId', 'watchListViewId', 'maxPainForAllViewId', 'nifty50StockViewId']
webix.ready(function () {
  initEventListeners()
  var menu_strategies = []
  menu_strategies.push({ id: 'customStrategy', value: 'Custom Strategy' })
  var sArr = Object.keys(strategiesObj)
  for (var i = 0; i < sArr.length; i++) {
    menu_strategies.push({ id: sArr[i], value: strategiesObj[sArr[i]].label })
  }

  var menu_data_multi = []
  menu_data_multi.push({ id: 'optionChain', value: 'Optin Chain'})
  menu_data_multi.push({ id: 'nifty50Stocks', value: 'Nifty 50 Stocks'})
  menu_data_multi.push({ id: 'maxPainStocks', value: 'Max Pain For Stocks'})
  menu_data_multi.push({ id: 'worldMarket', value: 'World Market'})
  menu_data_multi.push({ id: 'etResultCalendar', value: 'Result Calendar'})
  menu_data_multi.push({ id: 'watchList', value: 'Strategy Watch List'})
  menu_data_multi.push({ id: 'analytics', value: 'Script Analytics', data: [
    {id:'calendarWise', value: 'Calendar Wise'},
    { id: 'continuousWiseId', value: 'Continuous Wise'},
    { id: 'yearWiseId', value: 'Year Wise'},
  ]})
  menu_data_multi.push({ id: 'externalLinks', value: 'External Links', data: [
    {id:'liveTV', value: 'Live TV'},
    {id:'indianMarket', value:'Indian Market'},
    {id:'resultCalendar', value:'Result Calendar'},
    {id:'trendlyne', value:'Trendlyne'},
    {id:'niftyMaxPain', value:'Nifty Max Pain'},
    {id:'niftyTaDesk', value:'Nifty TA Desk'},
    {id:'tradingView', value:'Trading View'},{id:'icharts', value:'i Charts'},
    
  ]})

  menu_data_multi.push({ id: 'usefulWebsites', value: 'Useful Websites', data: [
    {id:'opstraId', value: 'Opstra Options Analysis'},{id:'neostoxId', value: 'Neostox'},
    {id:'pasiId', value: 'Pasi Technologies'},{id:'eqsisId', value:'Eqsis'},{id:'niftyIndicesId', value:'Nifty Indices'},
  ]})
  
  menu_data_multi.push({ id: 'strategies', value: 'Option Strategies', data: menu_strategies })
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
                if(id === 'optionChain') {showViewId('optionChainViewId')}
                 else if(id == 'worldMarket') {
                  showViewId('worldMarketViewId')
                  dispatchChangeEvent('#worldMarketId')
                } else if(id === 'liveTV') {window.open('https://www.cnbctv18.com/live-tv/')}
                else if(id === 'indianMarket') {window.open('https://content.indiainfoline.com/_media/iifl/img/research_reports/pdf/morning-note.pdf')}
                else if(id === 'resultCalendar') {window.open('https://www.moneycontrol.com/markets/earnings/results-calendar/')}
                else if(id === 'trendlyne') {window.open('https://trendlyne.com/my-trendlyne/recommended/')}
                else if(id === 'calendarWise') { showViewId('calendarWiseViewId')}
                else if(id == 'niftyMaxPain') {window.open('https://www.niftytrader.in/options-max-pain-chart-live/nifty')}
                else if(id == 'niftyTaDesk') {window.open('https://stockezee.com/nifty-ta-desk')}
                else if(id == 'opstraId') { window.open('https://opstra.definedge.com/')}
                else if(id == 'neostoxId') {window.open('https://neostox.com/')}
                else if(id == 'pasiId') {window.open('http://www.pasitechnologies.com/')}
                else if(id == 'eqsisId') {window.open('https://www.eqsis.com/nse-max-pain-analysis/')}
                else if(id == 'niftyIndicesId') {window.open('https://www.niftyindices.com/market-data/live-index-watch')}
                else if(id == 'etResultCalendar') {showViewId('etResultCalendarViewId')}
                else if(id == 'maxPainStocks') {
                  showViewId('maxPainForAllViewId')
                  dispatchChangeEvent('#maxPainStocksReqId')
              }
                else if(id == 'nifty50Stocks') {
                  showViewId('nifty50StockViewId')
                  dispatchChangeEvent('#nifty50StocksReqId')
                }
                else if(id == 'watchList') {
                  showViewId('watchListViewId')
                  watchListCal()
                  $$('watchListDatatableId').clearAll()
                  $$('watchListDatatableId').parse(WatchList)
                }
                else if(id == 'tradingView') {window.open('https://www.tradingview.com/chart/uFSqmfFr/')}
                else if(id == 'icharts') {window.open('https://www.icharts.in/screener-eod.html')}
                else if(id == 'continuousWiseId') {
                  showViewId('continuousWiseViewId')
                  continuousWiseAllCal()
                  displayContinuousData()
              } else if(id == 'yearWiseId') {
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
                      view: "toolbar", padding: 3, id:'optionChainToolbarId', elements: [
                        { view: "label", label: "Option Chain" },
                        {
                          view:"combo", width:200, labelWidth:50, id:"scriptId",
                          label: 'Script:',  placeholder:"Please Select",
                          options:['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()],
                          on:{
                            onChange: function(id){
                              SelectedScript = id
                              if(id == '') {
                                $$('algoStrategyId').setValue('')
                                $$('underlyingVal').setHTML('')
                                $$('expiryDateId').define('options', [])
                                $$('expiryDateId').setValue('')
                                SelectedExpiryDate = ''
                              } else {
                                let sData = OptionChainData[SelectedScript]
                                if(!sData) {
                                  $$('expiryDateId').define('options', [])
                                  $$('expiryDateId').setValue('')
                                  SelectedExpiryDate = ''
                                }
                                if(SelectedScript && sData) {
                                  let sData = OptionChainData[SelectedScript]
                                  Underlying_Value = sData.underlyingValue

                                  let expiryDates = Object.keys(sData.data).sort((a,b) => {if(new Date(a) > new Date(b)) {return 1} else {return -1}})
                                  $$('expiryDateId').define('options', expiryDates)
                                  
                                  if(sData.SelectedExpiryDate){
                                    SelectedExpiryDate = sData.SelectedExpiryDate
                                  } else {
                                    SelectedExpiryDate = expiryDates[0].id
                                  }
                                  
                                  $$('expiryDateId').setValue(SelectedExpiryDate)
                                  $$('optionChainTemplateId').setValues({data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp})
                                } else {
                                  $$('expiryDateId').define('options', [])
                                  webix.delay(()=>document.getElementById("indices-body").innerHTML = selectScriptRow)
                                }
                              }
                            }
                          }
                        },
                        {
                          view:"combo", width:210, labelWidth:85, id:"expiryDateId",
                          label: 'Expiry Date:',  placeholder:"Please Select",
                          options:[],on:{
                            onChange: function(id){
                              //console.dir(id)
                              if(id != '') {
                                if(SelectedExpiryDate != id) {
                                  SelectedExpiryDate = id
                                  let sData = OptionChainData[SelectedScript]
                                  Underlying_Value = sData.underlyingValue
                                  sData.SelectedExpiryDate = SelectedExpiryDate
                                  $$('optionChainTemplateId').setValues({data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp})
                                }
                              }
                            }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download", id:"scriptDownloadId",
                          width: 37, align: "left",
                          click: function () {
                            $$("sidebarId").hide();
                            let s = $$('scriptId').getValue();
                            if(s == "") {
                              webix.message({ text: "Please select script :-)", type:"info "})
                            } else {
                              let sData = OptionChainData[SelectedScript]
                              if(sData) {
                                let d = new Date(sData.fetchTime)
                                let now = new Date()
                                if(now.getTime() > (d.getTime() + twoMinutes)) {
                                  let e = new Event("change")
                                  let element = document.querySelector('#optionChainReqId')
                                  element.value = s
                                  element.dispatchEvent(e)
                                } else {
                                  Underlying_Value = sData.underlyingValue
                                  $$('optionChainTemplateId').setValues({data: sData.data[SelectedExpiryDate], timestamp: sData.timestamp})
                                }
                              } else {
                                let e = new Event("change")
                                let element = document.querySelector('#optionChainReqId')
                                element.value = s
                                element.dispatchEvent(e)
                              }
                            }
                          }
                        },
                        {
                          view:"combo", width:250, labelWidth:100, id:'algoStrategyId',
                          label: 'Algo Strategy:', placeholder:"Please Select", popupWidth: 600,
                          options:[
                            { id:1, value:"Short Gamma Spread" },
                            { id:2, value:"Short Strangle" }, 
                            { id:3, value:"Iron Condor Spread" }
                          ]
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-google-analytics",
                          width: 37, align: "left",
                          click: function () {
                            $$("sidebarId").hide();
                            let s = $$('scriptId').getValue();
                            if(s == "") {
                              webix.message({ text: "Please select script :-)", type:"info "})
                            } else {
                              let algoSel = $$('algoStrategyId').getValue()
                              if(algoSel == '') {
                                webix.message({ text: "Please select also strategy :-)", type:"info "})
                              } else {
                                switch(algoSel) {
                                  case '1': 
                                    $$('mainWinId').showProgress();
                                    webix.delay(() => { displayShortGamma(); $$('mainWinId').hideProgress()})
                                    break
                                  case '2':
                                    $$('mainWinId').showProgress();
                                    webix.delay(() => { displayShortStrangle(); $$('mainWinId').hideProgress()})
                                    break
                                    case '3':
                                      $$('mainWinId').showProgress();
                                      webix.delay(() => { displayIronConderStrangle(); $$('mainWinId').hideProgress()})
                                      break
                                }
                              }
                            }
                          }
                        },
                        {},
                        {view:'template', width:200, template: '', id:'underlyingVal', borderless:true},
                        {view: "button", type: "icon", width:35, id:'upArrowId', icon: "mdi mdi-arrow-up", click: function() {
                          $$('downArrowId').show()
                          $$('mainToolbarId').hide()
                          $$('upArrowId').hide()
                        }},
                        {view: "button", type: "icon", width:35, id:'downArrowId', icon: "mdi mdi-arrow-down", hidden:true, click: function() {
                          $$('upArrowId').show()
                          $$('mainToolbarId').show()
                          $$('downArrowId').hide()
                        }},
                      ]
                    },
                    { view: 'template', id: 'optionChainTemplateId', template: function(obj) {
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
                          <th width="6.34%">Strike Price<span> </span></th><th width="4.34%" title="Best Bid/Buy Qty">Bid Qty<span> </span></th>
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
                        if(Object.keys(obj).length > 0) {
                          prepareStrikeWithPremium()
                          let [S1, S2, R1, R2] = findSupportResistence()
                          let arr = obj.data

                          let fivePerLower = Underlying_Value - (Underlying_Value * 5 /100)
                          let fivePerHigher = Underlying_Value + (Underlying_Value * 5 /100)

                          let sData = OptionChainData[SelectedScript]
                          let ocArr = sData.data[SelectedExpiryDate]
                          let allOcs = []
                          for (let i = 0; i < ocArr.length; i++) {
                            allOcs.push(Object.keys(ocArr[i])[0])
                          }
                          let closest = allOcs.reduce(function (prev, curr) {
                              return Math.abs(curr - Underlying_Value) < Math.abs(prev - Underlying_Value) ? curr : prev;
                          })

                          for(let i=0; i<arr.length; i++) {
                            let row = arr[i]
                            let st = Object.keys(row)[0]
                            let ce = row[st]['CE'] || {}
                            let pe = row[st]['PE'] || {}
                            let ceClass = st<=closest ? 'bg-yellow' : ''
                            let peClass = st>closest ? 'bg-yellow' : ''
                            let stRow = `<td width="6.34%"><a class="bold" href="javascript:;">${DecimalFixed(st)}</a></td>`
                            if(parseInt(st) > fivePerLower && parseInt(st) < fivePerHigher) {
                              stRow = `<td width="6.34%" style="background-color: #c1e7f1"><a class="bold" href="javascript:;">${DecimalFixed(st)}</a></td>`
                            }
                            let ceChangeTx = ' redTxt'
                            if(ce.change > 0) {
                              ceChangeTx = ' greenTxt'
                            }
                            let peChangeTx = ' redTxt'
                            if(pe.change > 0) {
                              peChangeTx = ' greenTxt'
                            }

                            let ceHis = `<span onclick="fetchOptionHistory('CE', '${DecimalFixed(st).replaceAll(',', '')}', '${SelectedExpiryDate}', '${SelectedScript}')" class="webix_icon_btn mdi mdi-history" style="color: #2f79e0;"></span>`
                            let peHis = `<span onclick="fetchOptionHistory('PE', '${DecimalFixed(st).replaceAll(',', '')}', '${SelectedExpiryDate}', '${SelectedScript}')" class="webix_icon_btn mdi mdi-history" style="color: #2f79e0;"></span>`

                            let ceOI1 = ''
                            if(DecimalFixed(st).replaceAll(',', '') == R1) {
                              ceOI1 = 'green1'
                            }
                            let ceOI2 = ''
                            if(DecimalFixed(st).replaceAll(',', '') == R2) {
                              ceOI2 = 'green2'
                            }

                            let peOI1 = ''
                            if(DecimalFixed(st).replaceAll(',', '') == S1) {
                              peOI1 = 'green1'
                            }
                            let peOI2 = ''
                            if(DecimalFixed(st).replaceAll(',', '') == S2) {
                              peOI2 = 'green2'
                            }

                            let r = `
                            <tr>
                            <td width="2.34%">${ceHis}</td>
                            <td width="5.14%" class="${ceClass} ${ceOI1} ${ceOI2}">${DecimalFixed(ce.openInterest, true)}</td>
                            <td width="4.34%" class="${ceClass}">${DecimalFixed(ce.changeinOpenInterest, true)}</td>
                            <td width="5.54%" class="${ceClass}">${DecimalFixed(ce.totalTradedVolume, true)}</td>
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
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.bidprice)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.askPrice)}</td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.askQty, true)}</td>
                            <td width="4.34%" class="${peClass} ${peChangeTx}">${parseFloat(pe.change).toFixed(2)}</td>
                            <td width="4.34%" class="${peClass}"><a class="bold" href="javascript:;">${DecimalFixed(pe.lastPrice)}</a></td>
                            <td width="3.34%" class="${peClass}">${DecimalFixed(pe.impliedVolatility)}</td>
                            <td width="5.54%" class="${peClass}"><a class="bold" href="javascript:;">${DecimalFixed(pe.totalTradedVolume, true)}</a></td>
                            <td width="4.34%" class="${peClass}">${DecimalFixed(pe.changeinOpenInterest, true)}</td>
                            <td width="5.14%" class="${peClass} ${peOI1} ${peOI2}">${DecimalFixed(pe.openInterest, true)}</td>
                            <td width="2.34%">${peHis}</td>
                            </tr>`
                            start = start + r
                          }
                          
                          $$('underlyingVal').setHTML( '<b>' +SelectedScript + ': ' + DecimalFixed(Underlying_Value) + '</b><br>' + obj.timestamp)
                      } else {
                        $$('underlyingVal').setHTML('')
                        webix.delay(()=>document.getElementById("indices-body").innerHTML = selectScriptRow)
                      }
                      let end = `  </tbody>
                      </table></div></div>`

                      return start + end
                    } 
                    },
                    {view:'template', template:'<div style="background-color: blue"></div>', height:10}
                  ]
                }
              },
              {
                id:'strategyViewId',
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
                    {view: "button", type: "icon", icon: "mdi mdi-refresh", height:35, width: 37, align: "center",
                    click: function () {
                      $('#worldMarket').empty();
                      $('#worldMarket').append('Loading ...');
                      $('#sgxNifty').empty();
                      $('#sgxNifty').append('Loading ...');
                      let e = new Event("change")
                      let element = document.querySelector('#worldMarketId')
                      element.dispatchEvent(e)
                    }},
                    {
                      cols:[
                        {view:'template', template: '<div style="overflow:auto;width:100%;height:98%;font-size: large;background-color: #fbf7f1;"><div id="worldMarket">Loading ...</div</div>'},
                        {view:'template', width:400, template: '<div style="overflow:auto;width:100%;height:98%;font-size: large;background-color: #fbf7f1;"><div id="sgxNifty">Loading ...</div</div>'},
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
                      cols:[
                        {view:"combo", width:180, labelWidth:50, id:"scriptCalendarId",
                        label: 'Script:',  placeholder:"Please Select",
                        options: ['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()],
                        on:{
                          onChange: function(id){
                            CalenderUI = processDataForCalenderUI(id)
                            $$('script_calendar').refresh()
                          }
                          }
                        },
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download",
                          width: 37, align: "left",
                          click: function () {
                            let id = $$('scriptCalendarId').getValue()
                            if(id != '') {
                              let e = new Event("change")
                              let element = document.querySelector('#scriptHistoryId')
                              element.value = id
                              element.dispatchEvent(e)
                            } else {

                            }
                          }
                        },{},
                        {
                          view: "button", type: "icon", icon: "mdi mdi-download",label: 'Download All',
                          width: 130, align: "left",
                          click: function () {
                            if(window.confirm('Are you sure to download all sripts')) {
                              let e = new Event("change")
                              let element = document.querySelector('#scriptHistoryId')
                              element.value = ['NIFTY', 'BANKNIFTY', ...Object.keys(ScriptNames).sort()].toString() 
                              element.dispatchEvent(e)
                            }
                          }
                        },{width: 15}
                    ]
                  },
                  {
                    view:"calendar",
                    id:"script_calendar",
                    //date:new Date(2021,5,23),
                    calendarHeader: "%F, %Y",
                    weekHeader:true,
                    skipEmptyWeeks: true,
                    cellHeight: 70,
                    events:webix.Date.isHoliday,
                    //width:650,
                    //height:400,
                    align: 'center',
                    //borderless: false,
                    
                    dayTemplate: function(date){
                        //console.dir(date)
                        let dArr = date.toDateString().split(' ')
                        let dStr = dArr[2] + '-' + dArr[1] + '-' + dArr[3]

                        var html = "<div class='day'>"+date.getDate()+"</div>";
                        if(CalenderUI[dStr]) {
                            let per = parseFloat((CalenderUI[dStr][1] - CalenderUI[dStr][0]) / CalenderUI[dStr][0] * 100).toFixed(2)
                            let pol = parseFloat((CalenderUI[dStr][1] - CalenderUI[dStr][0])).toFixed(2)
                            
                            if(pol > 0) {
                                html = "<div class='day' style='width:100%;height:100%;line-height: normal;color:#1d922a;font-size: medium;'><b>" + per + "%</b> <br/>" + pol + "</div>";
                            } else {
                                html = "<div class='day' style='width:100%;height:100%;line-height: normal;color:#d21616;font-size: medium;'><b>" + per + "%</b> <br/>" + pol + "</div>";
                            }
                        }
                        return html;
                    },
                },
                {height:10},
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
                    { height: 40,
                      cols:[{},
                        { view:"datepicker", id:'etDatepickerId', value: new Date(),stringResult:true, width: 150 },
                        {view: "button", type: "icon", icon: "mdi mdi-download", height:35, width: 37, align: "center",
                      click: function () {
                        let sDate = $$('etDatepickerId').getValue().substr(0,10)
                        dispatchChangeEvent('#etDatepickerReqId', sDate)
                      }},{}
                     ]
                  },
                    {
                      view:"align", align:"middle,center",
                      body:{ view:'datatable', hover:"myhover",css: "rows", id:'etDatatableId', height: 500, width: 900, 
                      data: [{name: 'Hint :-)', event:'Please select date and click download'}], 
                      columns: [{id:'name', header: 'Company Name', width: 200}, {id:'event', header: 'Event', width: 450, fillspace:true}]   }
                    },
                    {height: 30}
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
                                  css:'red-background',
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
                                  css:'green-background',
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
                      view:"align", align:"middle,center",
                      body:{
                        view:'datatable', hover:"myhover",css: "rows", id:'yearWiseDatatableId', height: 500, width: 900, 
                        data: [], 
                        columns: [
                          {id:'name', header: ['Script Name', { content: "textFilter" }] , width: 200, sort: 'string'}, 
                          {id:'per', header: '52 Wks %', width: 200, sort: 'int',template: function(obj) {
                            return obj['per'] + '%' + "(" +  obj['pol'] + ")"
                          }}, 
                          {id:'below52WksPer', header: 'Below 52 Wks', width: 150, sort: 'int', fillspace:true, template: function(obj) {
                            return obj['below52WksPer'] + '%' + "(" +  obj['below52Wks'] + ")"
                          }
                          }
                        ]   
                      }
                    },
                    {height: 30}
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
                      view:'datatable', hover:"myhover",css: "rows", id:'watchListDatatableId', 
                      data: [],
                      rowHeight: 180,
                      columns: [
                        {id:'name', header: ['Strategy Details', {content: 'textFilter'}], width: 200, sort: 'string'}, 
                        {id:'script', header: ['Script Details', {content: 'textFilter'}], width: 400, sort: 'int',template: function(obj) {
                          return displayStrategyEntryDetails(obj)
                        }}, 
                        {id:'pol', header: ['Profit / Loss', {content: 'numberFilter'}], width: 400, sort: 'int', fillspace:true, template: function(obj) {
                          return displayStrategyLatestDetails(obj)
                        }
                        },
                        {id:'action', header: 'Action', width: 100, template: function(obj) {
                          return '<div><button onclick="deleteWatchList(\''+ obj.key + '\')">Delete</button></div>'
                        }},
                      ]   
                    }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'maxPainForAllViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      view:'datatable', hover:"myhover",css: "rows", id:'maxPainForAllDatatableId', 
                      data: [],
                      columns: [
                        {id:'symbol_name', header: ['Symbol Name', {content: 'textFilter'}], width: 200, sort: 'string'}, 
                        {id:'max_pain', header: 'Max Pain', width: 200,}, 
                        {id:'today_close', header: 'Todays Close', width: 200},
                        {id:'prev_close', header: 'Previous Close', width: 200, fillspace:true},
                      ]   
                    }
                  ]
                }
              },
              {
                view: "scrollview",
                scroll: "auto",
                id: 'nifty50StockViewId',
                hidden: true,
                body: {
                  rows: [
                    {
                      view:'datatable', hover:"myhover",css: "rows", id:'nifty50StockDatatableId', 
                      data: [],
                      columns: [
                        {id:'symbol_name', header: ['Symbol Name', {content: 'textFilter'}], width: 200, sort: 'string'}, 
                        {id:'last_trade_price', header: 'LTP', width: 200,}, 
                        {id:'change', header: 'Change', width: 200,}, 
                        {id:'change_per', header: ['Percentage (%)', {content: 'numberFilter'}], width: 200, sort: 'int', fillspace:true}, 
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
  webix.delay(()=> webix.extend($$("mainWinId"), webix.ProgressBar))
})

function shortStrangleCal(peOTM, ceOTM) {

  peOTM = peOTM.filter(obj => obj[1] > 10 && obj[0] < (Underlying_Value - 300) )
  ceOTM = ceOTM.filter(obj => obj[1] > 10 && obj[0] > (Underlying_Value + 300))

  let resultArr = []
  for(let i=0;i<peOTM.length; i++) {
    if(peOTM[i][5]<2 || peOTM[i][3]<100) {
      continue;
    }
      let sellPut = {
          strikePrice: peOTM[i][0],
          premium: peOTM[i][1],
          lotSize: 1
      }
      for(let j=0;j<ceOTM.length; j++) {
        if(ceOTM[j][5]<2|| ceOTM[j][3]<100) {
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
              lowerBoundDiff: lowerBound + " (-" + (Underlying_Value-lowerBound) + ")",
              uppderBound: uppderBound,
              uppderBoundDiff: uppderBound + " (+" + (uppderBound - Underlying_Value) + ")",
              premiumRec: parseFloat(sellPut.premium + sellCall.premium).toFixed(2),
              range: sellPut.strikePrice + ' - ' + sellCall.strikePrice,
              ceSt: sellCall.strikePrice,
              cePre: sellCall.premium,
              ceiv: ceOTM[j][5],
              peSt: sellPut.strikePrice,
              pePre: sellPut.premium,
              peiv: peOTM[i][5],
              upPer: parseFloat((uppderBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
              downPer: parseFloat((lowerBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
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
      view:"window", 
      id: 'strategyWinId',
      width: window.innerWidth - 2,
      height: window.innerHeight - 2,
      position: 'center',
      head:{view:"toolbar", id:'strategyWinToolbarId',cols:[
            { width:4 },
            { view:"label", label: "Short Strangle: " + SelectedScript + '  [' + SelectedExpiryDate + ']'},
            { view:"label", id:'spotPriceId', label: "Spot Price (SP): " + Underlying_Value },
            { view:"button", label: 'X', width: 50, align: 'left', click:function(){ $$('strategyWinId').close(); }}
          ]
        },
      body:{
        view:"datatable",hover:"myhover",css: "rows",
        columns:[
          { id:"range",	header:["Strike Price"], width:150,},
          { id:"lowerBound",	header: ["Lower Bound", { content: "numberFilter" }], width:120, sort:"int", template: function(obj) {
              return obj.lowerBoundDiff
          }},
          { id:"uppderBound",	header: ["Upper Bound", { content: "numberFilter" }],width:120, sort:"int", template: function(obj) {
              return obj.uppderBoundDiff
          }},
          { id:"pePre", header: ["PE Premium", { content: "numberFilter" }], width:150, sort:"int", },
          { id:"cePre",	header: ["CE Premium", { content: "numberFilter" }], width:150, sort:"int",},
          { id:"premiumRec",	header:["Premium Received", { content: "numberFilter" }] , width:160,	sort:"int"},
          { id:"downPer",	header:["<-- %", { content: "numberFilter" }] , width:100,	sort:"int"},
          { id:"upPer",	header:["--> %", { content: "numberFilter" }] , width:100,	sort:"int"},
          { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>", fillspace:true },
        ],
        select:"row",
        data:d,
        onClick: {
          details_button: function (ev, id) {
  
            let obj = this.data.pull[id.row]
            let sellPutSt = obj.peSt
            let sellPutPre = obj.pePre
            let sellCallSt = obj.ceSt
            let sellCallPre = obj.cePre
            let premiumRec = obj.premiumRec

            WatchObj = {
              key: SelectedScript+","+SelectedExpiryDate+","+sellPutSt+","+sellCallSt,
              name: 'Short Strangle',
              script: SelectedScript,
              expiryDate: SelectedExpiryDate,
              lotSize: fetchScriptConfig().lotSize,
              createDate: new Date,
              pol:0,
              sellPut: [{strikePrice: sellPutSt, lots: 1, entryPremium: sellPutPre, entryIV: obj.peiv, latestPremium: sellPutPre, latestIV: obj.peiv, pl: 0}],
              sellCall: [{strikePrice: sellCallSt, lots: 1, entryPremium: sellCallPre, entryIV: obj.ceiv, latestPremium: sellCallPre, latestIV: obj.ceiv, pl: 0}],
            }
            webix.ui({
              view: "window",
              width: window.innerWidth - 2,
              height: window.innerHeight - 2,
              position: 'center',
              id: 'chartWinId',
              head: {
                view: "toolbar", id: 'strategyChartToolbarId', cols: [
                  { width: 4 },
                  { view: "label", label: "Short Strangle : " + SelectedScript + '  [' + SelectedExpiryDate + ']'},
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
                  { id: 'inputInfoId', height: 70, cols: [
                    {
                      rows: [
                        {view:'template', template: '<div style="text-align: center;">PUT</div>'},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Sell 1</b> Lot ' + SelectedScript + ' <b>' + sellPutSt + '</b>PE @ ₹<b>'+ sellPutPre + '</b></div>'},
                      ]
                    },
                    {
                      rows: [
                        {view:'template', template: '<div style="text-align: center;">CALL</div>'},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Sell 1</b> Lot ' + SelectedScript + ' <b>' + sellCallSt + '</b>CE @ ₹<b>'+ sellCallPre + '</b></div>'},
                      ]
                    },
                    {
                      rows: [
                        {view:'template', template: ''},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;">Premium Received: ₹<b>'+premiumRec+'</b></div>'},
                        {view:'button', label: 'Watch It', click: function() {

                          let r = WatchList.filter(obj => obj.key == WatchObj.key)
                          if(r.length == 0) {
                            WatchList.push(WatchObj)
                            webix.storage.local.put('WatchList', WatchList)
                            webix.message({text: 'Added the strategy to watch list :)', type:"success", expire: 500})
                          } else {
                            webix.message({text: 'Sorry, Could not add same combination', type:"error", expire: 500})
                          }
                          
                        }},
                      ]
                    },
                  ]},
                  {view: 'template', borderless:true, template: '<div id="strategyChartId" style="width: 100%;height: 100%;background-color: aliceblue;"></div>'},
                ]
              }
            }).show();
            displayStrategyChart(this.data.pull[id.row].data, Underlying_Value)
          }
        }
      },
    }).show()
}
function ironConderCal(peOTM, ceOTM) {

  let config = fetchScriptConfig()
  peOTM = peOTM.filter(obj => obj[1] > 10 && obj[0] < (Underlying_Value - config.ironConderRange) )
  ceOTM = ceOTM.filter(obj => obj[1] > 10 && obj[0] > (Underlying_Value + config.ironConderRange))

  let resultArr = []
  for(let bp=0; bp<peOTM.length-1; bp++) { // bp = Buy Put, sp = Sell Put
    for(let sp=bp+1; sp<peOTM.length; sp++) {
      let peCreditAmt = peOTM[sp][1]  - peOTM[bp][2]

      if (peOTM[sp][3] < 100 || peOTM[bp][3] < 100) {
        //if ((peOTM[bp][0] - peOTM[sp][0]) > rangeDiff) {
        //  break;
        //}
        continue;
      }

      for(let sc=0; sc<ceOTM.length-1; sc++) { // sc = Sell Call, bc = Buy Call
        for(let bc=sc+1; bc<ceOTM.length; bc++) {
          let ceCreditAmt = ceOTM[sc][1]  - ceOTM[bc][2]

          if (ceOTM[sc][3] < 100 || ceOTM[bc][3] < 100) {
            //if ((peOTM[bp][0] - peOTM[sp][0]) > rangeDiff) {
            //  break;
            //}
            continue;
          }

          if ((peOTM[sp][0] - peOTM[bp][0])  != (ceOTM[bc][0] - ceOTM[sc][0])) {
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
              lowerBoundDiff: lowerBound + " (-" + (Underlying_Value-lowerBound) + ")",
              uppderBound: uppderBound,
              uppderBoundDiff: uppderBound + " (+" + (uppderBound - Underlying_Value) + ")",
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
              upPer: parseFloat((uppderBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
              downPer: parseFloat((lowerBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
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
      view:"window", 
      id: 'strategyWinId',
      width: window.innerWidth - 2,
      height: window.innerHeight - 2,
      position: 'center',
      zIndex:9999,
      head:{view:"toolbar", id:'strategyWinToolbarId',cols:[
            { width:4 },
            { view:"label", label: "Iron Condor Spread : " + SelectedScript + '  [' + SelectedExpiryDate + ']'},
            { view:"label", id:'spotPriceId', label: "Spot Price (SP): " + Underlying_Value },
            { view:"button", label: 'X', width: 30, align: 'left', click:function(){ $$('strategyWinId').close(); }}
          ]
        },
      body:{
        view:"datatable",hover:"myhover",css: "rows",
        columns:[
          { id:"range",	header:["Strike Price"], width:150,},
          { id:"lowerBound",	header: ["Lower Bound", { content: "numberFilter" }], width:120, sort:"int", template: function(obj) {
              return obj.lowerBoundDiff
          }},
          { id:"uppderBound",	header: ["Upper Bound", { content: "numberFilter" }],width:120, sort:"int", template: function(obj) {
              return obj.uppderBoundDiff
          }},

          { id:"premiumRec",	header:["Premium Received", { content: "numberFilter" }] , width:160,	sort:"int"},
          { id:"maxLoss",	header:"Max Loss", width:100,	sort:"int"},
          { id:"downPer",	header:["<-- %", { content: "numberFilter" }] , width:100,	sort:"int"},
          { id:"upPer",	header:["--> %", { content: "numberFilter" }] , width:100,	sort:"int"},
          { id: "chartData", header: "Chart", width: 200, template: "<input type='button' value='Details' class='details_button'>", fillspace:true },
        ],
        select:"row",
        data:d,
        onClick: {
          details_button: function (ev, id) {
  
            let obj = this.data.pull[id.row]
            let buyPutSt = obj.buyPutSt
            let buyPutPre = obj.buyPutPre
            let sellPutSt = obj.sellPutSt
            let sellPutPre = obj.sellPutPre
            let buyCallSt = obj.buyCallSt
            let buyCallPre = obj.buyCallPre
            let sellCallSt = obj.sellCallSt
            let sellCallPre = obj.sellCallPre
            let premiumRec = obj.premiumRec

            WatchObj = {
              key: SelectedScript+","+SelectedExpiryDate+","+sellPutSt+","+buyPutSt+","+sellCallSt+","+buyCallSt+","+'IronCondor',
              name: 'Iron Condor',
              script: SelectedScript,
              expiryDate: SelectedExpiryDate,
              lotSize: fetchScriptConfig().lotSize,
              createDate: new Date,
              pol:0,
              sellPut: [{strikePrice: sellPutSt, lots: 1, entryPremium: sellPutPre, entryIV: obj.sellPutIV, latestPremium: sellPutPre, latestIV: obj.sellPutIV, pl: 0}],
              sellCall: [{strikePrice: sellCallSt, lots: 1, entryPremium: sellCallPre, entryIV: obj.sellCallIV, latestPremium: sellCallPre, latestIV: obj.sellCallIV, pl: 0}],
              buyPut: [{strikePrice: buyPutSt, lots: 1, entryPremium: buyPutPre, entryIV: obj.buyPutIV, latestPremium: buyPutPre, latestIV: obj.buyPutIV, pl: 0}],
              buyCall: [{strikePrice: buyCallSt, lots: 1, entryPremium: buyCallPre, entryIV: obj.buyCallIV, latestPremium: buyCallPre, latestIV: obj.buyCallIV, pl: 0}],
            }
            webix.ui({
              view: "window",
              width: window.innerWidth - 2,
              height: window.innerHeight - 2,
              position: 'center',
              id: 'chartWinId',
              head: {
                view: "toolbar", id: 'strategyChartToolbarId', cols: [
                  { width: 4 },
                  { view: "label", label: "Iron Condor Spread : " + SelectedScript + '  [' + SelectedExpiryDate + ']'},
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
                  { id: 'inputInfoId', height: 70, cols: [
                    {
                      rows: [
                        {view:'template',  template: '<div style="text-align: center;">PUT</div>'},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Buy 1</b> Lot ' + SelectedScript + ' <b>' + buyPutSt + '</b>PE @ ₹<b>'+ buyPutPre + '</b></div>'},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Sell 1</b> Lot ' + SelectedScript + ' <b>' + sellPutSt + '</b>PE @ ₹<b>'+ sellPutPre + '</b></div>'},
                      ]
                    },
                    {
                      rows: [
                        {view:'template', template: '<div style="text-align: center;">CALL</div>'},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Sell 1</b> Lot ' + SelectedScript + ' <b>' + sellCallSt + '</b>CE @ ₹<b>'+ sellCallPre + '</b></div>'},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;"><b>Buy 1</b> Lot ' + SelectedScript + ' <b>' + buyCallSt + '</b>CE @ ₹<b>'+ buyCallPre + '</b></div>'},
                      ]
                    },
                    {
                      rows: [
                        {view:'template', template: ''},
                        {view: 'template', borderless:true, template: '<div style="text-align: center;">Premium Received: ₹<b>'+premiumRec+'</b></div>'},
                        {view:'button', label: 'Watch It', click: function() {

                          let r = WatchList.filter(obj => obj.key == WatchObj.key)
                          if(r.length == 0) {
                            WatchList.push(WatchObj)
                            webix.storage.local.put('WatchList', WatchList)
                            webix.message({text: 'Added the strategy to watch list :)', type:"success", expire: 500})
                          } else {
                            webix.message({text: 'Sorry, Could not add same combination', type:"error", expire: 500})
                          }
                        }},
                      ]
                    },
                  ]},
                  {view: 'template', template: '<div id="strategyChartId" style="width: 100%;height: 100%;background-color: aliceblue;"></div>'},
                ]
              }
            }).show();
            displayStrategyChart(this.data.pull[id.row].data, Underlying_Value)
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
  webix.storage.session.put('optionHistoryInput', {optionType, strikePrice, expiryDate, symbol})
  dispatchChangeEvent('#optionHistoryId')
}
let GlobalMarketHeader = [{id: 'country', header:'Country'}, {id: 'exchange', header: 'Stock Exchange'},
{id:'index', header: 'Index'}, {id:'openTime', header: 'Opening Time (India Time)'}, {id:'closeTime', header: 'Closing Time (India Time)'}]
let GlobalMarketTimings = [
  {country: 'Japan', exchange: 'Japan Exchange Group', index: 'Nikkei', openTime:'5 : 30 AM', closeTime: '11 : 30 AM'},
  {country: 'Australia', exchange: 'Australian Securities Exchange', index: 'S&P ASX', openTime:'5 : 30 AM', closeTime: '11 : 30 AM'},
  {country: 'South Korea', exchange: 'KRX Korean Exchange', index: 'Kospi', openTime:'5 : 30 AM', closeTime: '11 : 30 AM'},
  {country: 'Hong Kong', exchange: 'HKEX Hong Kong Exchange', index: 'Hang Seng', openTime:'6 : 45 AM', closeTime: '1 : 30 PM'},
  {country: 'China', exchange: 'Shanghai Stock Exchange & Shenzen stock Exchange', index: 'SSE', openTime:'7 : 00 AM', closeTime: '12 : 30 PM'},
  {country: 'India', exchange: 'NSE & BSE ', index: 'Nifty & Sensex', openTime:'9 : 15 AM', closeTime: '3 : 30 PM'},
  {country: 'Germany', exchange: 'Deutsche Börse AG', index: 'DAX', openTime:'12 : 30 PM', closeTime: '2 : 30 AM'},
  {country: 'UK', exchange: 'London Stock Exchange', index: 'FTSE', openTime:'1 : 30 PM', closeTime: '10 : 00 PM'},
  {country: 'USA', exchange: 'NYSE, NASDAQ', index: 'Dow, NASDAQ, S&P 500', openTime:'7 : 00 PM', closeTime: '1 : 30 AM'}
]
function fetchScriptHistory() {
  dispatchChangeEvent('#scriptHistoryId')
}
function dispatchChangeEvent(elementId, eleVal) {
  let e = new Event("change")
  let element = document.querySelector(elementId)
  if(eleVal) {
    element.value = eleVal
  }
  element.dispatchEvent(e)
}
function processDataForCalenderUI(id) {
  let ScriptHistoryData = webix.storage.local.get('ScriptHistoryData')
  let data = ScriptHistoryData[id]
  let cData = {}
  data.forEach(function(currentValue, index, arr){
      if(data[index + 1]) {
          cData[currentValue[0]] = [data[index + 1][4], currentValue[4]]
      }
  })
  return cData;
}
function showViewId(id) {
  ViewIds.forEach(v => {
    if(v == id) {
      $$(v).show()
    } else {
      $$(v).hide()
    }
  })
}
function generateContinuousCells(type) {
  let cells = [];
  for(let i=10; i>0; i--) {
      cells.push({
          id: i + 'd' + (type === 'Loss' ? 'l' : 'p'),
          header: i + "D",
          body: {
              id: i + "d" + type + "Id",
              view:"datatable",
              columns:[
                  {id:'id', header:'Script', width: 150},
                  {id:'per', header:'% (Rs)', width: 310, template: function (obj) {
                      return getTemplateForContinues(obj['per'], obj['pol'], obj['closePrice'], obj['prevClose']);
                  }, sort: 'int', fillspace: true},
              ],
              data: [],
              on:{
                  onAfterLoad:function(){
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
          view:"datatable",
          columns:[
              {id:'id', header:'Script', width: 150},
              {id:'per', header:'% (Rs)', width: 310, template: function (obj) {
                  return getTemplateForContinues(obj['per'], obj['pol'], obj['closePrice'], obj['prevClose']);
              }, sort: 'int'},
              {id:'days', header:'(?)D', width: 310, template: function (obj) {
                  return obj['days']
              }, sort: 'int', fillspace: true},
          ],
          data: [],
          on:{
              onAfterLoad:function(){
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
  if(!data) {
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
      let v = data.slice(0, i+1).filter(function (val, index, array) {
          return array[index+1] && parseFloat((val[4] - array[index+1][4]).toFixed(2)) > 0
      }).map(function (val) {
          return val;
      })
      if (v.length === i) {
          calculatedData.conWise.pos[i - 1] = {
              pol: parseFloat((v[0][4] - data[i][4]).toFixed(2)),
              per: (parseFloat(((v[0][4] - data[i][4]) * 100 / data[i][4]).toFixed(2))) ,
              closePrice: v[0][4],
              prevClose: data[i][4]
          }
          break;
      }
      v = data.slice(0, i+1).filter(function (val, index, array) {
          return array[index+1] && parseFloat((val[4] - array[index+1][4]).toFixed(2)) < 0
      }).map(function (val) {
          return val;
      })
      if (v.length === i) {
          calculatedData.conWise.neg[i - 1] = {
              pol: parseFloat((v[0][4] - data[i][4]).toFixed(2)),
              per: (parseFloat(((v[0][4] - data[i][4]) * 100 / data[i][4]).toFixed(2))) ,
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
      '0': [],'1': [],'2': [],'3': [],'4': [],'5': [],'6': [],'7': [],'8': [],'9': []
  }
  let negArr = {
      '0': [],'1': [],'2': [],'3': [],'4': [],'5': [],'6': [],'7': [],'8': [],'9': []
  }
  Object.keys(dd)
  Object.keys(dd).forEach(k => {
      let s = dd[k]
      let obj = {id: s.id}
      for(let i=9; i>=0; i--) {
          if(Object.keys(s.conWise.pos[i]).length > 0) {
              obj['pol'] = s.conWise.pos[i]['pol']
              obj['per'] = s.conWise.pos[i]['per']
              obj['prevClose'] = s.conWise.pos[i]['prevClose']
              obj['closePrice'] = s.conWise.pos[i]['closePrice']
              obj['days'] = i+1
              posArr[i].push(obj)
              break;
          }
      }
      for(let i=9; i>=0; i--) {
          if(Object.keys(s.conWise.neg[i]).length > 0) {
              obj['pol'] = s.conWise.neg[i]['pol']
              obj['per'] = s.conWise.neg[i]['per']
              obj['prevClose'] = s.conWise.neg[i]['prevClose']
              obj['closePrice'] = s.conWise.neg[i]['closePrice']
              obj['days'] = i+1
              negArr[i].push(obj)
              break;
          }
      }
  })
  let posAll = []
  Object.keys(posArr).forEach(k => {
      let kInt = parseInt(k)
      let id = (kInt+1) +'dProfitId'
      $$(id).parse(posArr[k])
      posAll = posAll.concat(posArr[k])
      $$('continuousProfitId').getTabbar().config.options[(9-kInt)].value = (kInt+1) + 'D (' + posArr[k].length + ')'
      if(posArr[k].length === 0) {
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
      let id = (kInt+1) +'dLossId'
      $$(id).parse(negArr[k])
      negAll = negAll.concat(negArr[k])
      $$('continuousLossId').getTabbar().config.options[(9-kInt)].value = (kInt+1) + 'D (' + negArr[k].length + ')'
      if(negArr[k].length === 0) {
          $$('continuousLossTabbarId').hideOption(id)
      } else {
          $$('continuousLossTabbarId').showOption(id)
      }
  })
  $$('AlldLossId').parse(negAll)
  $$('continuousLossId').getTabbar().render()
}
function yearWisePercentageCal() {
  let dd = webix.storage.local.get('ScriptHistoryData')
  let sArr = []
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
      if(new Date(a[0]) >= oneYearDate) {
        oneYearClose = a[4]
        if(lowPrice>a[3]) {
          lowPrice = a[3]
          lowPriceDate = a[0]
        }
        if(highPrice<a[2]) {
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
      below52WksPer: parseFloat((cClose - highPrice)/highPrice * 100).toFixed(2),
      below52Wks: parseFloat(cClose - highPrice).toFixed(2)
    })
  })
  console.dir(sArr)
  return sArr
}
function watchListCal() {
  let OptionData = webix.storage.local.get('OptionChainData')
  WatchList = webix.storage.local.get('WatchList')
  for(let i=0;i<WatchList.length;i++) {
      let strategy = WatchList[i]
      strategy.pol = 0
      let optionDataArr = OptionData[strategy.script]['data'][strategy.expiryDate]
      if(optionDataArr) {
          // Sell Put
          if(strategy.sellPut) {
              for(let j=0;j<strategy.sellPut.length; j++) {
                  let sp = strategy.sellPut[j]
                  for(let k=0; k<optionDataArr.length; k++) {
                      let st = Object.keys(optionDataArr[k])[0]
                      if(st == sp.strikePrice) {
                          let pe = optionDataArr[k][st]['PE']
                          if(pe) {
                              sp.latestPremium = pe.askPrice
                              sp.pl = sp.lots * (sp.entryPremium - sp.latestPremium) * strategy.lotSize
                              strategy.pol += sp.pl
                              sp.latestIV = pe.impliedVolatility
                          }
                      }
                  }
              }
          }
          // Buy Put
          if(strategy.buyPut) {
              for(let j=0;j<strategy.buyPut.length; j++) {
                  let bp = strategy.buyPut[j]
                  for(let k=0; k<optionDataArr.length; k++) {
                      let st = Object.keys(optionDataArr[k])[0]
                      if(st == bp.strikePrice) {
                          let pe = optionDataArr[k][st]['PE']
                          if(pe) {
                              bp.latestPremium = pe.bidprice
                              bp.pl = bp.lots * (bp.latestPremium - bp.entryPremium) * strategy.lotSize
                              strategy.pol += bp.pl
                              bp.latestIV = pe.impliedVolatility
                          }
                      }
                  }
              }
          }
          // Sell Call
          if(strategy.sellCall) {
              for(let j=0;j<strategy.sellCall.length; j++) {
                  let sc = strategy.sellCall[j]
                  for(let k=0; k<optionDataArr.length; k++) {
                      let st = Object.keys(optionDataArr[k])[0]
                      if(st == sc.strikePrice) {
                          let ce = optionDataArr[k][st]['CE']
                          if(ce) {
                              sc.latestPremium = ce.askPrice
                              sc.pl = sc.lots * (sc.entryPremium - sc.latestPremium) * strategy.lotSize
                              strategy.pol += sc.pl
                              sc.latestIV = ce.impliedVolatility
                          }
                      }
                  }
              }
          }
          // Buy Call
          if(strategy.buyCall) {
              for(let j=0;j<strategy.buyCall.length; j++) {
                  let bc = strategy.buyCall[j]
                  for(let k=0; k<optionDataArr.length; k++) {
                      let st = Object.keys(optionDataArr[k])[0]
                      if(st == bc.strikePrice) {
                          let ce = optionDataArr[k][st]['CE']
                          if(ce) {
                              bc.latestPremium = ce.askPrice
                              bc.pl = bc.lots * (bc.entryPremium - bc.latestPremium) * strategy.lotSize
                              strategy.pol += bc.pl
                              bc.latestIV = ce.impliedVolatility
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
function displayStrategyEntryDetails(obj){
  if(obj.name == 'Short Gamma') {
    return `<div style="width:100%;">
            Script: <b>${obj.script}</b><br>
            Sell <b>${obj.sellPut[0].lots}</b> lots of <b>${obj.sellPut[0].strikePrice}</b>PE @  ₹<b>${obj.sellPut[0].entryPremium}</b> IV: ${obj.sellPut[0].entryIV}<br>
            Buy <b>${obj.buyPut[0].lots}</b> lot of <b>${obj.buyPut[0].strikePrice}</b>PE @  ₹<b>${obj.buyPut[0].entryPremium}</b> IV: ${obj.buyPut[0].entryIV}<br>

            Buy <b>${obj.buyCall[0].lots}</b> lot of <b>${obj.buyCall[0].strikePrice}</b>CE @  ₹<b>${obj.buyCall[0].entryPremium}</b> IV: ${obj.buyCall[0].entryIV}<br>
            Sell <b>${obj.sellCall[0].lots}</b> lots of <b>${obj.sellCall[0].strikePrice}</b>CE @  ₹<b>${obj.sellCall[0].entryPremium}</b> IV: ${obj.sellCall[0].entryIV}<br>
            Expiry Date: ${obj.expiryDate}
          </div>`
  } else if(obj.name == 'Short Strangle') {
    return `<div style="width:100%;">
            Script: <b>${obj.script}</b><br>
            Sell <b>${obj.sellPut[0].lots}</b> lot of <b>${obj.sellPut[0].strikePrice}</b>PE @  ₹<b>${obj.sellPut[0].entryPremium}</b> IV: ${obj.sellPut[0].entryIV}<br>
            Sell <b>${obj.sellCall[0].lots}</b> lot of <b>${obj.sellCall[0].strikePrice}</b>CE @  ₹<b>${obj.sellCall[0].entryPremium}</b> IV: ${obj.sellCall[0].entryIV}<br>
            
            Expiry Date: ${obj.expiryDate}
          </div>`
  } else if(obj.name == 'Iron Condor') {
    return `<div style="width:100%;">
            Script: <b>${obj.script}</b><br>
            Buy <b>${obj.buyPut[0].lots}</b> lot of <b>${obj.buyPut[0].strikePrice}</b>PE @  ₹<b>${obj.buyPut[0].entryPremium}</b> IV: ${obj.buyPut[0].entryIV}<br>
            Sell <b>${obj.sellPut[0].lots}</b> lots of <b>${obj.sellPut[0].strikePrice}</b>PE @  ₹<b>${obj.sellPut[0].entryPremium}</b> IV: ${obj.sellPut[0].entryIV}<br>

            Sell <b>${obj.sellCall[0].lots}</b> lots of <b>${obj.sellCall[0].strikePrice}</b>CE @  ₹<b>${obj.sellCall[0].entryPremium}</b> IV: ${obj.sellCall[0].entryIV}<br>
            Buy <b>${obj.buyCall[0].lots}</b> lot of <b>${obj.buyCall[0].strikePrice}</b>CE @  ₹<b>${obj.buyCall[0].entryPremium}</b> IV: ${obj.buyCall[0].entryIV}<br>
            Expiry Date: ${obj.expiryDate}
          </div>`
  }
  return ''
}
function displayStrategyLatestDetails(obj){
  if(obj.name == 'Short Gamma') {
    let style = 'style="color:#fd505c"'
    if(obj.pol >= 0) {
      style = 'style="color:#02a68a"'
    }
    return `<div style="width:100%;"><br>
            <b>${obj.sellPut[0].strikePrice}</b>PE @  ₹<b>${obj.sellPut[0].latestPremium}</b> 
            [ ${parseFloat(obj.sellPut[0].latestPremium - obj.sellPut[0].entryPremium).toFixed(2)} ]
            IV: ${obj.sellPut[0].latestIV}<br>
            <b>${obj.buyPut[0].strikePrice}</b>PE @  ₹<b>${obj.buyPut[0].latestPremium}</b> 
            [ ${parseFloat(obj.buyPut[0].latestPremium - obj.buyPut[0].entryPremium).toFixed(2)} ]
            IV: ${obj.buyPut[0].latestIV}<br>

            <b>${obj.buyCall[0].strikePrice}</b>CE @  ₹<b>${obj.buyCall[0].latestPremium}</b> 
            [ ${parseFloat(obj.buyCall[0].latestPremium - obj.buyCall[0].entryPremium).toFixed(2)} ]
            IV: ${obj.buyCall[0].latestIV}<br>
            <b>${obj.sellCall[0].strikePrice}</b>CE @  ₹<b>${obj.sellCall[0].latestPremium}</b> 
            [ ${parseFloat(obj.sellCall[0].latestPremium - obj.sellCall[0].entryPremium).toFixed(2)} ]
            IV: ${obj.sellCall[0].latestIV}<br>
            Profit/Loss: ₹<b><span ${style}>${obj.pol}</span></b>
          </div>`
  } else if(obj.name == 'Short Strangle') {
    let style = 'style="color:#fd505c"'
    if(obj.pol >= 0) {
      style = 'style="color:#02a68a"'
    }
    return `<div style="width:100%;">
            <b>${obj.sellPut[0].strikePrice}</b>PE @  ₹<b>${obj.sellPut[0].latestPremium}</b> 
            [ ${parseFloat(obj.sellPut[0].latestPremium - obj.sellPut[0].entryPremium).toFixed(2)} ]
            IV: ${obj.sellPut[0].latestIV}<br>

            <b>${obj.sellCall[0].strikePrice}</b>CE @  ₹<b>${obj.sellCall[0].latestPremium}</b> 
            [ ${parseFloat(obj.sellCall[0].latestPremium - obj.sellCall[0].entryPremium).toFixed(2)} ]
            IV: ${obj.sellCall[0].latestIV}<br>
            <br>
            Profit/Loss: ₹<b><span ${style}>${obj.pol}</span></b>
          </div>`
  } else if(obj.name == 'Iron Condor') {
    let style = 'style="color:#fd505c"'
    if(obj.pol >= 0) {
      style = 'style="color:#02a68a"'
    }
    return `<div style="width:100%;"><br>
            <b>${obj.buyPut[0].strikePrice}</b>PE @  ₹<b>${obj.buyPut[0].latestPremium}</b> 
            [ ${parseFloat(obj.buyPut[0].latestPremium - obj.buyPut[0].entryPremium).toFixed(2)} ]
            IV: ${obj.buyPut[0].latestIV}<br>
            <b>${obj.sellPut[0].strikePrice}</b>PE @  ₹<b>${obj.sellPut[0].latestPremium}</b> 
            [ ${parseFloat(obj.sellPut[0].latestPremium - obj.sellPut[0].entryPremium).toFixed(2)} ]
            IV: ${obj.sellPut[0].latestIV}<br>
            

            <b>${obj.sellCall[0].strikePrice}</b>CE @  ₹<b>${obj.sellCall[0].latestPremium}</b> 
            [ ${parseFloat(obj.sellCall[0].latestPremium - obj.sellCall[0].entryPremium).toFixed(2)} ]
            IV: ${obj.sellCall[0].latestIV}<br>
            <b>${obj.buyCall[0].strikePrice}</b>CE @  ₹<b>${obj.buyCall[0].latestPremium}</b> 
            [ ${parseFloat(obj.buyCall[0].latestPremium - obj.buyCall[0].entryPremium).toFixed(2)} ]
            IV: ${obj.buyCall[0].latestIV}<br>
            Profit/Loss: ₹<b><span ${style}>${obj.pol}</span></b>
          </div>`
  }
return ''
}
function deleteWatchList(key) {
  if(confirm('Are you sure to delete the strategy?')) {
    WatchList = webix.storage.local.get('WatchList')
    let tempList = []
    let flag = false
    for(let i=0; i<WatchList.length; i++) {
      if(WatchList[i].key != key) {
        tempList.push(WatchList[i])
      } else {
        flag = true
      }
    }
    flag && webix.delay(()=> {
      webix.message({text: "Deleted the strategy item", type:"success"})
      $$('watchListDatatableId').clearAll()
      $$('watchListDatatableId').parse(tempList)
    })
    WatchList = tempList
    webix.storage.local.put('WatchList', WatchList)
  }
  
}