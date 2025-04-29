$(function () {
    // —————————————————————————
    // State & globals
    // —————————————————————————
    let userLocation = null;
    let currentListId = "hotDealsList";
    const lists = new Map();

    // —————————————————————————
    // On auth: fetch location, deals, and current list
    // —————————————————————————
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            try {
                const userDoc = await firebase.firestore()
                    .collection("users")
                    .doc(user.uid)
                    .get();
                if (userDoc.exists && userDoc.data().address) {
                    userLocation = {
                        userLat: userDoc.data().address.lat,
                        userLng: userDoc.data().address.lng
                    };
                }
            } catch (error) {
                console.error("Error retrieving user location:", error);
            }
        }
        loadHotDeals();
        if (currentListId) {
            displayCurrentList(currentListId);
        }
    });

    // —————————————————————————
    // Load & display hot-deals JSON
    // —————————————————————————
    function loadHotDeals() {
        $.getJSON("items.json", data => {
            if (userLocation) {
                findNearbyStores(data);
            } else {
                processDeals(data);
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.error("Error loading deals:", textStatus, errorThrown);
            $("#hotDealsGrid").html(
                "<div class='col-12'><p class='alert alert-danger'>Error loading hot deals. Please try again later.</p></div>"
            );
        });
    }

    // —————————————————————————
    // If we have geo, filter to within 20 mi
    // —————————————————————————
    async function findNearbyStores(data) {
        try {
            const [{ PlacesService }, { LatLng }] = await Promise.all([
                google.maps.importLibrary("places"),
                google.maps.importLibrary("core")
            ]);
            const service = new PlacesService(document.createElement('div'));
            const center = new LatLng(userLocation.userLat, userLocation.userLng);
            const storeLocations = new Map();
            const allStores = [...new Set(Object.values(data).flatMap(item => Object.keys(item)))];

            const radius = 32186.9; // meters (20 miles)
            const maxDistance = radius / 1609.34; // miles
            await Promise.all(allStores.map(store =>
                new Promise(resolve => {
                    service.textSearch({
                        location: center,
                        radius: radius, // 20 miles defined above
                        query: `${store} supermarket`,
                        type: 'grocery_or_supermarket'
                    }, (results, status) => {
                        if (status === 'OK') {
                            const match = results.find(r =>
                                r.name.toLowerCase().includes(store.toLowerCase()) &&
                                !r.name.toLowerCase().includes('restaurant') &&
                                !r.name.toLowerCase().includes('house')
                            );
                            if (match) {
                                const dist = calculateDistance(
                                    userLocation.userLat, userLocation.userLng,
                                    match.geometry.location.lat(), match.geometry.location.lng()
                                );
                                if (dist <= maxDistance) {
                                    storeLocations.set(store, {
                                        name: store,
                                        address: match.formatted_address,
                                        distance: dist
                                    });
                                }
                            }
                        }
                        resolve();
                    });
                })
            ));

            const allDeals = [];
            Object.entries(data).forEach(([item, stores]) => {
                Object.entries(stores).forEach(([chain, prices]) => {
                    if (storeLocations.has(chain) && prices.discount_price) {
                        const info = storeLocations.get(chain);
                        const savings = ((prices.original_price - prices.discount_price) / prices.original_price) * 100;
                        const rounded = Math.round(savings / 5) * 5;
                        allDeals.push({
                            item,
                            chain:   info.name,
                            original_price: prices.original_price,
                            discount_price: prices.discount_price,
                            savings: rounded,
                            discount: `Save ${rounded}%`,
                            address: info.address,
                            distance: info.distance
                        });
                    }
                });
            });

            if (allDeals.length) {
                allDeals.sort((a, b) => b.savings - a.savings);
                displayHotDeals(allDeals.slice(0, 12));
            } else {
                $("#hotDealsGrid").html(
                    `<div class='col-12'><p class='alert alert-info'>No deals within ${Math.trunc(maxDistance)} miles.</p></div>`
                );
            }
        } catch (error) {
            console.error("Error processing nearby stores:", error);
        }
    }

    // —————————————————————————
    // If no geo, just show all discounted items
    // —————————————————————————
    function processDeals(data) {
        const deals = [];
        Object.entries(data).forEach(([item, stores]) => {
            Object.entries(stores).forEach(([chain, prices]) => {
                if (prices.discount_price) {
                    const savings = ((prices.original_price - prices.discount_price) / prices.original_price) * 100;
                    const rounded = Math.round(savings / 5) * 5;
                    deals.push({
                        item,
                        chain,
                        original_price: prices.original_price,
                        discount_price: prices.discount_price,
                        savings: rounded,
                        discount: `Save ${rounded}%`,
                        address: "",
                        distance: 0
                    });
                }
            });
        });
        if (deals.length) {
            deals.sort((a, b) => b.savings - a.savings);
            displayHotDeals(deals.slice(0, 12));
        } else {
            $("#hotDealsGrid").html(
                "<div class='col-12'><p class='alert alert-info'>No deals available.</p></div>"
            );
        }
    }

    // —————————————————————————
    // Toast Helper Function
    // —————————————————————————
    function showToast(message, type = 'info') {
      const $toast = $('#addToListToast');
      const $toastBody = $toast.find('.toast-body');

      $toastBody.text(message);
      $toast.removeClass('bg-success bg-danger bg-info bg-warning');

      if (type === 'success') {
          $toast.addClass('bg-success text-white');
      } else if (type === 'danger') {
          $toast.addClass('bg-danger text-white');
      } else if (type === 'warning') {
          $toast.addClass('bg-warning text-dark');
      } else {
          $toast.addClass('bg-info text-white');
      }

      new bootstrap.Toast($toast[0]).show();
    }

    // —————————————————————————
    // Render card grid
    // —————————————————————————
    function displayHotDeals(deals) {
        let html = "";
        deals.forEach(deal => {
            html += `
                <div class="col-sm-6 col-lg-4 col-xl-3 mb-3">
                  <div class="card h-100">
                    <div class="card-header bg-success text-white">
                      <span class="badge bg-warning text-dark">${deal.discount}</span>
                    </div>
                    <div class="card-body">
                      <h5 class="card-title">${deal.item}</h5>
                      <p class="card-text">
                        <span class="text-decoration-line-through text-muted">$${deal.original_price.toFixed(2)}</span>
                        <span class="text-success fw-bold ms-2 fs-5">$${deal.discount_price.toFixed(2)}</span>
                      </p>
                      ${deal.address ? `
                        <div class="store-info">
                          <strong>${deal.chain}</strong><br>
                          <small class="text-muted">
                            <i class="bi bi-geo-alt"></i> ${deal.address}<br>
                            <i class="bi bi-sign-turn-right"></i> ${deal.distance.toFixed(1)} mi away
                          </small>
                        </div>` : ""}
                    </div>
                    <div class="card-footer">
                      <button class="btn btn-primary w-100 addToList"
                        data-item="${deal.item}"
                        data-price="${deal.discount_price}"
                        data-store="${deal.chain}"
                        data-address="${deal.address}">
                        Add to List
                      </button> 
                    </div>
                  </div>
                </div>`;
        });
        $("#hotDealsGrid").html(html);
    }

    // —————————————————————————
    // Distance calc (Haversine)
    // source: https://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
    // —————————————————————————
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3958.8;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) *
                  Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // —————————————————————————
    // Load existing lists into the modal
    // —————————————————————————
    async function loadUserLists() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        try {
            const snapshot = await firebase.firestore()
                .collection('users').doc(user.uid)
                .collection('groceryLists')
                .get();
            lists.clear();
            const $sel = $('#existingLists').empty()
                .append('<option value="">Choose a list…</option>');
            snapshot.forEach(doc => {
                const data = doc.data();
                lists.set(doc.id, data);
                $sel.append(`<option value="${doc.id}">${data.name}</option>`);
            });
        } catch (e) {
            console.error("Error loading lists:", e);
        }
    }

  // —————————————————————————
  // Load user’s lists into the modal
  // —————————————————————————
  async function loadUserLists() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const snap = await firebase.firestore()
      .collection('users').doc(user.uid)
      .collection('groceryLists')
      .get();
    lists.clear();
    const $sel = $('#existingLists').empty()
      .append('<option value="">Choose a list…</option>');
    snap.forEach(doc => {
      const d = doc.data();
      lists.set(doc.id, d);
      $sel.append(`<option value="${doc.id}">${d.name}</option>`);
    });
  }

  $(document).on("click", ".addToList", function() {
    const pending = {
      item:  $(this).data("item"),
      price: parseFloat($(this).data("price")),
      store: $(this).data("store"),
      address: $(this).data("address") || ""
    };
    
    updateItemQuantity(1, pending);
});

  // —————————————————————————
  // Confirm initial selection & add first item
  // —————————————————————————
  $('#confirmAddToList').click(async function() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    let listId    = $('#existingLists').val();
    const newName = $('#newListName').val().trim();
    const pending = $('#selectListModal').data('pendingItem');
    if (!pending) return alert("No item selected.");

    // create new if needed
    if (!listId && newName) {
      const ref = await firebase.firestore()
        .collection('users').doc(user.uid)
        .collection('groceryLists')
        .add({
          name: newName,
          items: [],
          created: firebase.firestore.FieldValue.serverTimestamp()
        });
      listId = ref.id;
    }
    if (!listId) return alert("Please choose or name a list.");

    // persist & add
    currentListId = listId;
    localStorage.setItem('currentListId', listId);

    const itemToAdd = {
      item: pending.item,
      price: pending.price,
      store: pending.store,
      quantity: 1,
      addedAt: new Date().toISOString()
    };
    
    await firebase.firestore()
      .collection('users').doc(user.uid)
      .collection('groceryLists')
      .doc(listId)
      .set({
        name: newName || lists.get(listId)?.name || "Unnamed List",
        created: firebase.firestore.FieldValue.serverTimestamp(),
        items: [itemToAdd]
      }, { merge: true });
    

    $('#selectListModal').modal('hide');
    $('#newListName, #existingLists').val('');
    displayCurrentList(listId);

  });

  async function updateItemQuantity(delta, pending) {
    const user = firebase.auth().currentUser;
    if (!user || !currentListId) return;
    
    const ref = firebase.firestore()
      .collection('users').doc(user.uid)
      .collection('groceryLists')
      .doc(currentListId);
  
    await firebase.firestore().runTransaction(async t => {
      const snap = await t.get(ref);
      let items = [];
      if (snap.exists) {
        items = snap.data().items || [];
      }
  
      const idx = items.findIndex(i =>
        i.item === pending.item && i.store === pending.store
      );
      let action = '';
  
      if (idx === -1) {
        items.push({
          ...pending,
          quantity: Math.max(1, delta),
          addedAt: new Date().toISOString()
        });
        action = 'add';
      } else {
        const newQty = (items[idx].quantity || 1) + delta;
        if (newQty > 0) {
          items[idx].quantity = newQty;
          action = 'update';
        } else {
          items.splice(idx, 1);
          action = 'delete';
        }
      }
  
      t.set(ref, {
        name: "Hot Deals List",
        created: snap.exists ? snap.data().created : firebase.firestore.FieldValue.serverTimestamp(),
        items: items
      });
  
      // Show correct toast
      if (action === 'add') {
        showToast('Item added to your Hot Deals List!', 'success');
      } else if (action === 'update') {
        showToast('Item updated!', 'info');
      } else if (action === 'delete') {
        showToast('Item removed from your list.', 'danger');
      }
    });
  
    displayCurrentList(currentListId);
  }
  

  // —————————————————————————
  // Handlers for +, – and 🗑 in sidebar
  // —————————————————————————
  $(document).on("click", ".incrementItem", function() {
    updateItemQuantity(1, {
      item:  $(this).data("item"),
      price: parseFloat($(this).data("price")),
      store: $(this).data("store")
    });
  });
  $(document).on("click", ".decrementItem", function() {
    updateItemQuantity(-1, {
      item:  $(this).data("item"),
      price: parseFloat($(this).data("price")),
      store: $(this).data("store")
    });
  });
  $(document).on("click", ".removeItem", function() {
    updateItemQuantity(-9999, {
      item:  $(this).data("item"),
      price: parseFloat($(this).data("price")),
      store: $(this).data("store")
    });
  });

  // —————————————————————————
  // Render the sidebar’s current list + “Close List” button
  // —————————————————————————
  async function displayCurrentList(listId) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const snap = await firebase.firestore()
      .collection('users').doc(user.uid)
      .collection('groceryLists')
      .doc(listId)
      .get();
    if (!snap.exists) return;
    const data = snap.data();
    let total = 0;
    let html = `<ul class="list-group">`;

    (data.items||[]).forEach(i => {
      const qty   = i.quantity||1;
      const line  = i.price * qty;
      total += line;
      html += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${i.item}</strong><br>
            <small class="text-muted">${i.store}</small><br>
            ${i.address ? `<small class="text-muted"><i class="bi bi-geo-alt"></i> ${i.address}</small>` : ""}
          </div>
          <div class="d-flex align-items-center">
            <button class="btn btn-sm btn-outline-secondary decrementItem"
                    data-item="${i.item}" data-store="${i.store}" data-price="${i.price}">
              – 
            </button>
            <span class="mx-2">${qty}</span>
            <button class="btn btn-sm btn-outline-secondary incrementItem"
                    data-item="${i.item}" data-store="${i.store}" data-price="${i.price}">
              +
            </button>
            <button class="btn btn-sm btn-outline-danger ms-2 removeItem"
                    data-item="${i.item}" data-store="${i.store}" data-price="${i.price}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <span class="text-success ms-3">$${line.toFixed(2)}</span>
        </li>`;
    });

    html += `</ul>`;
    $('#currentList').html(html);
    $('#listTotal').text(`$${total.toFixed(2)}`);
    $('#listTotalSection').removeClass('d-none');
  }

  // —————————————————————————
  // Close list (UI only) → clear selection, hide sidebar
  // —————————————————————————
  $(document).on("click", "#closeCurrentList", () => {
    currentListId = null;
    localStorage.removeItem('currentListId');
    $('#currentList').empty();
    $('#listTotalSection').addClass('d-none');
  });
});  // end of $(function)
