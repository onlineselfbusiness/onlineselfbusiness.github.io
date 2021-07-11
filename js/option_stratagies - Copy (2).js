
let globalConfig = {
  'default': { lowerPer: 4, higherPer: 4, creditAmt: 3, skipDiffPer: 1.45, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 7, ironConderRange: 50 },
  'BANKNIFTY': { lowerPer: 6, higherPer: 6, creditAmt: 40, skipDiffPer: 1.45, lowerLimitPer: 12, upperLimitPer: 12, outerLimitPer: 4, ironConderRange: 500 },
  'NIFTY': { lowerPer: 4, higherPer: 4, creditAmt: 20, skipDiffPer: 1.45, lowerLimitPer: 7, upperLimitPer: 7, outerLimitPer: 2, ironConderRange: 300 },
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
let selectedExpieryDate = ''

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
  //$$('mainWinId').showProgress()
  document.getElementById("indices-body").innerHTML = loader
  //0 && fetch('http://localhost:3000/optionChain?symbol=' + symbol)
  //https://optionstrategies.el.r.appspot.com/
  fetch('https://optionstrategies.el.r.appspot.com/optionChain?symbol=' + symbol)
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
        let sData = optionChainData[SelectedScript]
        Underlying_Value = sData.underlyingValue
        $$('optionChainTemplateId').setValues({data: sData.data[selectedExpieryDate], timestamp: sData.timestamp})
      }
      webix.message({text: symbol + " download completed :-)", type:"success"})
    })
    .catch(err => {$$('mainWinId').hideProgress(); webix.message({text: "Error while downloading  "+symbol+" :-(", type:"error", }); console.error(err)});

    let sData = optionChainData[SelectedScript]
    Underlying_Value = sData.underlyingValue
    $$('optionChainTemplateId').setValues({data: sData.data[selectedExpieryDate], timestamp: sData.timestamp})
    
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
        { view: "label", label: "Short Gamma Spread: "+ SelectedScript + '  [' + selectedExpieryDate + ']' },
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
        { id: "premiumRec", header: ["Premium Rec", { content: "numberFilter" }], width: 100, sort: "int", },

        { id: "sellPutSt", header: "PE Short St", width: 100, sort: "int", },
        { id: "buyPutSt", header: "PE Long St", width: 100, sort: "int", },

        { id: "buyCallSt", header: "CE Long St", width: 100, sort: "int", },
        { id: "sellCallSt", header: "CE Short St", width: 100, sort: "int", },

        { id: "peLS", header: ["PE Long-Short", { content: "numberFilter" }], width: 100, sort: "int", },
        { id: "ceSL", header: ["CE Short-Long", { content: "numberFilter" }], width: 100, sort: "int", },
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
          webix.ui({
            view: "window",
            width: window.innerWidth - 2,
            height: window.innerHeight - 2,
            position: 'center',
            id: 'chartWinId',
            head: {
              view: "toolbar", id: 'strategyChartToolbarId', cols: [
                { width: 4 },
                { view: "label", label: "Short Gamma Spread : " + SelectedScript + '  [' + selectedExpieryDate + ']'},
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
                      {view: 'template', borderless:true, template: ''},
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

webix.ready(function () {

  let refreshOptionChainId = document.querySelector('#refreshOptionChainId')
  refreshOptionChainId.addEventListener('change', (e) => {
    let tempData = webix.storage.local.get('tempData')
    tempData.selectedExpieryDate = selectedExpieryDate
    optionChainData[SelectedScript] = tempData
    webix.storage.local.put('optionChainData', optionChainData)
    let sData = optionChainData[SelectedScript]
    Underlying_Value = sData.underlyingValue
    tempData.selectedExpieryDate = selectedExpieryDate
    $$('optionChainTemplateId').setValues({data: sData.data[selectedExpieryDate], timestamp: sData.timestamp})

  })

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
            view: "sidebar", id: "sidebarId", width: 155, scroll: "auto", hidden:true,
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
                $$('payoffChartId').refresh();
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
                              SelectedScript = id
                              if(id == '') {
                                $$('algoStrategyId').setValue('')
                                $$('underlyingVal').setHTML('')
                              } else {
                                let sData = optionChainData[SelectedScript]
                                if(SelectedScript && sData) {
                                  let sData = optionChainData[SelectedScript]
                                  Underlying_Value = sData.underlyingValue

                                  let expiryDates = Object.keys(sData.data).sort((a,b) => {if(new Date(a) > new Date(b)) {return 1} else {return -1}})
                                  $$('expiryDateId').define('options', expiryDates)
                                  
                                  if(sData.selectedExpieryDate){
                                    selectedExpieryDate = sData.selectedExpieryDate
                                  } else {
                                    selectedExpieryDate = expiryDates[0].id
                                  }
                                  
                                  $$('expiryDateId').setValue(selectedExpieryDate)
                                  $$('optionChainTemplateId').setValues({data: sData.data[selectedExpieryDate], timestamp: sData.timestamp})
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
                          options:[ 
                          ],on:{
                            onChange: function(id){
                              console.dir(id)
                              if(id != '') {
                                if(selectedExpieryDate != id) {
                                  selectedExpieryDate = id
                                  let sData = optionChainData[SelectedScript]
                                  Underlying_Value = sData.underlyingValue
                                  sData.selectedExpieryDate = selectedExpieryDate
                                  $$('optionChainTemplateId').setValues({data: sData.data[selectedExpieryDate], timestamp: sData.timestamp})
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
                              //downloadOptionChain(s)
                              let sData = optionChainData[SelectedScript]
                              if(sData) {
                                let d = new Date(sData.fetchTime)
                                let now = new Date()
                                if(now.getTime() > (d.getTime() + twoMinutes)) {
                                  let e = new Event("change")
                                  let element = document.querySelector('#scriptInputId')
                                  element.value = s
                                  element.dispatchEvent(e)
                                } else {
                                  Underlying_Value = sData.underlyingValue
                                  $$('optionChainTemplateId').setValues({data: sData.data[selectedExpieryDate], timestamp: sData.timestamp})
                                }
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
                          let arr = obj.data

                          let fivePerLower = Underlying_Value - (Underlying_Value * 5 /100)
                          let fivePerHigher = Underlying_Value + (Underlying_Value * 5 /100)

                          for(let i=0; i<arr.length; i++) {
                            let row = arr[i]
                            let st = Object.keys(row)[0]
                            let ce = row[st]['CE'] || {}
                            let pe = row[st]['PE'] || {}
                            let ceClass = st<=Underlying_Value ? 'bg-yellow' : ''
                            let peClass = st>Underlying_Value ? 'bg-yellow' : ''
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

                            let r = `
                            <tr>
                            <td width="2.34%"></td>
                            <td width="5.14%" class="${ceClass}">${DecimalFixed(ce.openInterest, true)}</td>
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
                            <td width="5.14%" class="${peClass}">${DecimalFixed(pe.openInterest, true)}</td>
                            <td width="2.34%"></td>
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
})
// Short Strangle Strategy
function shortStrangleCal(peOTM, ceOTM) {

  peOTM = peOTM.filter(obj => obj[1] > 10 && obj[0] < (Underlying_Value - 300) )
  ceOTM = ceOTM.filter(obj => obj[1] > 10 && obj[0] > (Underlying_Value + 300))

  let resultArr = []
  for(let i=0;i<peOTM.length; i++) {
      let sellPut = {
          strikePrice: peOTM[i][0],
          premium: peOTM[i][1],
          lotSize: 1
      }
      for(let j=0;j<ceOTM.length; j++) {
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
              peSt: sellPut.strikePrice,
              pePre: sellPut.premium,
              upPer: parseFloat((uppderBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
              downPer: parseFloat((lowerBound - Underlying_Value)/Underlying_Value * 100).toFixed(2),
          })
      }
  }
  console.dir(resultArr)
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
            { view:"label", label: "Short Strangle: " + SelectedScript + '  [' + selectedExpieryDate + ']'},
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
          { id:"pePre", header: ["PE Premium", { content: "numberFilter" }], width:70, sort:"int", },
          { id:"cePre",	header: ["CE Premium", { content: "numberFilter" }], width:70, sort:"int",},
          { id:"premiumRec",	header:"Premium Received" , width:150,	sort:"int"},
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
            webix.ui({
              view: "window",
              width: window.innerWidth - 2,
              height: window.innerHeight - 2,
              position: 'center',
              id: 'chartWinId',
              head: {
                view: "toolbar", id: 'strategyChartToolbarId', cols: [
                  { width: 4 },
                  { view: "label", label: "Short Strangle : " + SelectedScript + '  [' + selectedExpieryDate + ']'},
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
          })
        }
      }
    }
  }
  console.dir(resultArr)
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
            { view:"label", label: "Iron Condor Spread : " + SelectedScript + '  [' + selectedExpieryDate + ']'},
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
          { id:"pePre", header: ["PE Premium", { content: "numberFilter" }], width:70, sort:"int", },
          { id:"cePre",	header: ["CE Premium", { content: "numberFilter" }], width:70, sort:"int",},
          { id:"premiumRec",	header:"Premium Received" , width:150,	sort:"int"},
          { id:"maxLoss",	header:"Max Loss", width:100,	sort:"int"},
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
            webix.ui({
              view: "window",
              width: window.innerWidth - 2,
              height: window.innerHeight - 2,
              position: 'center',
              id: 'chartWinId',
              head: {
                view: "toolbar", id: 'strategyChartToolbarId', cols: [
                  { width: 4 },
                  { view: "label", label: "Iron Condor Spread : " + SelectedScript + '  [' + selectedExpieryDate + ']'},
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
                        {view:'template', borderless:true, template: ''},
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