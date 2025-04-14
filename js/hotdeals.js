$(function () {
  // Store user location globally
  let userLocation = null;

  // Wait for auth state before getting location
  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      userLocation = await getUserLocation(user);
      if (userLocation) {
        console.log(`User's Latitude: ${userLocation.userLat}, Longitude: ${userLocation.userLng}`);
        // Load deals only after we have location
        loadHotDeals();
      }
    } else {
      console.error("No user is signed in.");
      // Optional: You might want to load deals anyway without location
      loadHotDeals();
    }
  });

  async function getUserLocation(user) {
    try {
      const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
      if (userDoc.exists && userDoc.data().address) {
        const userAddress = userDoc.data().address;
        return {
          userLat: userAddress.lat,
          userLng: userAddress.lng
        };
      } else {
        console.log("No address found for the user.");
        return null;
      }
    } catch (error) {
      console.error("Error retrieving user location:", error);
      return null;
    }
  }


  
  // Our target chains (with possible variations in naming)
  const targetChains = [
    { searchName: "Market Basket", displayName: "Market Basket" },
    { searchName: "Walmart Supercenter", displayName: "Walmart Supercenter" },
    { searchName: "Hannaford", displayName: "Hannaford Supermarket" },
    { searchName: "Whole Foods", displayName: "Whole Foods Market" },
    { searchName: "Stop & Shop", displayName: "Stop & Shop" },
    { searchName: "Shaw's", displayName: "Shaw's" },
    { searchName: "ALDI", displayName: "ALDI" },
    { searchName: "Trader Joe's", displayName: "Trader Joe's" }
    
  ];

  // Load hot deals from JSON file
  loadHotDeals();

  // Function to load hot deals
  function loadHotDeals() {
    $.getJSON("hotdeals.json", function(data) {
      displayHotDeals(data.hotdeals);
      // After displaying deals, find nearby locations for our target chains
      findNearbyLocations(data.hotdeals);
    }).fail(function() {
      console.error("Error loading hot deals data");
      $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-danger'>Error loading hot deals. Please try again later.</p></div>");
    });
  }

  // Function to display hot deals in grid
  function displayHotDeals(deals) {
    let dealsHTML = "";
    
    deals.forEach(function(deal, index) {
      dealsHTML += `
      <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
              <div class="card-header bg-success text-white">
                  <span class="badge bg-warning text-dark">${deal.discount}</span> SAVE $${deal.savings.toFixed(2)}
              </div>
              <div class="card-body">
                  <h5 class="card-title">${deal.item}</h5>
                  <p class="card-text">
                      <span class="text-decoration-line-through">$${deal.original_price.toFixed(2)}</span>
                      <span class="text-success fw-bold">$${deal.discount_price.toFixed(2)}</span>
                  </p>
                  <p class="card-text"><small class="text-muted store-info" id="store-${index}">${deal.chain}</small></p>
              </div>
              <div class="card-footer">
                  <button class="btn btn-primary w-100 addItem" data-item="${deal.item}" data-price="${deal.discount_price}" data-store="${deal.chain}">
                      Add to Shopping List
                  </button>
              </div>
          </div>
      </div>`;
    });
    
    $("#hotDealsGrid").html(dealsHTML);
  }

  // Function to find nearby locations for our target chains
  async function findNearbyLocations(deals) {

    if (!userLocation) {
      console.log("No user location available - skipping nearby locations");
      return;
  }

    try {
      const { PlacesService } = await google.maps.importLibrary("places");
      const { LatLng } = await google.maps.importLibrary("core");
  
      const service = new PlacesService(document.createElement('div'));
      const location = new LatLng(userLocation.userLat, userLocation.userLng);
  
      const chainLocations = new Map();
  
      for (const chain of targetChains) {
        const response = await new Promise(resolve => {
          service.nearbySearch({
            location: location,
            radius: 32186.9,
            keyword: chain.searchName,
            type: 'grocery_or_supermarket'
          }, (results, status) => resolve({ results, status }));
        });
  

    if (response.status === 'OK' && response.results.length > 0) {
      const closest = response.results.reduce((prev, current) => {
        const prevDist = calculateDistance(userLocation.userLat, userLocation.userLng, prev.geometry.location.lat(), prev.geometry.location.lng());
        const currDist = calculateDistance(userLocation.userLat, userLocation.userLng, current.geometry.location.lat(), current.geometry.location.lng());
        return currDist < prevDist ? current : prev;
      });

      const dist = calculateDistance(userLocation.userLat, userLocation.userLng, closest.geometry.location.lat(), closest.geometry.location.lng());

      // Extract city from formatted_address
      const formatted = closest.formatted_address || closest.vicinity || '';

      console.log('Raw address:', formatted); // Debug logging

      const parts = formatted.split(',');
      let cityState = '';
      
      cityState = parts[1].trim(); // Fallback if only state is available

      chainLocations.set(chain.displayName, {
        distance: dist,
        address: `- ${cityState} (${dist.toFixed(1)} miles)`,
        fullAddress: formatted
      });
    }
}
    updateDealsWithLocations(deals, chainLocations);

    } catch (error) {
      console.error('Error finding nearby locations:', error);
    }
  }
  

  // Update deals with location information
  function updateDealsWithLocations(deals, chainLocations) {
    deals.forEach((deal, index) => {
      const locationInfo = chainLocations.get(deal.chain);
      if (locationInfo) {
        $(`#store-${index}`).html(`
          ${deal.chain} 
          <span class="location-distance">${locationInfo.address}</span>
        `);
      }
    });
  }


  // Helper function to calculate distance between two coordinates in miles (Haversine formula)
  // source: https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }


});
