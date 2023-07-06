const types = {
    'Treasury Bills': {
        website: 'https://www.treasurydirect.gov/marketable-securities/treasury-bills',
        minimumInvestment: 100,
        terms: [
            "1 month",
            "2 months",
            "3 months",
            "4 months",
            "6 months",
            "1 year"
        ]
    },
    'Treasury Notes': {
        website: 'https://www.treasurydirect.gov/marketable-securities/treasury-notes',
        minimumInvestment: 100,
        terms: [
            "2 years",
            "3 years",
            "5 years",
            "7 years",
            "10 years"
        ]
    },
    'Treasury Bonds': {
        website: 'https://www.treasurydirect.gov/marketable-securities/treasury-bonds',
        minimumInvestment: 100,
        terms: [
            "20 years",
            "30 years"
        ]
    }
};

function getInterestRateInput() {
    return document.getElementById('interestRateInput');
}

function getInterestRate(datum) {
    return datum['avg_interest_rate_amt'];
}

function getDescription(datum) {
    return datum['security_desc'];
}

function getType(datum) {
    const description = getDescription(datum);

    if (!(description in types)) {
        return {
            website: '#',
            minimumInvestment: 0
        };
    }

    return types[description];
}

function onBodyLoad() {
    fetch('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?fields=record_date,security_desc,avg_interest_rate_amt&sort=-record_date&format=json', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => {
            if (!response.ok) {
                return;
            }

            response.json().then(json => {
                if (!json.data.length) {
                    return;
                }

                let maxInterestRate = 0;
                let maxVisibleInterestRate = 0;
                let visited = {};

                for (let i = 0; i < json.data.length; i++) {
                    const datum = json.data[i];
                    const interestRate = getInterestRate(datum);

                    if (interestRate > maxInterestRate) {
                        maxInterestRate = interestRate;
                    }

                    const description = getDescription(datum);

                    if (description in types && !(description in visited) && interestRate > maxVisibleInterestRate) {
                        maxVisibleInterestRate = interestRate;
                    }

                    visited[description] = true;
                }

                visited = {};
                getInterestRateInput().value = maxVisibleInterestRate;

                const numberFormat = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                const dateFormat = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
                const recordDate = new Date(json.data[0]['record_date']);

                document.getElementById('todayLabel').innerText = dateFormat.format(Date.now());
                document.getElementById('recordDateLabel').innerText = dateFormat.format(recordDate);

                for (let i = 0; i < json.data.length; i++) {
                    const datum = json.data[i];
                    const description = getDescription(datum);

                    if (!(description in types) || description in visited) {
                        continue;
                    }

                    visited[description] = true;

                    const interestRate = getInterestRate(datum);
                    const type = getType(datum);

                    termList = `<ul>`;

                    for (let i = 0; i < type.terms.length; i++) {
                        termList += `<li>` + type.terms[i] + `</li>`;
                    }

                    let buttonClass = 'btn-light';

                    if (Math.abs(maxVisibleInterestRate - interestRate) <= 0.01) {
                        buttonClass = 'btn-primary';
                    }

                    termList += `</ul>`;
                    document.getElementById('tableBody').innerHTML += `
<tr>
    <td>${datum['security_desc']}</td>
    <td>                                
        <input type="range"
               class="form-range"
               disabled="disabled"
               value="${interestRate}"
               min="0"
               max="${maxInterestRate}"
               step="0.01" />
    </td>
    <td>${interestRate}%</td>
    <td>${numberFormat.format(type.minimumInvestment)}</td>
    <td>${termList}</td>
    <td>
        <a class="btn ${buttonClass}"
            href="${type.website}"
            role="button">Visit site</a>
    </td>
</tr>`;
                }
            });
        });

    update();
}

function update() {
    const parInput = document.getElementById('parInput');
    const par = Number(parInput.value).toFixed(2);
    const price = par * (1 - (getInterestRateInput().value * 182) / 36000);

    if (parInput.value != par) {
        parInput.value = par;
    }

    document.getElementById('priceInput').value = price.toFixed(2);
    document.getElementById('discountInput').value = (par - price).toFixed(2);
}
