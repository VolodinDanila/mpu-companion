import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.yandexApiKey
const GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/';
const OSRM_URL = 'https://router.project-osrm.org';

export const geocodeAddress = async (address) => {
    if (!address || !address.trim()) {
        throw new Error('не указан адрес');
    }

    console.log(`🗺️ геокодирую адрес: ${address}`);

    return {
        lon: 37.6173,
        lat: 55.7558,
        fullAddress: address,
    };
};

export const buildRoute = async (from, to, mode = 'transit') => {
    try {
        console.log('🗺️ ============ построение маршрута ============');
        console.log(`📍 откуда: ${typeof from === 'string' ? from : JSON.stringify(from)}`);
        console.log(`📍 куда: ${typeof to === 'string' ? to : JSON.stringify(to)}`);
        console.log(`🚌 режим транспорта: ${mode}`);

        let fromCoords = from;
        let toCoords = to;
        let fromAddress = typeof from === 'string' ? from : 'начальная точка';
        let toAddress = typeof to === 'string' ? to : 'конечная точка';

        if (typeof from === 'string') {
            const geocoded = await geocodeAddress(from);
            fromCoords = { lat: geocoded.lat, lon: geocoded.lon };
            fromAddress = geocoded.fullAddress || from;
        }

        if (typeof to === 'string') {
            const geocoded = await geocodeAddress(to);
            toCoords = { lat: geocoded.lat, lon: geocoded.lon };
            toAddress = geocoded.fullAddress || to;
        }

        const mapUrl = generateYandexMapUrl(fromCoords, toCoords, mode);
        console.log('🔗 ссылка на маршрут в яндекс.картах:');
        console.log(mapUrl);

        const routeData = getMockRouteData();
        routeData.mapUrl = mapUrl;
        routeData.fromAddress = fromAddress;
        routeData.toAddress = toAddress;

        console.log('✅ маршрут построен:');
        console.log(`   расстояние: ${routeData.distance} км`);
        console.log(`   время в пути: ${routeData.duration} мин`);
        console.log('🗺️ =========================================');

        return routeData;
    } catch (error) {
        console.error('❌ ошибка построения маршрута:', error);
        throw new Error('не удалось построить маршрут');
    }
};

const generateYandexMapUrl = (from, to, mode) => {
    const modeMap = {
        auto: 'auto',
        transit: 'mt',
        pedestrian: 'pd',
    };

    const rtt = modeMap[mode] || 'mt';
    return `https://yandex.ru/maps/?rtext=${from.lat},${from.lon}~${to.lat},${to.lon}&rtt=${rtt}`;
};

export const getMockRouteData = () => {
    return {
        distance: 12.5,
        duration: 35,
        mode: 'transit',
        departureTime: '08:25',
        arrivalTime: '09:00',
        steps: [],
    };
};