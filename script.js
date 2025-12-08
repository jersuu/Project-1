const apiKey = "710fa3da576bf003ef269430f67d1378"; 
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");

const cityName = document.getElementById("cityName");
const description = document.getElementById("description");
const temp = document.getElementById("temp");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherCard = document.getElementById("weatherCard");

const citiesList = document.getElementById("citiesList");
const clearBtn = document.getElementById('clearCities');
const weatherIcon = document.getElementById('weatherIcon');
const loader = document.getElementById('loader');
const messageEl = document.getElementById('message');

let savedCities = JSON.parse(localStorage.getItem("cities")) || [];

function updateSavedCities() {
    citiesList.innerHTML = "";
    savedCities.forEach(city => {
        const li = document.createElement("li");
        const name = document.createElement('span');
        name.textContent = city;
        name.onclick = () => fetchWeather(city);
        const del = document.createElement('button');
        del.textContent = '✕';
        del.title = 'Remove';
        del.onclick = (e) => { e.stopPropagation(); removeSavedCity(city); };
        li.appendChild(name);
        li.appendChild(del);
        citiesList.appendChild(li);
    });
}

function saveCity(city) {
    if (!savedCities.includes(city)) {
        savedCities.push(city);
        localStorage.setItem("cities", JSON.stringify(savedCities));
        updateSavedCities();
    }
}

function removeSavedCity(city) {
    savedCities = savedCities.filter(c => c !== city);
    localStorage.setItem('cities', JSON.stringify(savedCities));
    updateSavedCities();
}

if (clearBtn) clearBtn.addEventListener('click', () => {
    if (!confirm('Clear all saved cities?')) return;
    savedCities = [];
    localStorage.removeItem('cities');
    updateSavedCities();
});

async function fetchWeather(city) {
    try {
        messageEl.textContent = '';
        loader.classList.remove('hidden');
        weatherIcon.classList.add('hidden');

        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
        );
        const data = await res.json();
        loader.classList.add('hidden');

        if (res.ok && Number(data.cod) === 200) {
            cityName.textContent = data.name;
            description.textContent = data.weather[0].description;
            temp.textContent = Math.round(data.main.temp);
            humidity.textContent = data.main.humidity;
            wind.textContent = data.wind.speed;
            weatherCard.classList.remove("hidden");
            saveCity(data.name);

            if (data.weather && data.weather[0] && data.weather[0].icon) {
                weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                weatherIcon.classList.remove('hidden');
            }
            
            // Fetch 5-day forecast
            fetchForecast(data.coord.lat, data.coord.lon);
        } else {
            const msg = data && data.message ? data.message : "City not found";
            messageEl.textContent = msg.charAt(0).toUpperCase() + msg.slice(1);
        }
    } catch (err) {
        console.error(err);
        loader.classList.add('hidden');
        messageEl.textContent = 'Error fetching weather data';
    }
}

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
});

async function fetchForecast(lat, lon) {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        const data = await res.json();
        
        if (res.ok && data.list) {
            // Group by day (take one forecast per day at noon)
            const dailyForecasts = {};
            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                // Keep forecast closest to noon (12:00)
                if (!dailyForecasts[day] || Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyForecasts[day].dt * 1000).getHours() - 12)) {
                    dailyForecasts[day] = item;
                }
            });
            
            // Render forecast
            const forecastContainer = document.getElementById('forecastContainer');
            forecastContainer.innerHTML = '';
            
            Object.entries(dailyForecasts).slice(0, 5).forEach(([day, item]) => {
                const div = document.createElement('div');
                div.className = 'forecast-day';
                const icon = item.weather[0].icon;
                const temp_min = Math.round(item.main.temp_min);
                const temp_max = Math.round(item.main.temp_max);
                const desc = item.weather[0].main;
                
                div.innerHTML = `
                    <div class="date">${day}</div>
                    <div class="icon"><img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" style="width:40px;height:40px"></div>
                    <div class="temp">${temp_min}°-${temp_max}°</div>
                    <div class="desc">${desc}</div>
                `;
                forecastContainer.appendChild(div);
            });
        }
    } catch (err) {
        console.error('Forecast error:', err);
    }
}

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeather(city);
    }
});

updateSavedCities();

cityInput.focus();
