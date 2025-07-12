let apiKey = "c6d942e824a59c3dac29e9a35962c3fd";
let isCelsius = true;

async function fetchWeather(city = null, coords = null) {
  const searchInput = city || document.getElementById("search").value.trim();
  const weatherDataSection = document.getElementById("weather-data");
  const forecastContainer = document.getElementById("forecast-container");
  const forecastEl = document.getElementById("forecast");
  const errorMessage = document.getElementById("error-message");
  errorMessage.textContent = "";

  if (!searchInput && !coords) {
    errorMessage.textContent = "Please enter a valid city name.";
    return;
  }

  try {
    let lat, lon;

    if (coords) {
      lat = coords.latitude;
      lon = coords.longitude;
    } else {
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchInput)}&limit=1&appid=${apiKey}`);
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error("City not found");
      lat = geoData[0].lat;
      lon = geoData[0].lon;
    }

    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const weather = await weatherRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const forecast = await forecastRes.json();

    const cityName = weather.name;
    const tempK = weather.main.temp;
    const feelsLikeK = weather.main.feels_like;
    const condition = weather.weather[0].main;


    const landmarkUrl = await getLandmarkImage(searchInput);
    const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString();
    const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString();
    const localTime = new Date((weather.dt + weather.timezone) * 1000).toUTCString();

    const temp = formatTemp(tempK);
    const feelsLike = formatTemp(feelsLikeK);

    weatherDataSection.style.display = "flex";
    weatherDataSection.innerHTML = `
      <img id="landmark-img" src="${landmarkUrl}" alt="${cityName} Landmark" />
      <div>
        <h2>${cityName}</h2>
        <p><strong>Local Time:</strong> ${localTime}</p>
        <p><strong>Temperature:</strong> ${temp}</p>
        <p><strong>Feels Like:</strong> ${feelsLike}</p>
        <p><strong>Humidity:</strong> ${weather.main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${weather.wind.speed} m/s</p>
        <p><strong>Sunrise:</strong> ${sunrise}</p>
        <p><strong>Sunset:</strong> ${sunset}</p>
        <p><strong>Condition:</strong> ${weather.weather[0].description}</p>
        <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}" target="_blank">Read more on Wikipedia</a>
      </div>
    `;

    forecastContainer.style.display = "block";
    forecastEl.innerHTML = "";

    const daily = {};
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' });
      if (!daily[date]) {
        daily[date] = item;
      }
    });

    for (let [day, item] of Object.entries(daily)) {
      const dayTemp = formatTemp(item.main.temp);
      forecastEl.innerHTML += `
        <div class="forecast-day">
          <strong>${day}</strong>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" />
          <p>${dayTemp}</p>
        </div>
      `;
    }

  } catch (err) {
    console.error(err);
    errorMessage.textContent = "Unable to fetch weather data. Please try again.";
  }
}

function toggleUnit() {
  isCelsius = !isCelsius;
  const city = document.getElementById("search").value.trim();
  if (city) fetchWeather(city);
}

function formatTemp(kelvin) {
  return isCelsius
    ? `${Math.round(kelvin - 273.15)}°C`
    : `${Math.round((kelvin - 273.15) * 9/5 + 32)}°F`;
}

function getWeatherBackground(condition) {
  const c = condition.toLowerCase();
  if (c.includes("sun")) return "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=1920&q=80";
  if (c.includes("cloud")) return "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1920&q=80";
  if (c.includes("rain")) return "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80";
  if (c.includes("snow")) return "https://images.unsplash.com/photo-1608889175112-7994c40179a3?auto=format&fit=crop&w=1920&q=80";
  if (c.includes("storm")) return "https://images.unsplash.com/photo-1606665843441-5c8989b743f5?auto=format&fit=crop&w=1920&q=80";
  if (c.includes("fog") || c.includes("mist")) return "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80";
  return "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1920&q=80";
}

async function getLandmarkImage(city) {
  const endpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${city}&piprop=original`;
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    const page = Object.values(data.query.pages)[0];
    return page?.original?.source || "https://upload.wikimedia.org/wikipedia/commons/6/6e/Weather_icon_-_sunny.svg";
  } catch {
    return "https://upload.wikimedia.org/wikipedia/commons/6/6e/Weather_icon_-_sunny.svg";
  }
}

// Geolocation Support
navigator.geolocation && document.getElementById("geo-btn").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeather(null, pos.coords),
    () => document.getElementById("error-message").textContent = "Unable to get your location."
  );
});
