// '👍'  '👎'
/*
<svg id='green' xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 512 512">
<!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
<style>svg#green{fill:#00ff40}</style>
<path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z"/>
</svg>
<svg id='red' xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 512 512">
<!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
<style>svg#red{fill:#ff0000}</style>
<path d="M313.4 479.1c26-5.2 42.9-30.5 37.7-56.5l-2.3-11.4c-5.3-26.7-15.1-52.1-28.8-75.2H464c26.5 0 48-21.5 48-48c0-18.5-10.5-34.6-25.9-42.6C497 236.6 504 223.1 504 208c0-23.4-16.8-42.9-38.9-47.1c4.4-7.3 6.9-15.8 6.9-24.9c0-21.3-13.9-39.4-33.1-45.6c.7-3.3 1.1-6.8 1.1-10.4c0-26.5-21.5-48-48-48H294.5c-19 0-37.5 5.6-53.3 16.1L202.7 73.8C176 91.6 160 121.6 160 153.7V192v48 24.9c0 29.2 13.3 56.7 36 75l7.4 5.9c26.5 21.2 44.6 51 51.2 84.2l2.3 11.4c5.2 26 30.5 42.9 56.5 37.7zM32 384H96c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32H32C14.3 96 0 110.3 0 128V352c0 17.7 14.3 32 32 32z"/>
</svg>
*/
class ShortStrangleActionRenderer {
    // gets called once before the renderer is used
    init(params) {
        this.eGui = document.createElement('div');
        if (params.data) {
            // create the cell

            this.eGui.innerHTML = `<span class="webix_icon_btn mdi mdi-chart-areaspline btn-simple" style="max-width:32px;cursor: pointer"></span>`
            //` <span><button class="btn-simple">Graph</button></span>`;

            // get references to the elements we want
            this.eButton = this.eGui.querySelector('.btn-simple');
            // add event listener to button
            this.eventListener = () => displayShortStrangleOptionStrikeChart(params.data);
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
function ShortStrangleSparkLineColumn(obj) {
    if((obj.value + '').indexOf('.') > -1) {
      if((obj.value+'').split('.')[1].length > 2){
        return '₹'
      }
    }
    return ''
  }
let shortStrangleHistoryGridOptions = {
    rowHeight: 100,
    columnDefs: [
        { headerName: 'Year', field: "year", rowGroup: true, enableRowGroup: true, hide: true, rowGroupIndex: 0 },
        { headerName: 'Exp Date', field: "expiryDate", rowGroup: true, enableRowGroup: true, hide: true, rowGroupIndex: 1 },
        { headerName: 'Date', field: "date", rowGroup: true, enableRowGroup: true, hide: true, rowGroupIndex: 2 },
        {
            field: 'change',
            cellRenderer: 'agSparklineCellRenderer',
            minWidth: 350,
            cellRendererParams: {
              sparklineOptions: {
                type: 'column',
                fill: '#91cc75',
                stroke: '#91cc75',
                label: {
                  enabled: true, // show column labels
                  placement: 'outsideEnd',
                  fontWeight: 'bold',
                  color:'orange',
                  formatter: ShortStrangleSparkLineColumn
                },
                highlightStyle: {
                  fill: 'orange',
                },
                paddingInner: 0.3,
                paddingOuter: 0.1,
                tooltip: {
                  renderer: (params) => {
                    /*return {
                      title: params.xValue,
                      content: params.yValue.toFixed(1),
                      color: 'orange',
                      backgroundColor: 'rgb(78,78,255)',
                      opacity: 0.7,
                    };*/
                    let sp = params.context.data.strikePrice
                    let np = niftyObj[params.xValue][0]
                    let p = parseFloat(parseFloat((sp-np)/np * 100).toFixed(2))
                    let d1 = new Date(params.xValue)
                    let d2 = new Date(params.context.data.expiryDate)
                    let dte = (d2.getTime() - d1.getTime())/(24*60*60*1000)
                    return `<div class='ag-sparkline-tooltip'>
                    <div class='ag-sparkline-tooltip-title'>${params.xValue} &nbsp; ${parseFloat(sp-np).toFixed(0)}</div>
                    <div class='ag-sparkline-tooltip-content'>
                      <div>₹ : ${params.yValue.toFixed(1)} &nbsp; %: ${p}</div>
                      <div>DTE : ${dte}</div>
                    </div>
                </div>`;
                  },
                },
              },
            },
        },
        { headerName: 'PE', field: "pe", type: 'numericColumn', suppressMenu: true, width: 50},
        //{ headerName: 'PE Close', field: "pe_close", type: 'numericColumn', suppressMenu: true, width: 50},
        { headerName: '👍/🔻/₹', field: "result", filter: true, minWidth: 120 },
        { headerName: 'CE', field: "ce", type: 'numericColumn', suppressMenu: true, width: 50},
        //{ headerName: 'CE Close', field: "ce_close", type: 'numericColumn', suppressMenu: true, width: 50},
        { headerName: 'Strike Price', field: "strikePrice", filter: true },
        { headerName: 'Nifty CP', field: "niftyPrice", filter: true },
        //{ headerName: 'Chart', field: 'action', minWidth: 100, cellRenderer: ShortStrangleActionRenderer, suppressMenu: true },
    ],

    // default col def properties get applied to all columns
    defaultColDef: { resizable: true, flex: 1, minWidth: 120 },
    rowSelection: 'multiple', // allow rows to be selected
    animateRows: true, // have rows animate to new positions when sorted
    rowGroupPanelShow: 'always',
    autoGroupColumnDef: {
        filter: true,
        sortable: true,
        filterValueGetter: params => params.data.year,
        minWidth: 200,
        //headerName: 'Group',//custom header name for group
        pinned: 'left',//force pinned left. Does not work in columnDef
        cellRendererParams: {
            suppressCount: false,//remove number in Group Column
        }
    },
    onGridReady: (event) => {
        event.api.sizeColumnsToFit()
    },
    onRowGroupOpened: (event) => {
        //console.log('onRowGroupOpened ')
    },
    onFilterChanged: function () {
        //console.log('onFilterChanged')
        shortStrangleFilterResult()
    },
}

let shortstrangleResultData = []

function shortStrangleWindow() {
    shortStrangleHistoryGridOptions && delete shortStrangleHistoryGridOptions['api']
    shortstrangleResultData = []
    let edArr = expiryWisePercentage(generateExpiryDates().reverse())
    webix.ui({
        view: "window",
        id: "shortStrangleHistoryWindowId",
        fullscreen: true,
        head: {
            rows: [
                {
                    view: "toolbar", cols: [
                        {
                            view: "label", label: 'Short Strangle:', width: 125,
                        },
                        {
                            view: "text", id: 'pePer', value: '9', width: 140, label: 'PE %',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "text", id: 'peVal', value: '25', width: 140, label: 'Min PE Val',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "text", id: 'cePer', value: '8', width: 140, label: 'CE %',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "text", id: 'ceVal', value: '25', width: 140, label: 'Min CE Val',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "button", label: 'Calculate', align: 'right', width: 110, click: function () {
                                shortStrangleHistoryCheck()
                                shortStrangleFilterResult()
                            }
                        },
                        {
                            view: "combo", width: 210, labelWidth: 85, id: "expiryDateHistoryId",
                            label: 'Expiry Date:', placeholder: "Select Date", value:edArr[0].id,
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
                              }
                            }
                          },
                        { view: "button", label: 'X', width: 30, align: 'right', click: "$$('shortStrangleHistoryWindowId').destructor()" }
                    ]
                },
                { view: 'template', height: 35, id: 'shortStrangleAllHisTotalId', template: '' },
            ]
        }
        ,
        body: {
            cols: [
                {
                    view: 'template', id: 'shortStrategyHistoryId', template: '<div class="ag-theme-alpine" style="width:100%;height:100%;" id="shortStrangleHistoryagGrid"></div>'
                }
            ]
        },
        on: {
            onShow: function () {
                const eGridDiv = document.getElementById("shortStrangleHistoryagGrid");
                let option = new agGrid.Grid(eGridDiv, shortStrangleHistoryGridOptions);
                shortStrangleHistoryGridOptions.api.setRowData([])
            }
        }
    }).show();
}

async function shortStrangleHistoryCheck() {
    let resObj = []
    let edArr = expiryWisePercentage(generateExpiryDates().reverse())
    let edIdArr = edArr.map(obj => obj.id)
    if (edArr) {
        for (let f = 0; f < edArr.length; f++) {
            let dStr = edArr[f].id
            //dStr = "29-Jun-2023"
            let od = await getDataSyncOptionHistoryStore(dStr)
            let oData = Object.assign({}, od)
            delete oData['meta']

            let to = new Date(dStr)
            let from = new Date(to)

            from.setDate(1)
            from.setMonth(from.getMonth() - 2)
            from.setDate(from.getDate() - 1)
            while (from.toDateString().indexOf('Thu') != 0) {
                from.setDate(from.getDate() - 1)
            }
            from.setDate(from.getDate() + 1)
            from = new Date(from)
            let ScriptHistoryData = JSON.parse(localStorage.getItem('ScriptHistoryData'))
            let Nifty = ScriptHistoryData.NIFTY
            while (from.getTime() <= to.getTime()) {
                if (from.toDateString().indexOf('Sat') > -1 || from.toDateString().indexOf('Sun') > -1) {
                    from.setDate(from.getDate() + 1)
                } else {
                    let tempD = from.toDateString().split(' ')
                    let fromStr = (tempD[2].length == 1 ? '0' + tempD[2] : tempD[2]) + '-' + tempD[1] + '-' + tempD[3]

                    tempD = to.toDateString().split(' ')
                    let toStr = (tempD[2].length == 1 ? '0' + tempD[2] : tempD[2]) + '-' + tempD[1] + '-' + tempD[3]

                    let flag = false
                    let UV = 0
                    for (let s = 0; s < Nifty.length; s++) {
                        if (Nifty[s][0] === fromStr) {
                            UV = Nifty[s][4]
                            flag = true
                            break
                        }
                    }
                    if (flag == false) {
                        //console.log('No script data for the date ' + fromStr)
                        from.setDate(from.getDate() + 1)
                        continue
                    }
                    // PE --- (-9%) --- SP --- (+8%) --- CE
                    let pePerVal = $$('pePer').getValue() || 9
                    let pePer = (UV * pePerVal / 100)

                    let cePerVal = $$('cePer').getValue() || 9
                    let cePer = (UV * cePerVal / 100)

                    let peVal = UV - pePer
                    let ceVal = UV + cePer

                    let peMinVal = $$('peVal').getValue() || 25
                    let ceMinVal = $$('ceVal').getValue() || 25

                    let spArr = Object.keys(oData)

                    for (let i = 0; i < spArr.length; i++) {
                        let od = oData[spArr[i]]
                        let d = {
                            expiryDate: dStr,
                            strikePrice: spArr[i],
                            year: dStr.substring(7)
                        }
                        let change = []
                        if (spArr[i] >= ceVal) {
                            if (od.CE && od.CE.data) {
                                let ceData = od.CE.data
                                for (let c = 0; c < ceData.length; c++) {
                                    if (ceData[c][TIMESTAMP] === fromStr && ceData[c][CHANGE_IN_OI] > 1 && ceData[c][LAST_TRADED_PRICE] >= ceMinVal) {
                                        d.ce = ceData[c][LAST_TRADED_PRICE]
                                        d.date = ceData[c][TIMESTAMP]
                                        d.change = change
                                        ceData.forEach(d => {
                                            if(d[TIMESTAMP] == fromStr) {
                                              change.push([d[TIMESTAMP], parseFloat(parseFloat(d[LAST_TRADED_PRICE]).toFixed(2) + '01')])
                                            } else {
                                              change.push([d[TIMESTAMP], parseFloat(parseFloat(d[LAST_TRADED_PRICE]).toFixed(2))])
                                            }
                                          })
                                    }
                                    if (d.ce) {
                                        d.ce_close = ceData[c][LAST_TRADED_PRICE]
                                        if(edIdArr.slice(0,3).includes(dStr)) {
                                            d.result = '₹'
                                            d.niftyPrice = ceData[c][UNDERLYING_VALUE]
                                        } else if (d.ce - d.ce_close >= 0  && (d.strikePrice + d.ce) >= ceData[c][UNDERLYING_VALUE]) {
                                            d.result = '👍'
                                            d.niftyPrice = ceData[c][UNDERLYING_VALUE]
                                        } else {
                                            d.result = '🔻'
                                            d.niftyPrice = ceData[c][UNDERLYING_VALUE]
                                        }
                                    } else {
                                        d.result = '₹'
                                        d.niftyPrice = ceData[c][UNDERLYING_VALUE]
                                    }
                                }
                            }
                        }
                        
                        if (spArr[i] <= peVal) {
                            if (od.PE && od.PE.data) {
                                let peData = od.PE.data
                                for (let p = 0; p < peData.length; p++) {
                                    if (peData[p][TIMESTAMP] === fromStr && peData[p][CHANGE_IN_OI] > 1 && peData[p][LAST_TRADED_PRICE] >= peMinVal) {
                                        d.pe = peData[p][LAST_TRADED_PRICE]
                                        d.date = peData[p][TIMESTAMP]
                                        d.change = change
                                        peData.forEach(d => {
                                            if(d[TIMESTAMP] == fromStr) {
                                              change.push([d[TIMESTAMP], parseFloat(parseFloat(d[LAST_TRADED_PRICE]).toFixed(2) + '01')])
                                            } else {
                                              change.push([d[TIMESTAMP], parseFloat(parseFloat(d[LAST_TRADED_PRICE]).toFixed(2))])
                                            }
                                          })
                                    }
                                    if (d.pe) {
                                        d.pe_close = peData[p][LAST_TRADED_PRICE]
                                        if(edIdArr.slice(0,3).includes(dStr)) {
                                            d.result = '₹'
                                            d.niftyPrice = peData[p][UNDERLYING_VALUE]
                                        } else if (d.pe - d.pe_close >= 0 && (d.strikePrice - d.pe) <= peData[p][UNDERLYING_VALUE]) {
                                            d.result = '👍'
                                            d.niftyPrice = peData[p][UNDERLYING_VALUE]
                                        } else {
                                            d.result = '🔻'
                                            d.niftyPrice = peData[p][UNDERLYING_VALUE]
                                        }
                                    } else {
                                        d.result = '₹'
                                        d.niftyPrice = peData[p][UNDERLYING_VALUE]
                                    }
                                }
                            }
                        }
                        if (d.ce || d.pe) {
                            resObj.push(d)
                        }
                    }
                }
                from.setDate(from.getDate() + 1)
            }
        }

    }
    shortstrangleResultData = resObj
    shortStrangleHistoryGridOptions.api.setRowData(resObj)
    shortStrangleFilterResult()
    //console.table(resObj)
}

function shortStrangleFilterResult() {
    let win = 0
    let loss = 0
    let waiting = 0
    shortstrangleResultData.forEach(v => {
        if (v['result'] === '👍') {
            win++
        } else if (v['result'] === '🔻') {
            loss++
        } else {
            waiting++
        }
    })
    let h = 'Total Rows ' + shortstrangleResultData.length + ' : (👍-> ' + win +  ' , 🔻-> ' + loss + (waiting > 0 ? ' ,  ₹-> ' + waiting : '') + ')'
    let displayCount = shortStrangleHistoryGridOptions.api.getDisplayedRowCount()
    if (shortStrangleHistoryGridOptions.api.getDisplayedRowAtIndex(0) && shortStrangleHistoryGridOptions.api.getDisplayedRowAtIndex(0)['data'] === undefined) {
        let d = []
        for (let i = 0; i < displayCount; i++) {
            if (shortStrangleHistoryGridOptions.api.getDisplayedRowAtIndex(i)['data']) {
                d.push(shortStrangleHistoryGridOptions.api.getDisplayedRowAtIndex(i)['data'])
            } else if (shortStrangleHistoryGridOptions.api.getDisplayedRowAtIndex(i)['childrenAfterFilter']) {
                let leafChildren1 = shortStrangleHistoryGridOptions.api.getDisplayedRowAtIndex(i)['childrenAfterFilter']
                for (let j = 0; j < leafChildren1.length; j++) {
                    if (leafChildren1[j]['childrenAfterFilter']) {
                        let leafChildren2 = leafChildren1[j]['childrenAfterFilter']
                        for (let k = 0; k < leafChildren2.length; k++) {
                            if (leafChildren2[k]['childrenAfterFilter']) {
                                let leafChildren3 = leafChildren2[k]['childrenAfterFilter']
                                for (let l = 0; l < leafChildren3.length; l++) {
                                    if (leafChildren3[l]['data']) {
                                        d.push(leafChildren3[l]['data'])
                                    }
                                }
                            } else if (leafChildren2[k]['data']) {
                                d.push(leafChildren2[k]['data'])
                            }
                        }
                    } else if (leafChildren1[j]['data']) {
                        d.push(leafChildren1[j]['data'])
                    }
                }
            }
        }
        let win = 0
        let loss = 0
        let waiting = 0
        d.forEach(v => {
            if (v['result'] === '👍') {
                win++
            } else if (v['result'] === '🔻') {
                loss++
            } else {
                waiting++
            }
        })
        if (shortstrangleResultData.length != d.length) {
            h += ' , Filter Rows: ' + d.length + ' : (👍 -> ' + win + ' , 🔻 -> ' + loss + (waiting > 0 ? ' , ₹ -> ' + waiting : '') + ')'
        }
        $$('shortStrangleAllHisTotalId').setHTML(h)
    } else {
        $$('shortStrangleAllHisTotalId').setHTML(h)
    }
}

function displayShortStrangleOptionStrikeChart(cData) {
    //console.dir(cData)
    let sp = cData['strikePrice']
    let ed = cData['expiryDateOrg']
    let data = []
    for (let i = 0; i < allData.length; i++) {
        let obj = allData[i]
        let spData = obj[sp] && obj[sp]['PE']
        if (spData) {
            let meta = obj['meta']
            if (meta['expiryDate'] == ed) {
                data = [...spData['data']].reverse()
                break
            }
        }
    }
    let chartData = []
    for (let i = 0; i < data.length; i++) {
        if ((data[i][CHANGE_IN_OI] > 10 || data[i][CHANGE_IN_OI] < 0) && niftyObj[data[i][TIMESTAMP]]) {
            chartData.push({
                price: parseFloat(parseFloat(data[i][LAST_TRADED_PRICE]).toFixed(2)),
                date: data[i][TIMESTAMP].substring(0, 6),
                nifty: niftyObj[data[i][TIMESTAMP]][1]
            })
        }
    }

    let title = 'Expiry Date:' + ed + ' , Strike Price: ' + sp

    webix.ui({
        view: "window",
        id: "shortStrangleOptionChartId",
        fullscreen: true,
        head: {
            rows: [
                {
                    view: "toolbar", cols: [
                        {
                            view: "label", label: '', align: 'center', template: "<a target='_blank' href='https://nseindia.com/companytracker/cmtracker.jsp?symbol="
                                + '' + "&cName=cmtracker_nsedef.css'>  </a>"
                        },
                        { view: "button", label: 'X', width: 30, align: 'right', click: "$$('shortStrangleOptionChartId').destructor();" }
                    ]
                }
            ]
        }
        ,
        body: {
            cols: [
                {
                    view: 'template', id: 'shortStrangleOptionChartBodyId', template: '<div class="ag-theme-alpine" style="width:100%;height:100%;" id="shortStrangleOptionChartBodyDivId"></div>'
                },
            ]
        },
        on: {
            onShow: function () {
                displayShortStrangleOptionChart(chartData, title)
            }
        }
    }).show();
}

function displayShortStrangleOptionChart(data, title) {
    const options = {
        container: document.getElementById('shortStrangleOptionChartBodyDivId'),
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