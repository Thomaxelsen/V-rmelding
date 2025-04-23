// Vent til hele HTML-dokumentet er lastet inn
document.addEventListener('DOMContentLoaded', () => {
    const locationElement = document.getElementById('location');
    const temperatureElement = document.getElementById('temperature');
    const descriptionElement = document.getElementById('description');
    const precipitationElement = document.getElementById('precipitation');
    const statusElement = document.getElementById('status');

    // --- VIKTIG: Erstatt med din egen OpenWeatherMap API-nøkkel ---
    const apiKey = 'DIN_OPENWEATHERMAP_API_NØKKEL';
    // ------------------------------------------------------------

    // Funksjon for å hente værdata fra OpenWeatherMap API
    function fetchWeather(lat, lon) {
        // Bruker 'weather' endepunktet for nåværende vær.
        // units=metric gir Celsius. lang=no gir norsk beskrivelse.
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=no`;

        statusElement.textContent = 'Henter værdata...';

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API-kall feilet med status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                updateUI(data);
                statusElement.textContent = ''; // Fjern statusmelding ved suksess
            })
            .catch(error => {
                console.error('Feil ved henting av værdata:', error);
                statusElement.textContent = `Kunne ikke hente værdata. ${error.message}. Sjekk API-nøkkel og nettverk.`;
                statusElement.className = 'status-message error';
            });
    }

    // Funksjon for å oppdatere brukergrensesnittet med værdata
    function updateUI(data) {
        if (!data || !data.main || !data.weather || !data.name) {
             console.error("Mottok ufullstendige data fra API:", data);
             statusElement.textContent = 'Mottok ufullstendige data fra væAPI.';
             statusElement.className = 'status-message error';
             return;
        }

        locationElement.textContent = data.name; // Stedsnavn fra API
        temperatureElement.textContent = data.main.temp.toFixed(1); // Temperatur med én desimal

        // Værbeskrivelse (f.eks. "lett regn", "overskyet")
        if (data.weather && data.weather.length > 0) {
            // Gjør første bokstav stor
            const desc = data.weather[0].description;
            descriptionElement.textContent = desc.charAt(0).toUpperCase() + desc.slice(1);
        } else {
            descriptionElement.textContent = 'Ingen beskrivelse';
        }

        // Nedbør (siste time). API-et gir dette i 'rain' eller 'snow' objektet.
        let precipitation = 0;
        if (data.rain && data.rain['1h']) {
            precipitation = data.rain['1h']; // Nedbør siste time i mm
        } else if (data.snow && data.snow['1h']) {
            precipitation = data.snow['1h']; // Snø siste time i mm (kan vises som nedbør)
        }
        precipitationElement.textContent = precipitation.toFixed(1); // Viser med én desimal
    }

    // Funksjon for å håndtere feil ved henting av posisjon
    function handleLocationError(error) {
        statusElement.className = 'status-message error';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                statusElement.textContent = "Du nektet forespørsel om posisjonsdeling.";
                break;
            case error.POSITION_UNAVAILABLE:
                statusElement.textContent = "Posisjonsinformasjon er utilgjengelig.";
                break;
            case error.TIMEOUT:
                statusElement.textContent = "Forespørsel om posisjonsdeling timet ut.";
                break;
            case error.UNKNOWN_ERROR:
                statusElement.textContent = "En ukjent feil oppstod ved henting av posisjon.";
                break;
        }
        // Fallback hvis posisjon feiler (kan f.eks. vise vær for Oslo)
        locationElement.textContent = "Posisjon ukjent";
        // fetchWeather(59.9139, 10.7522); // Eksempel: Hent vær for Oslo hvis posisjon feiler
    }

    // Sjekk om Geolocation API er støttet i nettleseren
    if ('geolocation' in navigator) {
        // Hent nåværende posisjon
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                statusElement.textContent = 'Posisjon funnet. Henter vær...';
                fetchWeather(latitude, longitude);
            },
            handleLocationError // Kall feilhåndteringsfunksjonen ved feil
        );
    } else {
        statusElement.textContent = 'Geolokasjon støttes ikke av nettleseren din.';
        statusElement.className = 'status-message error';
        locationElement.textContent = "Posisjon utilgjengelig";
        // fetchWeather(59.9139, 10.7522); // Eksempel: Hent vær for Oslo
    }
});
