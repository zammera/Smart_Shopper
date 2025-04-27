$(function () {
    // Store user location globally
    let userLocation = null;
  
    // Initialize shopping cart
    let shoppingCart = [];
  
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
        // load deals anyway without location
        loadHotDeals();
      }
    });
  
    // using user's lat and lng to get nearby grocery store locations
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
      { 
          searchName: "Walmart Supercenter", 
          displayName: "Walmart Supercenter",
          isNationwide: true
      },
      { 
          searchName: "Whole Foods", 
          displayName: "Whole Foods Market",
          isNationwide: true
      },
      { 
          searchName: "ALDI", 
          displayName: "ALDI",
          isNationwide: true
      },
      { 
          searchName: "Trader Joe's", 
          displayName: "Trader Joe's",
          isNationwide: true
      }
    ];
  
    // Load basic hot deals info from JSON file
    loadHotDeals();
  
    // Function to load hot deals
    function loadHotDeals() {
        $.getJSON("items.json", function(data) {
            const allDeals = [];
            
            // Process the new JSON structure
            Object.entries(data).forEach(([item, stores]) => {
                Object.entries(stores).forEach(([store, prices]) => {
                    if (prices.discount_price) { // Only include items with actual discounts
                        const savings = ((prices.original_price - prices.discount_price) / prices.original_price * 100);
                        allDeals.push({
                            item: item,
                            chain: store,
                            original_price: prices.original_price,
                            discount_price: prices.discount_price,
                            savings: Math.round(savings),
                            discount: `Save ${Math.round(savings)}%`
                        });
                    }
                });
            });

            // Sort deals by highest savings percentage
            allDeals.sort((a, b) => b.savings - a.savings);

            // Display top 12 deals
            displayHotDeals(allDeals.slice(0, 12));

            // If we have user location, find nearby stores
            if (userLocation) {
                findNearbyLocations(allDeals);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error loading deals:", textStatus, errorThrown);
            $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-danger'>Error loading hot deals. Please try again later.</p></div>");
        });
    }

    function displayHotDeals(deals) {
        let dealsHTML = "";

        deals.forEach(function (deal, index) {
            const savingsAmount = deal.original_price - deal.discount_price;
            
            dealsHTML += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <span class="badge bg-warning text-dark">${deal.discount}</span>
                        <span class="badge bg-danger">Save $${savingsAmount.toFixed(2)}</span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${deal.item}</h5>
                        <p class="card-text">
                            <span class="text-decoration-line-through text-muted">$${deal.original_price.toFixed(2)}</span>
                            <span class="text-success fw-bold ms-2 fs-5">$${deal.discount_price.toFixed(2)}</span>
                        </p>
                        <p class="card-text">
                            <small class="text-muted store-info" id="store-${index}">
                                ${deal.chain}
                            </small>
                        </p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary w-100 addToList" 
                                data-item="${deal.item}" 
                                data-price="${deal.discount_price}" 
                                data-store="${deal.chain}">
                            Add to List
                        </button>
                    </div>
                </div>
            </div>`;
        });

        if (deals.length === 0) {
            dealsHTML = "<div class='col-12'><p class='alert alert-info'>No deals available at this time.</p></div>";
        }

        $("#hotDealsGrid").html(dealsHTML);
    }

    // Function to find nearby locations for our target chains
    async function findNearbyLocations(deals) {
      if (!userLocation) {
          console.log("No user location available - skipping nearby locations");
          return;
      }
  
      try {
          // Load libraries all at once
          const [{ PlacesService }, { LatLng }] = await Promise.all([
              google.maps.importLibrary("places"),
              google.maps.importLibrary("core")
          ]);
  
          const service = new PlacesService(document.createElement('div'));
          const location = new LatLng(userLocation.userLat, userLocation.userLng);
          const chainLocations = new Map();
  
          // Process chains
          const locationPromises = targetChains.map(async chain => {
              try {
                  const response = await new Promise(resolve => {
                      service.nearbySearch({
                          location: location,
                          radius: 16093.4, // 10 mile radius
                          keyword: chain.searchName,
                          type: 'grocery_or_supermarket'
                      }, (results, status) => resolve({ results, status }));
                  });
  
                  if (response.status === 'OK' && response.results.length > 0) {
                      // Find closest location
                      let closest = response.results[0];
                      let minDist = calculateDistance(userLocation.userLat, userLocation.userLng, 
                                                   closest.geometry.location.lat(), 
                                                   closest.geometry.location.lng());
  
                      for (let i = 1; i < response.results.length; i++) {
                          const current = response.results[i];
                          const currDist = calculateDistance(userLocation.userLat, userLocation.userLng,
                                                           current.geometry.location.lat(),
                                                           current.geometry.location.lng());
                          if (currDist < minDist) {
                              closest = current;
                              minDist = currDist;
                          }
                      }
  
                      const formatted = closest.formatted_address || closest.vicinity || '';
                      const city = formatted.split(',')[1]?.trim() || '';
  
                      return {
                          chain: chain.displayName,
                          data: {
                              distance: minDist,
                              address: `- ${city} (${minDist.toFixed(1)} miles)`,
                              fullAddress: formatted
                          }
                      };
                  }
              } catch (error) {
                  console.error(`Error processing ${chain.displayName}:`, error);
                  return null;
              }
          });
  
          // Wait for all promises to complete
          const results = await Promise.all(locationPromises);
          
          // Store valid results
          results.forEach(result => {
              if (result) chainLocations.set(result.chain, result.data);
          });
  
          updateDealsWithLocations(deals, chainLocations);
  
      } catch (error) {
          console.error('Error in findNearbyLocations:', error);
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
  
    $(document).on("click", ".addToList", function() {
        const item = $(this).data("item");
        const price = $(this).data("price");
        const store = $(this).data("store");
  
        // Show success toast
        const toast = new bootstrap.Toast($("#addToListToast"));
        toast.show();
    });
  });