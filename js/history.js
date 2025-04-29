import { db, auth } from "./firebaseInit.js";
import { getDoc, getDocs, updateDoc, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

let selectedListName = null;

// Fetch store items
// https://dmitripavlutin.com/javascript-fetch-async-await/
const getStoreItemsData = async () => {
    try {
        const response = await fetch('items.json');
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error loading store items:", err);
        return {};
    }
};

// this function awaits the retrieval of the data on all items in stores as well as what items are in lists
const generateItems = async () => {
    console.log("Starting to generate items...");
    const listItems = await getListItems();
    console.log("Fetched listItems:", listItems);

    const allStoreItems = await getStoreItemsData();
    console.log("Fetched allStoreItems:", allStoreItems);

    // https://www.freecodecamp.org/news/javascript-array-of-objects-tutorial-how-to-create-update-and-loop-through-objects-using-js-array-methods/
    const itemsArray = [];

    // for each item in a list it tries to find the cheapest store option and pushes that to a new array
    for (let i = 0; i < listItems.length; i++) {
        const userItem = listItems[i];

        // 🛑 Skip undefined or blank item names
        if (!userItem.item || userItem.item === "undefined" || userItem.item.trim() === "") {
            console.warn(`Skipping invalid item: ${userItem.item}`);
            continue;
        }

        const storeInfo = allStoreItems[userItem.item] || null;

        if (storeInfo) {
            const cheapestList = await getCheapestItems({ [userItem.item]: storeInfo });
            const cheapest = cheapestList[0];
            itemsArray.push({
                item: userItem.item,
                original_price: cheapest.original_price,
                discount_price: cheapest.discount_price,
                store: cheapest.store,
                frequency: userItem.frequency,
                recency: userItem.recency
            });
        } else {
            // Show something friendly if no pricing is found
            itemsArray.push({
                item: userItem.item,
                original_price: 0,
                discount_price: null,
                store: "Store Info Unavailable",
                frequency: userItem.frequency,
                recency: userItem.recency
            });
        }
    }

    console.log("Built itemsArray:", itemsArray);

    getDiscountedItems(itemsArray);
    getFrequentItems(itemsArray);
    getRecentItems(itemsArray);
};

// these functions serve to display the items that have been added to the respective arrays
// items with a discount use the second function
// https://stackoverflow.com/questions/4191386/jquery-how-to-find-an-element-based-on-a-data-attribute-value
function postItem(item, containerName) {
    // create a new div and construct the inner html to assign all needed information
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

function getDiscountedItems(items) {
    items.forEach(item => {
        if (item.discount_price != null) {
            postItemWithSale(item, 'discountedItemsContainer');
        }
    });
}

// get the top 10 most frequently appearing items (at least two appearances)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort 
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

// compare all the stores for each item and get the cheapest one, then push that to a new array
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

// retrieve the lists connected to the user's account from firebase
// https://firebase.google.com/docs/reference/js/v8/firebase.database.DataSnapshot
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

    // for each list grab the items
    for (const listDoc of querySnapshot.docs) {
        const list = doc(db, `users/${user.uid}/groceryLists/${listDoc.id}`);
        const snapshot = await getDoc(list);
        const data = snapshot.data();

        const items = data.items || {};

        // check if the item already exists in the array, in which case update the frequency and recency
        // otherwise add a new item to the array
        if (Array.isArray(items)) {
            for (const entry of items) {
                if (!entry.name || entry.name === "undefined" || entry.name.trim() === "") {
                    console.warn("Skipping invalid item entry:", entry);
                    continue;
                }
                recency++;
                const existingItem = listItems.find(item => item.item === entry.name);
                if (existingItem) {
                    existingItem.frequency += entry.qty;
                    existingItem.recency = recency;
                } else {
                    listItems.push({
                        item: entry.name,
                        frequency: entry.qty,
                        recency: recency
                    });
                }
            }
        } else {
            for (const newItem in items) {
                if (!newItem || newItem === "undefined" || newItem.trim() === "") {
                    console.warn("Skipping invalid item:", newItem);
                    continue;
                }
                recency++;
                const frequency = typeof items[newItem] === 'number' ? items[newItem] : 1;
                const existingItem = listItems.find(item => item.item === newItem);
                if (existingItem) {
                    existingItem.frequency += frequency;
                    existingItem.recency = recency;
                } else {
                    listItems.push({
                        item: newItem,
                        frequency: frequency,
                        recency: recency
                    });
                }
            }
        }
    }
    return listItems;
};

// get the name of the lists a user has and allow them to pick which one to add to
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
                    option.value = docSnap.id;
                    option.setAttribute('data-list-name', listData.name);
                    option.textContent = listData.name;
                    listSelector.appendChild(option);
                }
            });

            listSelector.addEventListener('change', async (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                selectedListName = selectedOption.value;
                const selectedListDisplayName = selectedOption.getAttribute('data-list-name');
                console.log("Selected document ID:", selectedListName);
                console.log("Displayed list name:", selectedListDisplayName);

                document.getElementById('discountedItemsContainer').innerHTML = "";
                document.getElementById('frequentItemsContainer').innerHTML = "";
                document.getElementById('recentItemsContainer').innerHTML = "";

                await generateItems();
            });
        }
    });
}

// ensure there is a list to add items to
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
        let currentItems = listData.items || [];

        if (!Array.isArray(currentItems)) {
            currentItems = Object.entries(currentItems).map(([name, qty]) => ({
                name,
                qty
            }));
        }

        const existingItem = currentItems.find(item => item.name === itemName);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            currentItems.push({ name: itemName, qty: 1 });
        }

        await updateDoc(listRef, { items: currentItems });

        console.log(`✅ Added ${itemName} to list (document ID): ${selectedListName}`);
        showToast(`${itemName} added!`, 'success');
    } catch (error) {
        console.error("Error adding item:", error);
    }
}

// visually confirm that an item has been added with this brief notification
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

async function init() {
    populateListSelector();
    generateItems();
}

$(document).on('click', '.addItem', function () {
    const itemName = $(this).data('item');
    addItemToSelectedList(itemName);
});
