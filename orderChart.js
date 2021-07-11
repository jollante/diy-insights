const typeBtnGroupClass = 'chart-type-btns';
const typeBtnClass = 'chart-type-btn';

/**
 * renders a chart with the given data and adds data grouping functionality
 *
 * @param {array} data
 * @param {string} canvasSelector - needs to be a valid css selector (eg. #myElement, .myElement, ...)
 */
function renderChart(data, canvasSelector, startDate, endDate, valueToDisplay) {
    if (!moment) {
        // console.error('MomentJS is not initialized.');
        return;
    }

    // check if the data provided is valid
    if (!Array.isArray(data) || !data.length) {
        // console.error('Can\'t render your chart as the provided data is not valid. Please provide an array of objects.');
        return;
    }

    // check if the canvas selector is valid and the dom element exists
    if (!canvasSelector || !document.querySelector(canvasSelector)) {
        // console.error('Can\'t render your chart as the canvas with your provided selector ' + canvasSelector + ' could not be found.');
        return;
    }

    // constants and variables
    valueToDisplay = valueToDisplay || 'menge';
    const monthNames = [
        'Jan',
        'Feb',
        'Mär',
        'Apr',
        'Mai',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Nov',
        'Dez'
    ];
    let chartInstance;
    let groupedOrdersBy;
    let chartElement = document.querySelector(canvasSelector);
    let activeView, currentViewValue;

    /**
     * initizalize the chart
     */
    return (function initChart() {
        let chartContext = chartElement.getContext('2d');

        // get all prepared data
        groupedOrdersBy = getGroupedOrders(data, startDate, endDate, valueToDisplay);

        // initial data do display
        activeView = groupedOrdersBy.months.length > 2 ? 'months' : 'days'
        let dataToDisplay = groupedOrdersBy[activeView];

        // fill underneath the courve
        let gradient = chartContext.createLinearGradient(0, 0, 0, 450);
        gradient.addColorStop(0, 'rgba(74, 191, 165, 0.8)');
        gradient.addColorStop(0.5, 'rgba(188, 224, 216, 0)');

        // colors
        let lineColor = '#4ABFA5';
        let pointColor = '#4ABFA5';
        let toolTipColor = '#4ABFA5';
        let pointBorderColor = '#BCE0D8';

        // chart configuration
        let dataConfiguration = {
            datasets: [{
                fill: true,
                backgroundColor: gradient,
                pointBackgroundColor: pointColor,
                borderColor: lineColor,
                data: dataToDisplay,
                tension: 0.25,
                pointRadius: dataToDisplay.length > 80 ? 3 : 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 4,
                pointHoverBorderColor: pointBorderColor
            }]
        };

        let chartConfiguration = {
            type: 'line',
            data: dataConfiguration,
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: { // defining min and max so hiding the dataset does not change scale range
                        min: 0,
                        grid: {
                            color: 'rgba(255,255,255,0.4)'
                        },
                    },
                    x: {
                        display: false
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: toolTipColor,
                        displayColors: false,
                        padding: 8,
                        intersect: false,
                        caretPadding: 4,
                        callbacks: {
                            label: function (context) {
                                var label = context.parsed.y || '';

                                if (valueToDisplay === 'nettoAuszahlung' || valueToDisplay === 'bruttoAuszahlung') {
                                    if (context.parsed.y !== null) {
                                        label = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                                    }
                                }

                                return label;
                            }
                        }
                    }
                }
            }
        };

        // initialize chart
        chartInstance = new Chart(
            chartContext,
            chartConfiguration
        );

        // create type buttons
        createTypeBtns(activeView);

        // bind chart events
        bindEvents();

        return chartInstance;
    })();

    /**
     * creates view switcher buttons and appends it to the parent
     * of the given canvas
     */
    function createTypeBtns(activeView) {
        let btnGroup = document.querySelector('.' + typeBtnGroupClass);

        if (btnGroup) {
            btnGroup.remove();
        }   

        let btnsWrapper = document.createElement('div');
        btnsWrapper.classList.add(typeBtnGroupClass);

        btnsWrapper.innerHTML = 
        '<button class="' + typeBtnClass + (valueToDisplay == 'menge' ? ' active' : '') + '" data-type="menge">Menge</button>' +
        '<button class="' + typeBtnClass + (valueToDisplay == 'nettoAuszahlung' ? ' active' : '') + '" data-type="nettoAuszahlung">Netto</button>' +
        '<button class="' + typeBtnClass + (valueToDisplay == 'bruttoAuszahlung' ? ' active' : '') + '" data-type="bruttoAuszahlung">Brutto</button>' +
        '<button class="' + typeBtnClass + (activeView == 'days' ? ' active' : '') + '" data-type="days">Tage</button>' +
        '<button class="' + typeBtnClass + (activeView == 'months' ? ' active' : '') + '" data-type="months">Monate</button>' +
        '<button class="' + typeBtnClass + (activeView == 'years' ? ' active' : '') + '" data-type="years">Jahre</button>';


        document.querySelector('.mi-chart-header').appendChild(btnsWrapper);
    }

    /**
     * binds all neeed events for chart functionality
     */
    function bindEvents() {
        // add type button (day, month, year) events and functionality
        let typeBtns = document.getElementsByClassName(typeBtnClass);

        if (typeBtns && chartInstance && groupedOrdersBy) {
            for (let i = 0; i < typeBtns.length; i++) {
                typeBtns[i].addEventListener('click', changeChartView);
            }
        }
    }

    /**
     * handler for changing the chart view (day, month, year)
     *
     * @param {object} e
     */
    function changeChartView(e) {
        let clickedBtn = e.target;
        let dataToDisplay = chartInstance.config.data.datasets[0].data;

        const type = clickedBtn.getAttribute('data-type');

        if (type === 'days' || type === 'months' || type === 'years') {
            setBtnActiveState(clickedBtn, activeView);
            activeView = type;
        } else {
            setBtnActiveState(clickedBtn, valueToDisplay);
            valueToDisplay = type;
        }

        chartInstance.config.data.datasets[0].data = getGroupedOrders(data, startDate, endDate, valueToDisplay)[activeView];
        chartInstance.config.data.datasets[0].pointRadius = dataToDisplay.length > 80 ? 3 : 4;
        chartInstance.config.data.labels = [];

        chartInstance.update();
    }
}

