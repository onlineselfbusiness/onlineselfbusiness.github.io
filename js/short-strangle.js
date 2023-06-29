let shortStrangleHistoryGridOptions = {
    columnDefs: [
        { headerName: 'Exp Date', field: "expiryDate", rowGroup: true, enableRowGroup: true, hide: true, rowGroupIndex: 0 },
        { headerName: 'Date', field: "date", rowGroup: true, enableRowGroup: true, hide: true, rowGroupIndex: 1 },
        { headerName: 'Strike Price', field: "strikePrice", filter: true },
        { headerName: 'PE', field: "pe", type: 'numericColumn', sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'PE Close', field: "pe_close", type: 'numericColumn', sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: '👍/🔻/₹', minWidth: 130, field: "result", filter: true },
        { headerName: 'CE', field: "ce", type: 'numericColumn', sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'CE Close', field: "ce_close", type: 'numericColumn', sortable: true, filter: 'agNumberColumnFilter' },
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
};

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
                            view: "label", label: 'Short Strangle:', width: 150,
                        },
                        {
                            view: "text", id: 'pePer', value: '9', width: 150, label: 'PE %',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "text", id: 'peVal', value: '25', width: 150, label: 'Min PE Val',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "text", id: 'cePer', value: '7', width: 150, label: 'CE %',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "text", id: 'ceVal', value: '25', width: 150, label: 'Min CE Val',
                            on: {
                                onChange: function (newValue, oldValue, config) {

                                }
                            }
                        },
                        {
                            view: "button", label: 'Calculate', align: 'right', click: function () {
                                shortStrangleHistoryCheck()
                                shortStrangleFilterResult()
                            }
                        },
                        {},
                        { view: "button", label: 'X', width: 30, align: 'right', click: "$$('shortStrangleHistoryWindowId').destructor()" }
                    ]
                },
                { view:'template', height: 35, id: 'shortStrangleAllHisTotalId', template: ''},
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
    //dStr = "27-Apr-2023"
    let edArr = expiryWisePercentage(generateExpiryDates().reverse())
    if (edArr) {
        for (let d = 0; d < edArr.length; d++) {
            let dStr = edArr[d].id
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
                    // PE --- (9%) --- SP --- (+7%) --- CE
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

                        }
                        if (spArr[i] >= ceVal) {
                            if (od.CE && od.CE.data) {
                                let ceData = od.CE.data
                                for (let c = 0; c < ceData.length; c++) {
                                    if (ceData[c][TIMESTAMP] === fromStr && ceData[c][LAST_TRADED_PRICE] >= ceMinVal) {
                                        d.ce = ceData[c][LAST_TRADED_PRICE]
                                        d.date = ceData[c][TIMESTAMP]
                                    }
                                    if (ceData[c][TIMESTAMP] === toStr) {
                                        if (d.ce) {
                                            d.ce_close = ceData[c][LAST_TRADED_PRICE]
                                            if (d.ce - d.ce_close >= 0) {
                                                d.result = '👍'
                                            } else {
                                                d.result = '🔻'
                                            }
                                        }
                                    } else {
                                        d.result = '₹'
                                    }
                                }
                            }
                        }

                        if (spArr[i] <= peVal) {
                            if (od.PE && od.PE.data) {
                                let peData = od.PE.data
                                for (let p = 0; p < peData.length; p++) {
                                    if (peData[p][TIMESTAMP] === fromStr && peData[p][LAST_TRADED_PRICE] >= peMinVal) {
                                        d.pe = peData[p][LAST_TRADED_PRICE]
                                        d.date = peData[p][TIMESTAMP]
                                    }

                                    if (peData[p][TIMESTAMP] === toStr) {
                                        if (d.pe) {
                                            d.pe_close = peData[p][LAST_TRADED_PRICE]
                                            if (d.pe - d.pe_close >= 0) {
                                                d.result = '👍'
                                            } else {
                                                d.result = '🔻'
                                            }
                                        }
                                    } else {
                                        d.result = '₹'
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
    let h = 'Total Rows ' + shortstrangleResultData.length + ' : (' + win + ' 👍' + ' / ' + loss + ' 🔻' + (waiting > 0 ? ' / ' + waiting + ' ₹ : ' : '') + ')'
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
            h += ' , Filter Rows: ' + d.length + ' : (' + win + ' 👍' + ' / ' + loss + ' 🔻' + (waiting > 0 ? ' / ' + waiting + ' ₹ : ' : '') + ')'
        }
        $$('shortStrangleAllHisTotalId').setHTML(h)
    } else {
        $$('shortStrangleAllHisTotalId').setHTML(h)
    }
}