function onBodyLoad() {
    fetch("https://www.treasurydirect.gov/TA_WS/securities/announced?format=xhtml&type=FRN", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => {
            if (response.ok) {
                response.json().then(json => {
                    console.log(json);
                });
            }
        });
}
