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
  
    const listNameElem = document.getElementById('listName');
    if (listNameElem) {
      listNameElem.textContent = currentListName;
    }
  
    // Load saved quantities
    getItemsDB(currentListName).then(items => {
      Object.entries(items).forEach(([item, qty]) => addToList(item, qty));
    });
  
    // Setup search filter
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
  const btn = e.target;
  if (btn.matches('.addToList')) {
    addToList(btn.dataset.item, 1);
  } else if (btn.matches('.incrementItem')) {
    updateItemQuantity(btn.dataset.item, 1);
  } else if (btn.matches('.decrementItem')) {
    updateItemQuantity(btn.dataset.item, -1);
  } else if (btn.matches('.removeItem')) {
    updateItemQuantity(btn.dataset.item, -9999);
  } else if (btn.matches('#findBestStores')) {
    findBestStores();
  }
});

// Add item to UI and DB
function addToList(itemName, qty) {
  const list = document.getElementById('myList');
  const existing = list.querySelector(`[data-item="${itemName}"]`);
  if (existing) {
    updateItemQuantity(itemName, qty);
    return;
  }
  const html = `
    <li class="list-group-item d-flex align-items-center" id="li-${itemName}">
      <button class="btn btn-close removeItem me-2" data-item="${itemName}"></button>
      <div class="flex-grow-1">${normalizeUnits(itemName)}</div>
      <div class="btn-group">
        <button class="btn btn-sm decrementItem" data-item="${itemName}">-</button>
        <span class="px-2" data-qty-for="${itemName}">${qty}</span>
        <button class="btn btn-sm incrementItem" data-item="${itemName}">+</button>
      </div>
    </li>`;
  list.insertAdjacentHTML('beforeend', html);
  addItemDB(currentListName, itemName, qty);
}

// Update quantity in DB and UI
async function updateItemQuantity(itemName, delta) {
  const ref = doc(db, `users/${auth.currentUser.uid}/groceryLists/${currentListName}`);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const items = snap.exists() ? snap.data().items : {};
    const oldQty = items[itemName] || 0;
    const newQty = oldQty + delta;
    if (newQty > 0) {
      items[itemName] = newQty;
      tx.set(ref, { items }, { merge: true });
      document.querySelector(`[data-qty-for="${itemName}"]`).textContent = newQty;
    } else {
      delete items[itemName];
      tx.set(ref, { items }, { merge: true });
      document.getElementById(`li-${itemName}`).remove();
    }
  });
}

// Firestore helpers
async function getItemsDB(name) {
  const snap = await getDoc(doc(db, `users/${auth.currentUser.uid}/groceryLists/${name}`));
  return snap.exists() ? snap.data().items : {};
}
async function addItemDB(name, item, qty) {
  const ref = doc(db, `users/${auth.currentUser.uid}/groceryLists/${name}`);
  const snap = await getDoc(ref);
  const items = snap.exists() ? snap.data().items : {};
  items[item] = (items[item] || 0) + qty;
  await setDoc(ref, { items }, { merge: true });
}

// Compute and popup best stores by total cost
function findBestStores() {
  const items = {};
  document.querySelectorAll('[data-qty-for]').forEach(el => {
    const it = el.getAttribute('data-qty-for');
    items[it] = parseInt(el.textContent, 10);
  });
  if (!Object.keys(items).length) {
    alert('Your list is empty!');
    return;
  }
  const totals = {};
  for (const [item, qty] of Object.entries(items)) {
    const info = groceries[item];
    if (!info) continue;
    Object.entries(info).forEach(([store, p]) => {
      const price = p.discount_price ?? p.original_price;
      if (price != null) totals[store] = (totals[store] || 0) + price * qty;
    });
  }
  const sorted = Object.entries(totals).sort((a, b) => a[1] - b[1]);
  const lines = sorted.map(([s, t], i) => `${i+1}. ${s}: $${t.toFixed(2)}`);
  alert('Best stores by total cost:\n' + lines.join('\n'));
}

/* Unused

$(document).ready(function () {
    
    const listName = document.getElementById("listName").textContent;
    const list = getItemsDB(listName) || {};

    $(document).on('click', '.addToList', function() {
        const item = $(this).data("item");
        addToList(item);
    });

    $(document).on('click', '.removeItem', function() {
        const list = JSON.parse(localStorage.getItem(listName)) || {};
        const item = $(this).data("item");
        if (list[item]) {
            delete list[item]; 
            localStorage.setItem(listName, JSON.stringify(list)); 
        }
        let element = document.getElementById(item);
        element.remove();
    });

    
    $(document).on('click', '.incrementItem', function() {
        const item = $(this).data("item");
        updateItemQuantity(listName, item, list[item] + 1);
    });

    $(document).on('click', '.decrementItem', function() {
        const list = JSON.parse(localStorage.getItem(listName)) || {};
        const item = $(this).data("item");
        if (list[item] == 1) {
            if (list[item]) {
                delete list[item]; 
                localStorage.setItem(listName, JSON.stringify(list)); 
            }
            let element = document.getElementById(item);
            element.remove();
        }
        else {
            updateItemQuantity(listName, item, list[item] - 1);
        }
    });
}); 
*/
