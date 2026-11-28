
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
let requestId = 0;


// 1. Get City Coordinates
async function getCoords(city) {
    const url = `${GEO_URL}?name=${city}&count=1`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Geocoding failed (status ${response.status})`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    const place = data.results[0];

    return {
        name: place.name,
        country: place.country,
        lat: place.latitude,
        lon: place.longitude,
    };
}


// 2. Get Weather Data
async function getWeather(lat, lon) {
    const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,surface_pressure,visibility,precipitation,weather_code`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Weather failed (status ${response.status})`);
    }

    const data = await response.json();

    return {
        temp: data.current.temperature_2m,
        wind: data.current.wind_speed_10m,
        humidity: data.current.relative_humidity_2m,
        pressure: data.current.surface_pressure,
        visibility: data.current.visibility,
        rain: data.current.precipitation,
        weather_code: data.current.weather_code,
    };
}

//get data of 5 day
async function getforcast(lat, lon) {
    const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=5`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Forecast failed (status ${response.status})`);
    }

    const data = await response.json();

    console.log(data);
    return data.daily;
}
function getWeatherDescription(code) {
    if (code == 0) {
        return "clear sky";
    }
    else if (code == 1) {
        return "Mainly Clear";
    }
    else if (code == 2) {
        return "Partly Cloudy";
    }
    else if (code == 3) {
        return "Overcast";
    }
    if (code == 45 || code == 48) {
        return "Fog";
    }
    if (code == 51) {
        return 'Light Drizzle';
    }
    else if (code == 53) {
        return 'Moderate Drizzle'
    }
    else if (code == 55) {
        return 'Dense Drizzle'
    }
    else if (code == 57 || code == 59) {
        return 'frizze drizzle'

    }
    else if (code == 61) {
        return 'low rain'
    }
    else if (code == 63) {
        return 'Moderate Rain'

    }
    else if (code == 65) {
        return 'Heavy Rain'

    }
    else if (code == 67 || code == 69) {
        return 'Freezing Rain'
    }
    else if (code == 71) {
        return "Slight Snowfall";
    }
    else if (code == 73) {
        return "Moderate Snowfall";
    }
    else if (code == 75) {
        return "Heavy Snowfall";
    }
    else if (code == 77) {
        return "Snow Grains";
    }
    else if (code == 80 || code == 81 || code == 82) {
        return "Rain Showers";
    }
    else if (code == 85 || code == 86) {
        return "Snow Showers";
    }
    else if (code == 95) {
        return "Thunderstorm";
    }
    else if (code == 96 || code == 99) {
        return "Thunderstorm with Hail";
    }
    else {
        return 'unknown weather'
    }

}

// 3. Select HTML Elements
const form = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const message = document.getElementById('message');
const card = document.getElementById('card');
const locationbtn = document.getElementById('locationBtn');
// 3. Initialize Map

const map = L.map('map').setView([18.5204, 73.8567], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 4. Display Disaster Alerts
function displayAlerts(alerts) {
    const container = document.getElementById('alertContainer');

    container.innerHTML = "";
    container.classList.remove('hidden');

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="alert-card">
                <h3>No Major Risk Detected</h3>
                <p>No major weather risk detected in the current conditions.</p>
            </div>
        `;
        return;
    }

    alerts.forEach(alert => {
        console.log(alert);

        const card = document.createElement('div');
        card.classList.add('alert-card');

        card.innerHTML = `
            <h3>${alert.event}</h3>
            <p>${alert.description}</p>
           
        `;

        container.appendChild(card);
    });
}


// 5. Generate Disaster Alerts
function generateAlerts(weather) {
    const alerts = [];

    // Temperature condition
    if (weather.temp >= 40) {
        alerts.push({
            event: 'High Temperature Alert',
            description: 'Temperature is very high. Stay hydrated!',
            alertLevel: "Critical"
        });
    }

    // Wind condition
    if (weather.wind >= 50) {
        alerts.push({
            event: 'Strong Wind Alert',
            description: 'Strong winds expected. Stay safe!',
            alertLevel: 'warning'
        });
    }

    // Rainfall condition
    if (weather.rain >= 10) {
        alerts.push({
            event: 'Heavy Rainfall Alert',
            description: 'Heavy rainfall detected. Stay alert!',
            alertLevel: 'warning'
        });
    }
    if ([95, 96, 99].includes(weather.weather_code)) {
        alerts.push({
            event: 'Thunderstorm Alert',
            description: 'Thunderstorm detected. Stay indoors and avoid open areas.',
            alertLevel: "Critical"
        })
    }

    return alerts;
}
function calculaterisk(alerts) {
    const riskcount = alerts.length;
    let risk;
    if (riskcount == 0) {
        return "";
    }
    else if (riskcount == 1) {
        risk = "low";
    }
    else if (riskcount == 2) {
        risk = "medium";
    }
    else if (riskcount == 3) {
        risk = "High";
    }
    else {
        risk = "Critical";
    }
    return risk;
}
//dispaly a weather of 5 day
function displayforcate(daily) {
    const vari = document.getElementById('forecast');

    vari.innerHTML = "";
    daily.time.forEach((date, index) => {
        const maxtemp = daily.temperature_2m_max[index];
        const mintemp = daily.temperature_2m_min[index];
        const rain = daily.precipitation_probability_max[index];
        const code = daily.weather_code[index]
        const description = getWeatherDescription(code);
        const div = document.createElement('div');
        div.classList.add('forecast-card');
        div.innerHTML = `
            <h3> ${date}</h3 >
            <p>Max Temperature: ${maxtemp}°C</p>
            <p>Min Temperature: ${mintemp}°C</p>
            <p>Rain Probability: ${rain}%</p>
            <p>Weather: ${description}</p>

        `;
        vari.appendChild(div);

    })
    console.log(vari);

}

