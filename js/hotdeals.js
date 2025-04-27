$(function () {
    // Store user location globally
    let userLocation = null;
  
    // Initialize shopping cart
    let shoppingCart = [];
    let currentListId = null;
    let lists = new Map();
  
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
  
    // Load basic hot deals info from JSON file
    loadHotDeals();
  
    // Function to load hot deals
    function loadHotDeals() {
        $.getJSON("items.json", function(data) {
            if (userLocation) {
                findNearbyStores(data);
            } else {
                processDeals(data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error loading deals:", textStatus, errorThrown);
            $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-danger'>Error loading hot deals. Please try again later.</p></div>");
        });
    }

    async function findNearbyStores(data) {
        try {
            const [{ PlacesService }, { LatLng }] = await Promise.all([
                google.maps.importLibrary("places"),
                google.maps.importLibrary("core")
            ]);

            const service = new PlacesService(document.createElement('div'));
            const location = new LatLng(userLocation.userLat, userLocation.userLng);
            const storeLocations = new Map();

            const searchPromises = [];
            const allStores = [...new Set(Object.values(data).flatMap(item => Object.keys(item)))];

            for (const store of allStores) {
                const promise = new Promise(resolve => {
                    // Add 'supermarket' to the search query for more accurate results
                    service.textSearch({
                        location: location,
                        radius: 16093.4, // 10 mile radius
                        query: `${store} supermarket`, // Add supermarket to force grocery store results
                        type: 'grocery_or_supermarket'
                    }, (results, status) => {
                        if (status === 'OK' && results.length > 0) {
                            // Improve store name matching
                            const matchingStore = results.find(result => 
                                result.name.toLowerCase().includes(store.toLowerCase()) &&
                                !result.name.toLowerCase().includes('restaurant') &&
                                !result.name.toLowerCase().includes('house')
                            );
                            if (matchingStore) {
                                const distance = calculateDistance(
                                    userLocation.userLat,
                                    userLocation.userLng,
                                    matchingStore.geometry.location.lat(),
                                    matchingStore.geometry.location.lng()
                                );
                                if (distance <= 10) {
                                    storeLocations.set(store, {
                                        distance: distance,
                                        address: matchingStore.formatted_address,
                                        name: store // Use original store name from JSON
                                    });
                                }
                            }
                        }
                        resolve();
                    });
                });
                searchPromises.push(promise);
            }

            // Wait for all store searches to complete
            await Promise.all(searchPromises);

            // Now only process deals for stores that actually exist nearby
            const allDeals = [];
            Object.entries(data).forEach(([item, stores]) => {
                Object.entries(stores).forEach(([store, prices]) => {
                    if (storeLocations.has(store) && prices.discount_price) {
                        const savings = ((prices.original_price - prices.discount_price) / prices.original_price * 100);
                        const roundedSavings = Math.round(savings / 5) * 5; // Round to nearest 5%
                        const storeInfo = storeLocations.get(store);
                        allDeals.push({
                            item: item,
                            chain: storeInfo.name,
                            original_price: prices.original_price,
                            discount_price: prices.discount_price,
                            savings: roundedSavings,
                            discount: `Save ${roundedSavings}%`,
                            address: storeInfo.address,
                            distance: storeInfo.distance
                        });
                    }
                });
            });

            if (allDeals.length > 0) {
                allDeals.sort((a, b) => b.savings - a.savings);
                displayHotDeals(allDeals.slice(0, 12));
            } else {
                $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-info'>No deals available within 10 miles of your location.</p></div>");
            }

        } catch (error) {
            console.error('Error processing nearby stores:', error);
        }
    }

    // Update the displayHotDeals function to properly show store info
    function displayHotDeals(deals) {
        let dealsHTML = "";

        deals.forEach(function (deal, index) {
            dealsHTML += `
            <div class="col-sm-6 col-lg-4 col-xl-3">
                <div class="card h-100">
                    <div class="card-header bg-success text-white d-flex justify-content-start align-items-center">
                        <span class="badge bg-warning text-dark">${deal.discount}</span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${deal.item}</h5>
                        <p class="card-text">
                            <span class="text-decoration-line-through text-muted">$${deal.original_price.toFixed(2)}</span>
                            <span class="text-success fw-bold ms-2 fs-5">$${deal.discount_price.toFixed(2)}</span>
                        </p>
                        <div class="store-info mt-3">
                            <strong>${deal.chain}</strong><br>
                            <small class="text-muted">
                                <i class="bi bi-geo-alt"></i> ${deal.address}<br>
                                <i class="bi bi-sign-turn-right"></i> ${deal.distance.toFixed(1)} miles away
                            </small>
                        </div>
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
  
    $(document).on("click", ".addToList", async function() {
        const itemData = {
            item: $(this).data("item"),
            price: parseFloat($(this).data("price")),
            store: $(this).data("store")
        };
        
        // Store item data temporarily
        $('#selectListModal').data('pendingItem', itemData);
        
        // Load fresh lists before showing modal
        await loadUserLists();
        $('#selectListModal').modal('show');
    });

    // Function to load user lists
    async function loadUserLists() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error("No user signed in");
            return;
        }

        try {
            const snapshot = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .collection('lists')
                .get();

            lists.clear();
            const $select = $('#existingLists');
            $select.empty().append('<option value="">Choose a list...</option>');

            snapshot.forEach(doc => {
                const list = doc.data();
                lists.set(doc.id, { id: doc.id, ...list });
                $select.append(`<option value="${doc.id}">${list.name}</option>`);
            });
        } catch (error) {
            console.error("Error loading lists:", error);
        }
    }

    // Add confirmation handler
    $('#confirmAddToList').click(async function() {
        const selectedListId = $('#existingLists').val();
        const newListName = $('#newListName').val().trim();
        const pendingItem = $('#selectListModal').data('pendingItem');
        
        if (!pendingItem) {
            alert("No item selected");
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error("No user signed in");

            let listId = selectedListId;
            
            // Create new list if name is provided
            if (!selectedListId && newListName) {
                const newListRef = await firebase.firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('lists')
                    .add({
                        name: newListName,
                        items: [],
                        created: firebase.firestore.FieldValue.serverTimestamp()
                    });
                listId = newListRef.id;
            }

            if (!listId && !newListName) {
                alert("Please select a list or create a new one");
                return;
            }

            // Add item to the selected list
            await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .collection('lists')
                .doc(listId)
                .update({
                    items: firebase.firestore.FieldValue.arrayUnion({
                        ...pendingItem,
                        addedAt: new Date().toISOString()
                    })
                });

            // Update display
            currentListId = listId;
            await displayCurrentList(listId);
            
            // Show success message and close modal
            const toast = new bootstrap.Toast($("#addToListToast"));
            toast.show();
            $('#selectListModal').modal('hide');
            
            // Clear form
            $('#newListName').val('');
            $('#existingLists').val('');

        } catch (error) {
            console.error("Error adding item to list:", error);
            alert("Failed to add item to list. Please try again.");
        }
    });

    // Function to display current list
    async function displayCurrentList(listId) {
        if (!listId) return;

        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            const listDoc = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .collection('lists')
                .doc(listId)
                .get();

            if (!listDoc.exists) return;

            const list = listDoc.data();
            let total = 0;
            let html = `
                <h6 class="mb-3">${list.name}</h6>
                <ul class="list-group">`;

            if (list.items && list.items.length > 0) {
                list.items.forEach(item => {
                    total += parseFloat(item.price);
                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${item.item}</strong><br>
                                <small class="text-muted">${item.store}</small>
                            </div>
                            <span class="text-success">$${item.price.toFixed(2)}</span>
                        </li>`;
                });
            } else {
                html += `<li class="list-group-item">No items in list</li>`;
            }

            html += '</ul>';
            $('#currentList').html(html);
            $('#listTotal').text(`$${total.toFixed(2)}`);
            $('#listTotalSection').removeClass('d-none');

        } catch (error) {
            console.error("Error displaying list:", error);
        }
    }

    // Load lists when page loads
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadUserLists();
        }
    });
  });