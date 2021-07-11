webix.ready(function () {


    webix.ui(
        {
            rows: [
                {},
                {view: 'label', label: 'HDFCBANK', align: 'center'},
                {
                    view:"calendar",
                    id:"my_calendar",
                    date:new Date(2021,5,23),
                    calendarHeader: "%F, %Y",
                    weekHeader:true,
                    
                    events:webix.Date.isHoliday,
                    width:700,
                    height:550,
                    align: 'center',
                    borderless: false,
                    dayTemplate: function(date){
                        console.dir(date)
                        var html = "<div>"+date.getDate()+"</div>";
                        if(date.getDay() === 5){
                            html += "<div class='day_marker'></div>";
                        }
                        return html;
                    },
                    
                },
                {},
            ]
        }
    )

})