// 6. Search Form Event Listener
form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const currentLocation = ++requestId;
    const city = cityInput.value.trim();

    if (city === '') {
        message.textContent = 'Type a city name';
        return;
    }

    message.textContent = 'Loading...';

    card.classList.add('hidden');

    try {
        const place = await getCoords(city);
        if (currentLocation !== requestId) return;
        if (place === null) {
            message.textContent = `No city called "${city}" 😕`;
            return;
        }
        map.setView([place.lat, place.lon], 10);
        const weather = await getWeather(place.lat, place.lon);
        if (currentLocation !== requestId) return;
        const weather1 = await getforcast(place.lat, place.lon);
        if (currentLocation !== requestId) return;
        displayforcate(weather1);
        // Generate and display alerts
        const alerts = generateAlerts(weather);

        displayAlerts(alerts);
        const risk = calculaterisk(alerts);
        document.getElementById('riskLevel').innerText = risk;
        const riskElement = document.getElementById('riskLevel');
        riskElement.innerText = risk;
        riskElement.classList.remove("low", "moderate", "high", "critical");
        if (risk) {
            riskElement.classList.add(risk.toLowerCase());
        }

        // Display Weather Information
        document.getElementById('place').textContent =
            `${place.name}, ${place.country} `;

        document.getElementById('temp').textContent = weather.temp;

        document.getElementById('windMetric').textContent = weather.wind;

        document.getElementById('humidity').textContent =
            weather.humidity + "%";

        document.getElementById('pressure').textContent =
            weather.pressure + " hPa";

        document.getElementById('visibility').textContent =
            (weather.visibility / 1000).toFixed(1) + ' km';

        document.getElementById('coords').textContent =
            `lat ${place.lat.toFixed(2)}, lon ${place.lon.toFixed(2)} `;

        message.textContent = '';

        card.classList.remove('hidden');

    } catch (error) {
        message.textContent =
            'Could not reach the weather service. Check your internet.';

        console.error(error);
    }

});

locationbtn.addEventListener('click', function () {

    const currentLocation = ++requestId;

    message.textContent = 'Getting your location...';
    card.classList.add('hidden');

    navigator.geolocation.getCurrentPosition(
        //This is a browser-provided Geolocation API.

        //It asks the browser to retrieve the user's current geographical coordinates.

        async function (position) {

            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const weather = await getWeather(lat, lon);

                if (currentLocation !== requestId) return;

                const daily = await getforcast(lat, lon);

                if (currentLocation !== requestId) return;

                // Display forecast
                displayforcate(daily);

                // Generate alerts
                const alerts = generateAlerts(weather);
                displayAlerts(alerts);

                // Calculate risk
                const risk = calculaterisk(alerts);
                const riskElement = document.getElementById('riskLevel');

                riskElement.innerText = risk || 'No Risk';
                riskElement.classList.remove(
                    'low', 'moderate', 'medium', 'high', 'critical'
                );

                if (risk) {
                    riskElement.classList.add(risk.toLowerCase());
                }

                // Update map
                map.setView([lat, lon], 10);

                // Display weather
                document.getElementById('place').textContent =
                    'Your Current Location';

                document.getElementById('temp').innerText = weather.temp;
                document.getElementById('windMetric').textContent = weather.wind;
                document.getElementById('humidity').textContent =
                    weather.humidity + '%';

                document.getElementById('pressure').textContent =
                    weather.pressure + ' hPa';

                document.getElementById('visibility').textContent =
                    (weather.visibility / 1000).toFixed(1) + ' km';

                document.getElementById('coords').textContent =
                    `lat ${lat.toFixed(2)}, lon ${lon.toFixed(2)}`;

                message.textContent = '';
                card.classList.remove('hidden');

            } catch (error) {
                if (currentLocation !== requestId) return;

                console.error(error);
                message.textContent = 'Unable to fetch weather data.';
            }
        },

        function (error) {
            if (currentLocation !== requestId) return;

            message.textContent = 'Unable to access your location. Please allow location permission.';
            console.error(error);
        }
    );
});