function setBtnActiveState(el, removeType) {
    document.querySelector('.' + typeBtnClass + '[data-type="' + removeType + '"]').classList.remove('active');
    el.classList.add('active');
}

/**
 * grouping and summarizing the proved array by days, months and years
 *
 * @param {array} data
 * @returns { days: [], months: [], years: []}
 */
function getGroupedOrders(data, startDate, endDate, valueToDisplay) {
    let groupedOrdersBy = {};
    let orderDaysObj = {};

    let days = [],
        months = [],
        years = [];

    const dateRange = enumerateDaysBetweenDays(startDate || data[data.length - 1].datum, endDate || data[0].datum);

    data.map(function (order) {
        let currentDate = moment(order.datum).format('DD.MM.YYYY');
        let value = order[valueToDisplay];

        if (orderDaysObj.hasOwnProperty(currentDate)) {
            value = orderDaysObj[currentDate] + order[valueToDisplay];
        }

        orderDaysObj[currentDate] = value;
    });

    dateRange.map(function (currentDate) {
        let date = moment(currentDate, 'DD.MM.YYYY'),
            timestamp = date.valueOf(),
            month = date.format('MM.YYYY'),
            year = date.year();

        let value = 0;

        if (orderDaysObj.hasOwnProperty(currentDate)) {
            value = orderDaysObj[currentDate]
        }

        days.push(
            [timestamp, value]
        );

        months.push(
            [month, value]
        );

        years.push(
            [year, value]
        );
    });

    if (days.length && months.length && years.length) {
        groupedOrdersBy['days'] = sumAndGroup(days).map((item) => {
            let newDate = moment(parseInt(item.x));

            return {
                x: newDate.format('DD.MM.YYYY'),
                y: item.y
            }
        });

        groupedOrdersBy['months'] = sumAndGroup(months);
        groupedOrdersBy['years'] = sumAndGroup(years);

        return groupedOrdersBy;
    }
}

/**
 * grouping, summarizing and sorting of proveded date array
 *
 * @param datesArray
 * @returns [{x: string, y: int|float}]
 */
function sumAndGroup(datesArray) {
    let summedAndGrouped = datesArray.reduce(function (prev, curr, idx, arr) {
        var sum = prev[curr[0]];
        prev[curr[0]] = sum ? sum + curr[1] : curr[1];
        return prev;
    }, []);

    summedAndGrouped = Object.entries(summedAndGrouped).map((e) => ({ x: e[0], y: e[1] }));
    summedAndGrouped.sort((a, b) => a.x - b.x);

    return summedAndGrouped;
}

function enumerateDaysBetweenDays(startDate, endDate) {
    let dates = [];
    startDate = moment(startDate, 'DD.MM.YYYY').subtract(1, 'days');
    endDate = moment(endDate, 'DD.MM.YYYY');

    while (startDate < endDate) {
        dates.push(startDate.add(1, 'days').format('DD.MM.YYYY'))
    }

    return dates;
}