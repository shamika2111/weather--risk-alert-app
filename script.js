
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';


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
    const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,surface_pressure,visibility,precipitation`;

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
        rain: data.current.precipitation
    };
}
async function getforcast(lat, lon) {
    const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=5`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`forcaste fail (status ${response.status}) `);
    }
    const data = await response.json();
    console.log(data);
    return data.daily;

}

// 3. Select HTML Elements
const form = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const message = document.getElementById('message');
const card = document.getElementById('card');


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
            description: 'Temperature is very high. Stay hydrated!'
        });
    }

    // Wind condition
    if (weather.wind >= 50) {
        alerts.push({
            event: 'Strong Wind Alert',
            description: 'Strong winds expected. Stay safe!'
        });
    }

    // Rainfall condition
    if (weather.rain >= 10) {
        alerts.push({
            event: 'Heavy Rainfall Alert',
            description: 'Heavy rainfall detected. Stay alert!'
        });
    }

    return alerts;
}
function displayforcate(daily) {
    const vari = document.getElementById('forecast');

    vari.innerHTML = "";
    daily.time.forEach((date, index) => {
        const maxtemp = daily.temperature_2m_max[index];
        const mintemp = daily.temperature_2m_min[index];
        const rain = daily.precipitation_probability_max[index];
        const code = daily.weather_code[index]
        const div = document.createElement('div');
        div.classList.add('forecast-card');
        div.innerHTML = `
            <h3> ${date}</h3 >
            <p>Max Temperature: ${maxtemp}°C</p>
            <p>Min Temperature: ${mintemp}°C</p>
            <p>Rain Probability: ${rain}%</p>
            <p>Weather Code: ${code}</p>
        `;
        vari.appendChild(div);

    })
    console.log(vari);

}

// 6. Search Form Event Listener
form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city === '') {
        message.textContent = 'Type a city name';
        return;
    }

    message.textContent = 'Loading...';

    card.classList.add('hidden');

    try {
        const place = await getCoords(city);

        if (place === null) {
            message.textContent = `No city called "${city}" 😕`;
            return;
        }

        const weather = await getWeather(place.lat, place.lon);
        const weather1 = await getforcast(place.lat, place.lon);
        displayforcate(weather1);
        // Generate and display alerts
        const alerts = generateAlerts(weather);

        displayAlerts(alerts);


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
