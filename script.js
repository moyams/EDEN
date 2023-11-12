const searchResults = [];

function requestFoodBankData() {
  fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `
        [out:json];
        (
            node["social_facility"="food_bank"];
            way["social_facility"="food_bank"];
            relation["social_facility"="food_bank"];
        );
        out meta;
    `,
  })
    .then((response) => response.json())
    .then((data) => {
      const userLocation = map.getCenter();
      data.elements.forEach((element) => {
        if (element.type === 'node' && element.lat && element.lon) {
          const name = element.tags['name'] || 'Food Pantry';
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

          new mapboxgl.Marker({
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

          // Store data points within 10 miles in searchResults
          const distanceInMiles = userLocation.distanceTo(foodBankLocation) / 1609.34; // Convert meters to miles
          if (distanceInMiles <= 10) {
            searchResults.push({ name, address });
          }
        }
      });

      populateSearchResults(searchResults);
    })
    .catch((error) => console.error(error));
}

requestFoodBankData();

function populateSearchResults(results) {
  const container = document.getElementById('search-results-container');
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
    
    container.appendChild(resultDiv);
  });
}
