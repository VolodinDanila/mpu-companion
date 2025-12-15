import { OPENWEATHER_API_KEY } from '@env';
const API_KEY = OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const fetchWeatherByCity = async (city) => {
    if (!city || !city.trim()) {
        throw new Error('не указан город');
    }

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        console.log('⚠️ api ключ погоды не настроен, используются mock данные');
        return getMockWeatherData();
    }

    const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`;

    try {
        console.log(`🌤️ запрашиваю погоду для города: ${city}`);
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('город не найден');
            }
            if (response.status === 401) {
                throw new Error('неверный api ключ');
            }
            throw new Error(`http error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ погода успешно загружена');
        return parseWeatherData(data);
    } catch (error) {
        console.error('❌ ошибка получения погоды:', error.message);
        console.log('⚠️ используются mock данные');
        return getMockWeatherData();
    }
};

export const fetchWeatherByCoordinates = async (lat, lon) => {
    if (!lat || !lon) {
        throw new Error('не указаны координаты');
    }

    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`http error! status: ${response.status}`);
        }

        const data = await response.json();
        return parseWeatherData(data);
    } catch (error) {
        console.error('ошибка получения погоды:', error);
        return getMockWeatherData();
    }
};

const parseWeatherData = (data) => {
    return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].description,
        conditionCode: data.weather[0].id,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        cloudiness: data.clouds.all,
        rain: data.rain ? data.rain['1h'] || data.rain['3h'] || 0 : 0,
        snow: data.snow ? data.snow['1h'] || data.snow['3h'] || 0 : 0,
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000),
        cityName: data.name,
    };
};

export const getWeatherRecommendations = (weather) => {
    const recommendations = [];

    if (weather.temperature < 0) {
        recommendations.push('Оденьтесь очень тепло — мороз');
    } else if (weather.temperature < 10) {
        recommendations.push(`Оденьтесь теплее — ${weather.temperature > 0 ? '+' : ''}${weather.temperature}°C`);
    } else if (weather.temperature > 25) {
        recommendations.push('Лёгкая одежда — будет жарко');
    }

    if (weather.rain > 0 || (weather.conditionCode >= 500 && weather.conditionCode < 600)) {
        recommendations.push('Возьмите зонт — ожидается дождь');
    }

    if (weather.snow > 0 || (weather.conditionCode >= 600 && weather.conditionCode < 700)) {
        recommendations.push('Будьте осторожны — снег на дорогах');
    }

    if (weather.windSpeed > 10) {
        recommendations.push('Сильный ветер — оденьтесь теплее');
    }

    if (weather.humidity > 80) {
        recommendations.push('Высокая влажность — возможна духота');
    }

    if (recommendations.length === 0) {
        recommendations.push('Хорошая погода для прогулки');
    }

    return recommendations;
};

export const getMockWeatherData = () => {
    return {
        temperature: 15,
        feelsLike: 13,
        condition: 'Облачно с прояснениями',
        conditionCode: 802,
        humidity: 65,
        pressure: 1013,
        windSpeed: 5,
        cloudiness: 40,
        rain: 0,
        snow: 0,
        sunrise: new Date(),
        sunset: new Date(),
        cityName: 'Москва',
    };
};