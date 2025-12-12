const API_KEY = 'a1d630b7c5a9f87466a69d5038dadb96';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const fetchWeatherByCity = async (city) => {
    if (!city || !city.trim()) {
        throw new Error('не указан город');
    }

    try {
        console.log(`🌤️ запрашиваю погоду для города: ${city}`);

        return getMockWeatherData();
    } catch (error) {
        console.error('❌ ошибка получения погоды:', error.message);
        throw error;
    }
};

export const fetchWeatherByCoordinates = async (lat, lon) => {
    if (!lat || !lon) {
        throw new Error('не указаны координаты');
    }

    try {
        return getMockWeatherData();
    } catch (error) {
        console.error('ошибка получения погоды:', error);
        throw new Error('не удалось загрузить данные о погоде');
    }
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

    if (weather.rain > 0) {
        recommendations.push('Возьмите зонт — ожидается дождь');
    }

    if (weather.snow > 0) {
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