const markers = [];

const haversine = (a, b) => {
  if (!(a?.lat && a?.lng && b?.lat && b?.lng)) {
    return 0;
  }
  const R = 6371e3; // Earth radius in meters
  const φ1 = (a.lat * Math.PI) / 180; // φ, λ in radians
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const a1 =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));

  const d = R * c; // in metres
  return d;
};

function requestFoodBankData() {
  const searchResults = [];
  const { lng, lat } = map.getCenter();
  const bounds = map.getBounds();
  const radius = haversine(bounds._ne, bounds._sw) * 1.5;


  fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `
        [out:json];
        (
            node["social_facility"="food_bank"](around:${radius}, ${lat}, ${lng});
            way["social_facility"="food_bank"](around:${radius}, ${lat}, ${lng});
            relation["social_facility"="food_bank"](around:${radius}, ${lat}, ${lng});
        );
        out meta;
    `,
  })
    .then((response) => response.json())
    .then((data) => {
      markers.forEach(marker => {
        marker.remove();
      })

      const userLocation = map.getCenter();
      data.elements.forEach((element) => {
        if (element.type === 'node' && element.lat && element.lon) {
          const name = element.tags['name'] || 'Food Pantry';
          const location = [element.lon, element.lat];
          const address = [
            element.tags['addr:housenumber'],
            element.tags['addr:street'],
            element.tags['addr:city'],
            element.tags['addr:state'],
            element.tags['addr:postcode'],
          ]
            .filter(Boolean)
            .join(' ');

          const foodBankLocation = new mapboxgl.LngLat(element.lon, element.lat);

          // Display all data points on the map
          const qs = new URLSearchParams({
            daddr: `${element.lat},${element.lon}`,
            saddr: 'Current Location',
            dirflg: 'd',
          });

          const directionsUrl = `http://maps.apple.com/?${qs.toString()}`;

          const marker = new mapboxgl.Marker({
            color: '#264a27',
          })
            .setLngLat([element.lon, element.lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
              <h3>${name}</h3>
              <p>${address}</p>
              <a href="${directionsUrl}" target="_blank">Get Directions</a>
            `)
            )
            .addTo(map);

          markers.push(marker);

          searchResults.push({ name, address, location });
        }
      });

      populateSearchResults(searchResults);
    })
    .catch((error) => console.error(error));
}

const container = document.getElementById('search-results-container');
function populateSearchResults(results) {
  container.innerHTML = '';

  const heading = document.createElement('p');
  heading.textContent = 'Food Banks Near You';
  container.appendChild(heading);

  heading.style.marginBottom = '10px';

  results.forEach((result) => {
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('search-result');

    resultDiv.innerHTML = `
      <h3>${result.name}</h3>
      <p>${result.address}</p>
      <!-- Add more details as needed -->
    `;

    console.log(result)

    resultDiv.addEventListener('click', () => {
      map.setCenter(result.location)
    })

    container.appendChild(resultDiv);
  });
}

map.on('moveend', e => {
  requestFoodBankData();
})