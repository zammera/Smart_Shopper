import { db, auth } from "./firebaseInit.js";
import { setDoc, getDoc, runTransaction, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

let groceries = {};
let currentListName = null;

// On auth: load items and initialize page
onAuthStateChanged(auth, async user => {
  if (!user) return;
  try {
    await loadGroceries();
    initPage();
  } catch (e) {
    console.error('Initialization error:', e);
  }
});

// Load items.json
async function loadGroceries() {
  const res = await fetch('items.json');
  groceries = await res.json();
  renderSearchItems();
}

// Normalize units
function normalizeUnits(str) {
  return str.replace(/\b(lb|oz|ct|each)\b/gi, m => m.toLowerCase());
}

// Render search items into two columns
function renderSearchItems() {
    let toggle = true;
    Object.keys(groceries).forEach(name => {
      const display = normalizeUnits(name);
      const html = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <h5 class="flex-grow-1 m-0">${display}</h5>
          <button class="btn btn-custom-color addToList" data-item="${name}">Add</button>
        </li>`;
      document.querySelector(toggle ? '#result1' : '#result2').insertAdjacentHTML('beforeend', html);
      toggle = !toggle;
    });
  }

// Initialize page: load list, setup search and button
function initPage() {
    const params = new URLSearchParams(window.location.search);
    currentListName = params.get('name');
    document.getElementById('currentListNameSpan').textContent = currentListName;
  
    const listNameElem = document.getElementById('listName');
    if (listNameElem) {
      listNameElem.textContent = currentListName;
    }
  
    // Load saved quantities
    getItemsDB(currentListName).then(items => {
        items.forEach(obj => addToList(obj.name, obj.qty, true)); 
    });
  
    // Setup search filter based on users input
    document.getElementById('searchBar').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        
        const allItems = document.querySelectorAll('#result1 li, #result2 li');
      
        allItems.forEach(li => {
          const text = li.querySelector('h5')?.textContent.toLowerCase() || '';
          
          if (text.includes(q)) {
            li.style.setProperty('display', '', 'important');
          } else {
            li.style.setProperty('display', 'none', 'important');
          }
        });
      });
  
    // Check if 'Find Best Stores' button already exists
    if (!document.getElementById('findBestStores')) {
      const container = document.getElementById('myList');
      const btnHtml = `<button id="findBestStores" class="btn btn-primary mt-3 mb-2">Find Best Stores</button>`;
      container.insertAdjacentHTML('beforebegin', btnHtml);
    }
  }

// Event delegation for clicks
document.addEventListener('click', e => {
    const addBtn = e.target.closest('.addToList');
    const incrementBtn = e.target.closest('.incrementItem');
    const decrementBtn = e.target.closest('.decrementItem');
    const removeBtn = e.target.closest('.removeItem');
  
    if (addBtn) {
      addToList(addBtn.dataset.item, 1);
    } else if (incrementBtn) {
      updateItemQuantity(incrementBtn.dataset.item, 1);
    } else if (decrementBtn) {
      updateItemQuantity(decrementBtn.dataset.item, -1);
    } else if (removeBtn) {
      updateItemQuantity(removeBtn.dataset.item, -9999);
    } else if (e.target.matches('#findBestStores')) {
      findBestStores();
    }
  });
  

// Add item to UI and DB
function addToList(itemName, qty, skipSave = false) {
    const list = document.getElementById('myList');
    const existingQtySpan = list.querySelector(`[data-qty-for="${itemName}"]`);
  
    if (existingQtySpan) {
      updateItemQuantity(itemName, qty); 
      return;
    }
  
    const html = `
    <li class="list-group-item d-flex justify-content-between align-items-center" id="li-${itemName}">
    <div>
        ${normalizeUnits(itemName)}
    </div>
    <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-secondary decrementItem" data-item="${itemName}">–</button>
        <span class="mx-2" data-qty-for="${itemName}">${qty}</span>
        <button class="btn btn-sm btn-outline-secondary incrementItem" data-item="${itemName}">+</button>
        <button class="btn btn-sm btn-outline-danger ms-2 removeItem" data-item="${itemName}">
        <i class="bi bi-trash"></i>
        </button>
    </div>
    </li>`;
    list.insertAdjacentHTML('beforeend', html);
    
    if (!skipSave) {
      addItemDB(currentListName, itemName, qty);
    }
}

  

// Update quantity in DB and UI
async function updateItemQuantity(itemName, delta) {
    const ref = doc(db, `users/${auth.currentUser.uid}/groceryLists/${currentListName}`);
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      let items = snap.exists() ? (snap.data().items || []) : [];

      // Find the item by name
      const idx = items.findIndex(it => it.name === itemName);
      
      if (idx !== -1) {
        items[idx].qty += delta;

        if (items[idx].qty <= 0) {
          items.splice(idx, 1); // remove item completely if qty <= 0
        }
      }

      await tx.set(ref, { items }, { merge: true });
    });

    // update the DOM after transaction
    const span = document.querySelector(`[data-qty-for="${CSS.escape(itemName)}"]`);
    
    if (span) {
      const currentQty = parseInt(span.textContent, 10) || 0;
      const updatedQty = currentQty + delta;

      if (updatedQty > 0) {
        span.textContent = updatedQty;
      } else {
        const li = document.getElementById(`li-${itemName}`);
        if (li) li.remove();
      }
    }
}

// Firestore helpers
async function getItemsDB(name) {
    const snap = await getDoc(doc(db, `users/${auth.currentUser.uid}/groceryLists/${name}`));
    return snap.exists() ? (snap.data().items || []) : [];
  }

async function addItemDB(name, item, qty) {
    const ref = doc(db, `users/${auth.currentUser.uid}/groceryLists/${name}`);
    const snap = await getDoc(ref);
    let items = snap.exists() ? snap.data().items : [];
  
    // Look for existing item
    const existing = items.find(it => it.name === item);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ name: item, qty: qty });
    }
  
    await setDoc(ref, { items }, { merge: true });
  }


  

// Compute and popup best stores by total cost
// function findBestStores() {
//   const items = {};
//   document.querySelectorAll('[data-qty-for]').forEach(el => {
//     const it = el.getAttribute('data-qty-for');
//     items[it] = parseInt(el.textContent, 10);
//   });
//   if (!Object.keys(items).length) {
//     alert('Your list is empty!');
//     return;
//   }
//   const totals = {};
//   for (const [item, qty] of Object.entries(items)) {
//     const info = groceries[item];
//     if (!info) continue;
//     Object.entries(info).forEach(([store, p]) => {
//       const price = p.discount_price ?? p.original_price;
//       if (price != null) totals[store] = (totals[store] || 0) + price * qty;
//     });
//   }
//   const sorted = Object.entries(totals).sort((a, b) => a[1] - b[1]);
//   const lines = sorted.map(([s, t], i) => `${i+1}. ${s}: $${t.toFixed(2)}`);
//   alert('Best stores by total cost:\n' + lines.join('\n'));
// }

//


// copying over calculateDistane and findNearestStore functions from hotdeals.js to reuse here to display store address and distance
// same source used as in autocomplete.js
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) *
              Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  
  async function findNearestStore(storeName, userLat, userLng) {
    const [{ PlacesService }, { LatLng }] = await Promise.all([
      google.maps.importLibrary("places"),
      google.maps.importLibrary("core")
    ]);
    const service = new PlacesService(document.createElement('div'));
    const center  = new LatLng(userLat, userLng);
  
    return new Promise(resolve => {
      service.textSearch({
        location:  center,
        radius:    32186.9, // 20 mile radius
        query:     `${storeName} supermarket`,
        type:      'grocery_or_supermarket'
      }, (results, status) => {
        if (status === 'OK') {

            const match = results.find(r => {
                const dist = calculateDistance(
                  userLat, userLng,
                  r.geometry.location.lat(),
                  r.geometry.location.lng()
                );
                return (
                  r.name.toLowerCase().includes(storeName.toLowerCase()) &&
                  dist <= 20 // 20 mile radius, must refilter again
                );
              });

          if (match) {
            const dist = calculateDistance(
              userLat, userLng,
              match.geometry.location.lat(),
              match.geometry.location.lng()
            ).toFixed(1);
            return resolve({
              address: match.formatted_address,
              distance: dist
            });
          }
        }
        resolve({ address: 'N/A', distance: '—' });
      });
    });
  }
  
  // function to calculate total for all items in list for each store and compare totals to each store 
  async function findBestStores() {
    const items = {};
    document.querySelectorAll('[data-qty-for]').forEach(el => {
      items[el.getAttribute('data-qty-for')] = +el.textContent;
    });
  
    if (!Object.keys(items).length) {
      alert("Your list is empty!");
      return;
    }
  
    const totals = {};
    for (let [item, qty] of Object.entries(items)) {
      const info = groceries[item];
      if (!info) continue;
  
      for (let [rawStore, p] of Object.entries(info)) {
        const store = rawStore.replace(/\s*(Supermarket|Grocery)$/i, '').trim();
        const price = p.discount_price ?? p.original_price;
        totals[store] = (totals[store] || 0) + price * qty;
      }
    }
  
    const sorted = Object.entries(totals).sort((a, b) => a[1] - b[1]);
  
    const userDoc = await getDoc(doc(db, `users/${auth.currentUser.uid}`));
    const { lat: userLat, lng: userLng } = userDoc.data().address;
  
    const enriched = await Promise.all(
      sorted.map(async ([store, cost], idx) => {
        const { address, distance } = await findNearestStore(store, userLat, userLng);
        return {
          rank: idx + 1,
          store,
          cost: cost.toFixed(2),
          address,
          distance
        };
      })
    );
  
    console.log("Best stores enriched:", enriched);
  
    if (enriched.some(store => store.address !== 'N/A' && store.distance !== '—')) {
        const modalBody = document.getElementById('bestStoresModalBody');
    
        modalBody.innerHTML = enriched
          .filter(store => store.address !== 'N/A' && store.distance !== '—') // only real stores
          .map(store => `
            <div class="mb-3">
              <h5>${store.rank}. ${store.store}</h5>
              <p>
                <strong>Cost:</strong> $${store.cost}<br>
                <strong>Address:</strong> ${store.address}<br>
                <strong>Distance:</strong> ${store.distance} mi
              </p>
            </div>
          `).join('');
    
        const bestStoresModal = new bootstrap.Modal(document.getElementById('bestStoresModal'));
        bestStoresModal.show();
    }
    else {
        const modalBody = document.getElementById('bestStoresModalBody');
        modalBody.innerHTML = `
          <div class="text-center">
            <h5>No stores available.</h5>
            <p>Please try searching again or adjust your location.</p>
          </div>
        `;
    
        const bestStoresModal = new bootstrap.Modal(document.getElementById('bestStoresModal'));
        bestStoresModal.show();
    }
    
  }
