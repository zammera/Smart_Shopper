import { db, auth } from "./firebaseInit.js";
import { getDoc, getDocs, updateDoc, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

let selectedListName = null;

// Fetch store items
const getStoreItemsData = async () => {
    try {
        const response = await fetch('./items.json');
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error loading store items:", err);
    }
};

// Create combined array of user's items + store items
const generateItems = async () => {
    console.log("Starting to generate items...");
    const listItems = await getListItems();
    console.log("Fetched listItems:", listItems);

    const allStoreItems = await getStoreItemsData();
    console.log("Fetched allStoreItems:", allStoreItems);

    const storeItems = await getCheapestItems(allStoreItems);
    console.log("Cheapest storeItems:", storeItems);

    const itemsArray = [];

    for (let i = 0; i < storeItems.length; i++) {
        const item = listItems.find(item => item.item === storeItems[i].item);
        if (item !== undefined) {
            itemsArray.push({
                item: storeItems[i].item,
                original_price: storeItems[i].original_price,
                discount_price: storeItems[i].discount_price,
                store: storeItems[i].store,
                frequency: item.frequency,
                recency: item.recency
            });
        }
    }
    console.log("Built itemsArray:", itemsArray);

    getDiscountedItems(itemsArray);
    getFrequentItems(itemsArray);
    getRecentItems(itemsArray);
};


// Post helper functions
function postItem(item, containerName) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.innerHTML = `
        <div class="itemName">${item.item}</div>
        <div class="itemInfoContainer">
            <div class="itemPrice">$${item.original_price.toFixed(2)}</div>
            <div class="itemStore">${item.store}</div>
        </div>
        <div class="addItemContainer">
            <button class="btn btn-primary w-100 addItem" data-item="${item.item}">Add to Shopping List</button>
        </div>
    `;
    document.getElementById(containerName).appendChild(itemDiv);
}

function postItemWithSale(item, containerName) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.innerHTML = `
        <div class="itemName">${item.item}</div>
        <div class="itemInfoContainer">
            <div class="itemPrice">
                <s>$${item.original_price.toFixed(2)}</s>
                <span class="salePrice"> $${item.discount_price.toFixed(2)}</span>
            </div>
            <div class="itemStore">${item.store}</div>
        </div>
        <div class="addItemContainer">
            <button class="btn btn-primary w-100 addItem" data-item="${item.item}">Add to Shopping List</button>
        </div>
    `;
    document.getElementById(containerName).appendChild(itemDiv);
}

// Post items into the sections
function getDiscountedItems(items) {
    items.forEach(item => {
        if (item.discount_price != null) {
            postItemWithSale(item, 'discountedItemsContainer');
        }
    });
}

function getFrequentItems(itemsArray) {
    const items = [...itemsArray].sort((a, b) => b.frequency - a.frequency).slice(0, 10);
    items.forEach(item => {
        if (item.frequency > 1) {
            item.discount_price != null
                ? postItemWithSale(item, 'frequentItemsContainer')
                : postItem(item, 'frequentItemsContainer');
        }
    });
}

function getRecentItems(itemsArray) {
    const items = [...itemsArray].sort((a, b) => b.recency - a.recency).slice(0, 10);
    items.forEach(item => {
        item.discount_price != null
            ? postItemWithSale(item, 'recentItemsContainer')
            : postItem(item, 'recentItemsContainer');
    });
}

// Find cheapest store
const getCheapestItems = async (itemList) => {
    const cheapestItems = [];

    for (const itemName in itemList) {
        let lowestPrice = Infinity;
        let cheapestStore = null;
        let originalPrice = null;
        let discountPrice = null;

        const stores = itemList[itemName];
        for (const store in stores) {
            const priceInfo = stores[store];
            if ((priceInfo.discount_price != null && lowestPrice > priceInfo.discount_price)
                || (priceInfo.original_price != null && lowestPrice > priceInfo.original_price)) {
                lowestPrice = priceInfo.discount_price || priceInfo.original_price;
                cheapestStore = store;
                originalPrice = priceInfo.original_price;
                discountPrice = priceInfo.discount_price;
            }
        }
        cheapestItems.push({
            item: itemName,
            store: cheapestStore,
            original_price: originalPrice,
            discount_price: discountPrice
        });
    }

    return cheapestItems;
};

// Get user's list items
const getListItems = async () => {
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return [];
    }

    const listItems = [];
    let recency = 0;
    const groceryListsCollection = collection(db, `users/${user.uid}/groceryLists`);
    const querySnapshot = await getDocs(groceryListsCollection);

    for (const listDoc of querySnapshot.docs) {
        const list = doc(db, `users/${user.uid}/groceryLists/${listDoc.id}`);
        const snapshot = await getDoc(list);
        const data = snapshot.data();

        for (const newItem in data.items) {
            recency++;
            const item = listItems.find(item => item.item === newItem);
            if (item !== undefined) {
                item.frequency += data.items?.[newItem];
                item.recency = recency;
            } else {
                listItems.push({
                    item: newItem,
                    frequency: data.items?.[newItem],
                    recency: recency
                });
            }
        }
    }
    return listItems;
};

// Populate the dropdown
function populateListSelector() {
    const listSelector = document.getElementById('listSelector');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const listsRef = collection(db, `users/${user.uid}/groceryLists`);
            const snapshot = await getDocs(listsRef);

            snapshot.forEach(docSnap => {
                const listData = docSnap.data();
                if (listData.name && listData.name !== "Hot Deals List") {
                    const option = document.createElement('option');
                    option.value = docSnap.id; // document id
                    option.setAttribute('data-list-name', listData.name);
                    option.textContent = listData.name;
                    listSelector.appendChild(option);
                }
            });

            listSelector.addEventListener('change', async (e) => {
                selectedListName = e.target.value; 
                console.log("Selected list ID (document ID):", selectedListName);

                // Clear old items first
                document.getElementById('discountedItemsContainer').innerHTML = "";
                document.getElementById('frequentItemsContainer').innerHTML = "";
                document.getElementById('recentItemsContainer').innerHTML = "";

                // Now generate the items
                await generateItems();
            });
        }
    });
}



// Add item to selected list
async function addItemToSelectedList(itemName) {
    if (!selectedListName) {
        alert("Please select a list first!");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in.");
        return;
    }

    const listRef = doc(db, `users/${user.uid}/groceryLists/${selectedListName}`);
    try {
        const listSnap = await getDoc(listRef);
        if (!listSnap.exists()) {
            console.error("Selected list not found.");
            return;
        }

        const listData = listSnap.data();
        const currentItems = listData.items || {};

        if (currentItems[itemName]) {
            currentItems[itemName] += 1;
        } else {
            currentItems[itemName] = 1;
        }

        await updateDoc(listRef, { items: currentItems });
        console.log(`✅ Added ${itemName} to list (document ID): ${selectedListName}`);
        showToast(`${itemName} added!`, 'success');
    } catch (error) {
        console.error("Error adding item:", error);
    }
}


// Toasts
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('addToListToast');
    const toastBody = document.getElementById('toastText');

    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastContainer);
    toast.show();
}

// Main startup
$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User logged in:", user.uid);
            init();
        }
    });
});

// Initialize
async function init() {
    populateListSelector();
    // DON'T call generateItems() here anymore
}

// Listen for add item clicks
$(document).on('click', '.addItem', function () {
    const itemName = $(this).data('item');
    addItemToSelectedList(itemName);
});
