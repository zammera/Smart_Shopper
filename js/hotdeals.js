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
  async function loadHotDeals() {
    if (!userLocation) {
        $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-warning'>Please set your location to see deals near you.</p></div>");
        return;
    }

    try {
        // Load Google Maps libraries
        const [{ PlacesService }, { LatLng }] = await Promise.all([
            google.maps.importLibrary("places"),
            google.maps.importLibrary("core")
        ]);

        const service = new PlacesService(document.createElement('div'));
        const location = new LatLng(userLocation.userLat, userLocation.userLng);

        // Get JSON data and nearby stores
        const data = await $.getJSON("hotdeals.json");
        const nearbyStores = new Map();

        // Find nearby stores first
        for (const chain of targetChains) {
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
                    const closest = response.results[0];
                    const distance = calculateDistance(
                        userLocation.userLat,
                        userLocation.userLng,
                        closest.geometry.location.lat(),
                        closest.geometry.location.lng()
                    );

                    if (distance <= 10) {
                        nearbyStores.set(chain.displayName.toLowerCase(), {
                            distance: distance,
                            address: closest.vicinity
                        });
                    }
                }
            } catch (error) {
                console.error(`Error finding ${chain.displayName}:`, error);
            }
        }

        // Filter and process deals only from nearby stores
        const deals = Object.entries(data)
            .map(([item, stores]) => {
                let bestSavings = 0;
                let bestStore = '';
                let originalPrice = 0;
                let discountPrice = 0;
                let storeDistance = 0;
                let storeAddress = '';

                Object.entries(stores).forEach(([store, prices]) => {
                    const storeInfo = nearbyStores.get(store.toLowerCase());
                    if (storeInfo && prices.discount_price) { // Only consider stores within 10 miles and items with actual discounts
                        const savings = prices.original_price - prices.discount_price;
                        const savingsPercent = (savings / prices.original_price) * 100;
                        
                        if (savingsPercent > bestSavings) {
                            bestSavings = savingsPercent;
                            bestStore = store;
                            originalPrice = prices.original_price;
                            discountPrice = prices.discount_price;
                            storeDistance = storeInfo.distance;
                            storeAddress = storeInfo.address;
                        }
                    }
                });

                if (bestSavings === 0) return null; // Skip items with no savings

                return {
                    item: item,
                    chain: bestStore,
                    original_price: originalPrice,
                    discount_price: discountPrice,
                    savings_percent: bestSavings,
                    savings_amount: (originalPrice - discountPrice).toFixed(2),
                    discount: `Save ${Math.round(bestSavings)}%`,
                    distance: storeDistance,
                    address: storeAddress
                };
            })
            .filter(deal => deal !== null)
            .sort((a, b) => b.savings_percent - a.savings_percent) // Sort by highest savings percentage
            .slice(0, 12); // Show top 12 deals with highest savings
        
        if (deals.length === 0) {
            $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-info'>No deals available within 10 miles of your location.</p></div>");
            return;
        }

        displayHotDeals(deals);

    } catch (error) {
        console.error("Error loading hot deals:", error);
        $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-danger'>Error loading hot deals. Please try again later.</p></div>");
    }
  }

  // Function to display hot deals in grid
  function displayHotDeals(deals) {
    let dealsHTML = "";

    deals.forEach(function (deal, index) {
        dealsHTML += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <span class="badge bg-warning text-dark">${deal.discount}</span>
                    <span class="badge bg-danger">Save $${deal.savings_amount}</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${deal.item}</h5>
                    <p class="card-text">
                        <span class="text-decoration-line-through text-muted">$${deal.original_price.toFixed(2)}</span>
                        <span class="text-success fw-bold fs-4 ms-2">$${deal.discount_price.toFixed(2)}</span>
                    </p>
                    <p class="card-text">
                        <small class="text-muted store-info" id="store-${index}">
                            <i class="bi bi-shop"></i> ${deal.chain}<br>
                            <i class="bi bi-geo-alt"></i> ${deal.address} (${deal.distance.toFixed(1)} miles)
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
        dealsHTML = "<div class='col-12'><p class='alert alert-info'>No deals available within 10 miles of your location.</p></div>";
    }

    $("#hotDealsGrid").html(dealsHTML);
}

$(document).on("click", ".addToList", async function() {
    const item = $(this).data("item");
    const price = $(this).data("price");
    const store = $(this).data("store");

    // Store selected item details
    window.selectedItem = { item, price, store };

    // Populate existing lists in the modal
    await populateExistingLists();

    // Show the modal
    const modal = new bootstrap.Modal($("#addToListModal"));
    modal.show();
});

function displayLocalStores(stores) {
    const storesContainer = $("#localStoresContainer");
    storesContainer.html("");

    if (stores.size === 0) {
        storesContainer.html("<p class='alert alert-info'>No stores found within 10 miles.</p>");
        return;
    }

    let storesHTML = `
        <div class="card mb-3">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Nearby Stores (10 mile radius)</h5>
            </div>
            <div class="card-body">
                <div class="list-group">
    `;

    // Convert Map entries to array and sort by distance
    const sortedStores = Array.from(stores.entries())
        .filter(([_, data]) => data.distance <= 10)
        .sort((a, b) => a[1].distance - b[1].distance);

    sortedStores.forEach(([chain, data]) => {
        storesHTML += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${chain}</h6>
                        <small class="text-muted">${data.fullAddress}</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">${data.distance.toFixed(1)} mi</span>
                </div>
            </div>
        `;
    });

    storesHTML += `
                </div>
            </div>
        </div>
    `;

    storesContainer.html(storesHTML);
}

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

        // Add this line to display local stores
        displayLocalStores(chainLocations);
        
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
  // source: https
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

  

$(document).on("click", "#confirmAddToList", async function() {
    const selectedList = $("#existingLists").val();
    const newListName = $("#newListName").val().trim();

    if (!selectedList && !newListName) {
        alert("Please select an existing list or enter a new list name.");
        return;
    }

    const listName = selectedList || newListName;
    const item = window.selectedItem;

    try {
        if (newListName) {
            // Create new list using the existing function from makelists.js
            await createGroceryListDB(newListName);
            
            // Update localStorage for list names
            let storedLists = JSON.parse(localStorage.getItem("listNames")) || [];
            storedLists.push({ name: newListName });
            localStorage.setItem("listNames", JSON.stringify(storedLists));
        }

        // Add item to list using the existing function from addItem.js
        await addItemDB(listName, item.item, 1);

        // Close the modal
        const modal = bootstrap.Modal.getInstance($("#addToListModal"));
        modal.hide();

        // Show success toast
        const toast = new bootstrap.Toast($("#addToListToast"));
        toast.show();
    } catch (error) {
        console.error("Error adding item to list:", error);
        alert("There was an error adding the item to your list. Please try again.");
    }
});

// Add the populateExistingLists function
async function populateExistingLists() {
    const existingListsDropdown = $("#existingLists");
    existingListsDropdown.html('<option value="" selected disabled>Choose a list...</option>');

    try {
        // Get lists from Firebase using the existing function from makelists.js
        const lists = await getAllCurrentLists();
        
        lists.forEach(list => {
            existingListsDropdown.append(`<option value="${list.name}">${list.name}</option>`);
        });
    } catch (error) {
        console.error("Error loading lists:", error);
        existingListsDropdown.append('<option disabled>Error loading lists</option>');
    }
}

$(document).on("click", ".remove-item", function() {
    const listName = $(this).data("list");
    const itemIndex = $(this).data("index");
    
    let listItems = JSON.parse(localStorage.getItem(listName)) || [];
    listItems.splice(itemIndex, 1);
    localStorage.setItem(listName, JSON.stringify(listItems));
    
    // Update the display
    updateShoppingLists();
});

// Call updateShoppingLists when the page loads
$(document).ready(function() {
    updateShoppingLists();
});
});
