const browser = chrome || browser;

browser.runtime.onMessage.addListener(function (request) {
    if (location.search.length > 0 && location.search.indexOf('dataFilterUsed') === -1) {
        location.href = location.origin + location.pathname;
    } else {
        let loadMoreBtn = document.getElementById('load-more');
        let table = document.getElementById('sold-items-table-body');
        let minDate = document.getElementById('date_min');
        let maxDate = document.getElementById('date_max');
        let ebookFilter = document.getElementById('product');
        let ebookFilterEbookName = document.getElementById('select2-product-container');
        const filterBtn = document.getElementsByClassName('button')[1];
        const deleteFilterBtn = document.getElementById('clear-filters-button');
        let prozGrowthNetto;
        let prozGrowthBrutto;
        let growthTimePeriodStart;
        let growthTimePeriodEnd;
        let summeNetto;
        let summeBrutto;

        if (table) {
            if (request.message === 'tabUpdated') {
                location.href = location.href;
            }

            let topMengeEbook = document.getElementsByClassName('top-menge-ebook');
            let topMenge = document.getElementsByClassName('top-menge');
            let topAuszEbook = document.getElementsByClassName('top-ausz-ebook');
            let topAusz = document.getElementsByClassName('top-ausz');
            let rows = table.getElementsByTagName('tr');
            let orderData = {
                totalBestellungen: 0,
                totalOrders: 0,
                totalNetto: 0,
                totalBrutto: 0,
                orders: [],
                top5Menge: [],
                top5Auszahlung: []
            }
            let topListe = {};
            let chart;
            let loadMore;

            elementUebersicht();

            loadData();

            const nettoBtn = document.getElementsByClassName('top5-ausz-btn')[0];
            const bruttoBtn = document.getElementsByClassName('top5-ausz-btn')[1];

            function loadData() {
                loadMore = setInterval(function () {
                    if (loadMoreBtn && loadMoreBtn.style.display !== 'none') {
                        loadMoreBtn.click();
                    }
                    else {
                        clearInterval(loadMore);
                        initApplication();
                    }
                }
                    , 300)
            }

            function initApplication() {
                resetOrderData();
                if (chart) {
                    chart.destroy();
                }

                getOrderData();
                getTop5Liste();
                getTop5ListeAuszahlung();
                if (document.getElementById('date_min').value) {
                    getGrowth();
                    getTotalSales();
                }
                setUebersichtText();
                changeTableLinks();

                if (location.search.indexOf('dataFilterUsed') === -1 && !minDate.value && !maxDate.value && ebookFilter.value == '') {
                    localStorage.setItem('allSales', JSON.stringify(orderData.orders));
                }
            }

            function resetOrderData() {
                orderData = {
                    totalBestellungen: 0,
                    totalOrders: 0,
                    totalNetto: 0,
                    totalBrutto: 0,
                    orders: [],
                    top5Menge: [],
                    top5Auszahlung: []
                }
            }

            function getOrderData() {
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    getOrderDataByRow(row);
                }
            }

            function getOrderDataByRow(row) {
                let netto = convertStringToFloat(row.children[3].textContent);
                let brutto = convertStringToFloat(row.children[4].textContent);
                let einzelVerkauf = parseInt(row.children[2].textContent);
                let orderDate = parseDate(row.children[0].textContent);
                let order = {
                    datum: orderDate,
                    ebookName: row.querySelector('a').getAttribute('title').trim(),
                    menge: einzelVerkauf,
                    nettoAuszahlung: netto,
                    bruttoAuszahlung: brutto,
                }
                orderData.orders.push(order);
                orderData.totalOrders++;
                orderData.totalNetto += netto;
                orderData.totalBrutto += brutto;
                orderData.totalBestellungen += einzelVerkauf;
                getTopListe(order);
            }

            function getTopListe(order) {
                if (topListe.hasOwnProperty(order.ebookName)) {
                    topListe[order.ebookName].menge += order.menge;
                    topListe[order.ebookName].nettoAuszahlung += order.nettoAuszahlung;
                    topListe[order.ebookName].bruttoAuszahlung += order.bruttoAuszahlung;
                }
                else {
                    topListe[order.ebookName] = {
                        menge: order.menge,
                        nettoAuszahlung: order.nettoAuszahlung,
                        bruttoAuszahlung: order.bruttoAuszahlung,
                        name: order.ebookName
                    }
                }
            }

            function getTop5Liste() {
                let objectsTopListe = Object.keys(topListe);
                for (let i = 0; i < objectsTopListe.length; i++) {
                    let objectTopListe = topListe[objectsTopListe[i]];
                    orderData.top5Menge.push(objectTopListe);
                }
                orderData.top5Menge.sort(function (a, b) {
                    return b.menge - a.menge;
                })
            }

            function getTop5ListeAuszahlung() {
                let objectsTopListe = Object.keys(topListe);
                for (let i = 0; i < objectsTopListe.length; i++) {
                    let objectTopListe = topListe[objectsTopListe[i]];
                    orderData.top5Auszahlung.push(objectTopListe);

                }
                orderData.top5Auszahlung.sort(function (a, b) {
                    return b.nettoAuszahlung - a.nettoAuszahlung;
                })
            }

            function convertStringToFloat(moneystring) {
                moneystring = moneystring.replace(',', '.');
                moneystring = moneystring.replace('€', '');
                return parseFloat(moneystring);
            }

            function parseDate(input) {
                const parts = input.match(/(\d+)/g);
                // note parts[1]-1
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }

            function elementUebersicht() {

                let insightsWrapper = document.createElement('div');
                let auszahlungWrapper = document.createElement('div');
                let top5MengeWrapper = document.createElement('div');
                let top5AuszahlungsWrapper = document.createElement('div');

                insightsWrapper.classList.add('insights-wrapper');
                auszahlungWrapper.classList.add('d-flex-33', 'table-header');
                top5MengeWrapper.classList.add('d-flex-33', 'table-header');
                top5AuszahlungsWrapper.classList.add('d-flex-33', 'table-header');

                let posHeading1 = document.getElementsByClassName('sold-items-container')[0];
                let posHeading2 = document.getElementsByClassName('table-header')[1];
                posHeading1.insertBefore(insightsWrapper, posHeading2);

                insightsWrapper.appendChild(auszahlungWrapper);
                insightsWrapper.appendChild(top5MengeWrapper);
                insightsWrapper.appendChild(top5AuszahlungsWrapper);

                let hAuszahlung = document.createElement('h2');
                let hTop5Menge = document.createElement('h2');
                let hTop5Auszahlung = document.createElement('div');

                let hAuszahlungText = document.createTextNode('Auszahlungen');
                hAuszahlung.appendChild(hAuszahlungText);

                let hTop5MengeText = document.createTextNode('Top 5 - nach Menge');
                hTop5Menge.appendChild(hTop5MengeText);

                let blockAuszahlung = document.createElement('div');
                let blockTop5Menge = document.createElement('div');
                let blockTop5Auszahlung = document.createElement('div');

                blockAuszahlung.classList.add('insights-block', 'insights-block--flex');
                blockTop5Menge.classList.add('insights-block');
                blockTop5Auszahlung.classList.add('insights-block');

                blockAuszahlung.innerHTML =
                    '<div class="block-p"><div class="mi-netto-growth"><span id="netto-summe" class="block-summe">Lädt...</span><span class="mi-growth"></span></div>Summe Netto</div><div class="block-p"><div class="mi-netto-growth"><span id="brutto-summe" class="block-summe">Lädt...</span><span class="mi-growth"></span></div>Summe Brutto</div>';
                blockTop5Menge.innerHTML =
                    '<div class="inline-div"><span class="top-menge-ebook ellipsis">Wird geladen</span><span class="top-menge bold-number"><span></span></div><div class="inline-div"><span class="top-menge-ebook ellipsis">Wird geladen</span><span class="top-menge bold-number"><span></span></div><div class="inline-div"><span class="top-menge-ebook ellipsis">Wird geladen</span><span class="top-menge bold-number"><span></span></div><div class="inline-div"><span class="top-menge-ebook ellipsis">Wird geladen</span><span class="top-menge bold-number"><span></span></div><div class="inline-div"><span class="top-menge-ebook ellipsis">Wird geladen</span><span class="top-menge bold-number"><span></span></div>'
                blockTop5Auszahlung.innerHTML =
                    '<div class="inline-div"><span class="top-ausz-ebook ellipsis">Wird geladen</span><span class="top-ausz bold-number"><span></span></div><div class="inline-div"><span class="top-ausz-ebook ellipsis">Wird geladen</span><span class="top-ausz bold-number"><span></span></div><div class="inline-div"><span class="top-ausz-ebook ellipsis">Wird geladen</span><span class="top-ausz bold-number"><span></span></div><div class="inline-div"><span class="top-ausz-ebook ellipsis">Wird geladen</span><span class="top-ausz bold-number"><span></span></div><div class="inline-div"><span class="top-ausz-ebook ellipsis">Wird geladen</span><span class="top-ausz bold-number"><span></span></div>'

                auszahlungWrapper.appendChild(hAuszahlung);
                auszahlungWrapper.appendChild(blockAuszahlung);
                top5MengeWrapper.appendChild(hTop5Menge);
                top5MengeWrapper.appendChild(blockTop5Menge);
                top5AuszahlungsWrapper.appendChild(hTop5Auszahlung);
                top5AuszahlungsWrapper.appendChild(blockTop5Auszahlung);

                hTop5Auszahlung.innerHTML = '<div class="top-5-ausz-wrapper"><h2>Top 5 - nach Ausz.</h2><div class="top5-ausz-btns"><button class="top5-ausz-btn active">Netto</button><button class="top5-ausz-btn">Brutto</button></div></div>'

                let growthTime = document.createElement('div');
                growthTime.setAttribute('id', 'growth-time');
                posHeading1.insertBefore(growthTime, posHeading2);


                let chartWrapper = document.createElement('div');
                chartWrapper.setAttribute('id', 'chart-wrapper');
                chartWrapper.setAttribute('class', 'table-header');
                posHeading1.insertBefore(chartWrapper, posHeading2);

                chartWrapper.innerHTML = '<div class="mi-chart-header"><h2>Verkäufe im Zeitverlauf</h2></div><div class="canvas-wrapper"><canvas id="chart-canvas"></canvas></div>'
            }

            function setUebersichtText() {

                if (minDate.value && ebookFilter.value == '') {
                    let nettoText = document.getElementById('netto-summe');
                    nettoText.textContent = summeNetto.toFixed(2) + ' €';
                    let bruttoText = document.getElementById('brutto-summe');
                    bruttoText.textContent = summeBrutto.toFixed(2) + ' €';
                }
                else {
                    let nettoText = document.getElementById('netto-summe');
                    nettoText.textContent = orderData.totalNetto.toFixed(2) + ' €';
                    let bruttoText = document.getElementById('brutto-summe');
                    bruttoText.textContent = orderData.totalBrutto.toFixed(2) + ' €';
                }

                let nettoGrowthSpan = document.getElementsByClassName('mi-growth')[0];
                let bruttoGrowthSpan = document.getElementsByClassName('mi-growth')[1];
                let growthTimeText = document.getElementById('growth-time');

                for (let i = 0; i < 5; i++) {
                    if (orderData.top5Menge[i]) {
                        topMengeEbook[i].textContent = i + 1 + '. ' + orderData.top5Menge[i].name;
                        topMenge[i].textContent = orderData.top5Menge[i].menge;
                    }

                    if (orderData.top5Auszahlung[i]) {
                        topAuszEbook[i].textContent = i + 1 + '. ' + orderData.top5Auszahlung[i].name;
                        topAusz[i].textContent = orderData.top5Auszahlung[i].nettoAuszahlung.toFixed(2) + ' €';
                    }
                }

                chart = renderChart(orderData.orders, '#chart-canvas', minDate.value, maxDate.value, 'nettoAuszahlung');

                if (prozGrowthNetto != undefined && prozGrowthBrutto != undefined) {

                    if (isNaN(prozGrowthNetto)) {
                        nettoGrowthSpan.textContent = '';
                        bruttoGrowthSpan.textContent = '';
                        growthTimeText.textContent = '';
                    }
                    if (prozGrowthNetto >= 0) {
                        nettoGrowthSpan.style.color = 'rgb(4 132 116)';
                        nettoGrowthSpan.textContent = '+ ' + prozGrowthNetto + '%*';
                        bruttoGrowthSpan.style.color = 'rgb(4 132 116)';
                        bruttoGrowthSpan.textContent = '+ ' + prozGrowthBrutto + '%*';
                        growthTimeText.textContent = '*Im Vergleich zum vorherigen Zeitraum (' + moment(growthTimePeriodStart).format('DD.MM.YYYY') + ' - ' + moment(growthTimePeriodEnd).format('DD.MM.YYYY') + ')';
                        if (prozGrowthNetto > 1000) {
                            nettoGrowthSpan.style.fontSize = '18px';
                            bruttoGrowthSpan.style.fontSize = '18px';
                        }
                        else {
                            nettoGrowthSpan.style.fontSize = '22px';
                            bruttoGrowthSpan.style.fontSize = '22px';
                        }
                    }
                    if (prozGrowthNetto < 0) {
                        nettoGrowthSpan.style.color = 'red';
                        nettoGrowthSpan.textContent = '- ' + Math.abs(prozGrowthNetto) + '%*';
                        bruttoGrowthSpan.style.color = 'red';
                        bruttoGrowthSpan.textContent = '- ' + Math.abs(prozGrowthBrutto) + '%*';
                        growthTimeText.textContent = '*Im Vergleich zum vorherigen Zeitraum ( ' + moment(growthTimePeriodStart).format('DD.MM.YYYY') + ' - ' + moment(growthTimePeriodEnd).format('DD.MM.YYYY') + ')';
                        if (prozGrowthNetto > 1000) {
                            nettoGrowthSpan.style.fontSize = '18px';
                            bruttoGrowthSpan.style.fontSize = '18px';
                        }
                        else {
                            nettoGrowthSpan.style.fontSize = '22px';
                            bruttoGrowthSpan.style.fontSize = '22px';
                        }
                    }
                }
            }

            deleteFilterBtn.onclick = function (event) {
                event.preventDefault();
                location.href = location.origin + location.pathname;
            }

            filterBtn.onclick = function () {
                clearArray();
                clearTopListe();
                clearUebersichtText();
                if (chart) {
                    chart.destroy();
                }
                mutationObserver();
            }

            function mutationObserver() {
                let mutationTarget = document.querySelector('.total-sales-count').parentElement;
                var observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (mutation.addedNodes[0].getAttribute('class').indexOf('total-sales-count') !== -1) {
                            observer.disconnect();
                            changeTableLinks();
                            loadData();
                        }
                    });
                });

                var config = { childList: true, characterData: true };

                observer.observe(mutationTarget, config);
            }

            function clearArray() {
                orderData = {
                    totalBestellungen: 0,
                    totalOrders: 0,
                    totalNetto: 0,
                    totalBrutto: 0,
                    orders: [],
                    top5Menge: [],
                    top5Auszahlung: []
                }
            }

            function clearTopListe() {
                topListe = {};
            }

            function clearUebersichtText() {
                for (let i = 0; i < 5; i++) {
                    topMengeEbook[i].textContent = '';
                    topMenge[i].textContent = '';
                    topAuszEbook[i].textContent = '';
                    topAusz[i].textContent = '';
                }
            }

            nettoBtn.onclick = function () {
                nettoBtn.classList.add('active');
                bruttoBtn.classList.remove('active');
                for (let i = 0; i < 5; i++) {
                    if (orderData.top5Auszahlung[i]) {
                        topAuszEbook[i].textContent = i + 1 + '. ' + orderData.top5Auszahlung[i].name;
                        topAusz[i].textContent = orderData.top5Auszahlung[i].nettoAuszahlung.toFixed(2) + ' €';
                    }
                }
                if (bruttoBtn.hasAttribute('active')) {

                }
            }

            bruttoBtn.onclick = function () {
                bruttoBtn.classList.add('active');
                nettoBtn.classList.remove('active');
                for (let i = 0; i < 5; i++) {
                    if (orderData.top5Auszahlung[i]) {
                        topAuszEbook[i].textContent = i + 1 + '. ' + orderData.top5Auszahlung[i].name;
                        topAusz[i].textContent = orderData.top5Auszahlung[i].bruttoAuszahlung.toFixed(2) + ' €';
                    }
                }
            }

            function changeTableLinks() {
                let links = document.querySelectorAll('th a');
                for (let i = 0; i < links.length; i++) {
                    let link = links[i];
                    let oldHref = link.getAttribute('href');
                    link.setAttribute('href', oldHref + '?dataFilterUsed')

                }
            }

            function getDiffDays(startDate, endDate) {
                return endDate.diff(startDate, 'days')
            }

            function getNewDate(oldDate, diff) {
                return oldDate.clone().subtract(diff, 'days');
            }

            function getGrowth() {
                let allSales = JSON.parse(localStorage.getItem("allSales"));
                let summeNetto = 0;
                let summeBrutto = 0;
                let momentMinDate = moment(minDate.value, 'DD.MM.YYYY');
                let momentMaxDate = moment(maxDate.value, 'DD.MM.YYYY');
                let dayDiff = getDiffDays(momentMinDate, momentMaxDate) + 2;
                let startDate = getNewDate(momentMinDate, dayDiff);
                let endDate = momentMinDate;
                growthTimePeriodStart = getNewDate(momentMinDate, dayDiff - 1);
                growthTimePeriodEnd = getNewDate(momentMinDate, +1);


                for (let i = 0; i < allSales.length; i++) {
                    if (moment(allSales[i].datum).isBetween(moment(startDate), moment(endDate))) {
                        if (ebookFilter.value == '') {
                            let netto = allSales[i].nettoAuszahlung;
                            summeNetto += netto;
                            let brutto = allSales[i].bruttoAuszahlung;
                            summeBrutto += brutto;
                        }
                        else {
                            if (ebookFilterEbookName.title == allSales[i].ebookName) {
                                let netto = allSales[i].nettoAuszahlung;
                                summeNetto += netto;
                                let brutto = allSales[i].bruttoAuszahlung;
                                summeBrutto += brutto;
                            }
                        }
                    }
                }

                prozGrowthNetto = parseInt(((orderData.totalNetto - summeNetto) / summeNetto) * 100);
                prozGrowthBrutto = parseInt(((orderData.totalBrutto - summeBrutto) / summeBrutto) * 100);
            }

            // get total brutto and total netto from local storage if filter btn is used (data from table can be unprecise if you simultaneously use the sort options)

            function getTotalSales() {
                summeNetto = 0;
                summeBrutto = 0;
                let allSales = JSON.parse(localStorage.getItem("allSales"));
                let momentMinDate = moment(minDate.value, 'DD.MM.YYYY');
                let momentMaxDate = moment(maxDate.value, 'DD.MM.YYYY');
                let startDate = getNewDate(momentMinDate, 1);
                let endDate = getNewDate(momentMaxDate, -1);

                for (let i = 0; i < allSales.length; i++) {
                    if (moment(allSales[i].datum).isBetween(moment(startDate), moment(endDate))) {
                        let netto = allSales[i].nettoAuszahlung;
                        summeNetto += netto;
                        let brutto = allSales[i].bruttoAuszahlung;
                        summeBrutto += brutto;
                    }
                }
            }
        }
    }
});