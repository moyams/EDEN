
let searchResults = [];

function requestFoodBankData(map, userLocation) {

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

          const latitude = element.lat;
          const longitude = element.lon;

          const qs = new URLSearchParams({
            daddr: `${latitude},${longitude}`,
            saddr: 'Current Location',
            dirflg: 'd',
          });

          const directionsUrl = `http://maps.apple.com/?${qs.toString()}`;

          new mapboxgl.Marker({
            color: '#264a27',
          })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                  <h3>${name}</h3>
                  <p>${address}</p>
                  <a href="${directionsUrl}" target="_blank">Get Directions</a>
                `)
            )
            .addTo(map);

    
          searchResults.push({ name, address, latitude, longitude });
        }
      });

     
      populateSearchResults(map);
    })
    .catch((error) => console.error(error));
}


mapboxgl.accessToken = 'pk.eyJ1IjoibW95YW1zIiwiYSI6ImNrdjE5ZjRyZjJ6d2wzM255Nmh2aWs0dnYifQ.ygL9aNDqoW_y3Yz2mQG05Q';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/moyams/cllyd54xq01jl01qi2jqb2ovh',
  center: [-73.98367068654152, 40.75104182476868],
  zoom: 10,
});

map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
    showUserHeading: true,
  })
);

map.on('load', function () {
  
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        var userLocation = [position.coords.longitude, position.coords.latitude];
        map.flyTo({
          center: userLocation,
          zoom: 12,
          speed: 1.5,
        });

       
        requestFoodBankData(map, userLocation);
      },
      function (error) {
        console.error('Error getting user location:', error);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
});

map.on('moveend', function () {
  
  updateSearchResults(map);
});

function updateSearchResults(map) {
  const filteredResults = filterResultsWithinExtent(map);
  populateSearchResults(filteredResults);
}

function filterResultsWithinExtent(map) {
  
  const bounds = map.getBounds();
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();

  
  return searchResults.filter((result) => {
    const latitude = result.latitude;
    const longitude = result.longitude;

    return (
      latitude >= south &&
      latitude <= north &&
      longitude >= west &&
      longitude <= east
    );
  });
}

function populateSearchResults(results) {
  const container = document.getElementById('search-results-container');

  
  container.innerHTML = '';

 
  results.forEach((result) => {
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('search-result');

    // Customize the content based on your data structure
    resultDiv.innerHTML = `
        <h3>${result.name}</h3>
        <p>${result.address}</p>
        <!-- Add more details as needed -->
    `;

    container.appendChild(resultDiv); 
  });
}


function populateSearchResults(results) {
    const container = document.getElementById('search-results-container');
  
    
    container.innerHTML = '';
  
   
    if (Array.isArray(results)) {
      
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
    } else {
      
      container.innerHTML = 'No results found.';
    }
  }
  