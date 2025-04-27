import {db, auth } from "./firebaseInit.js";
import { getDoc, getDocs, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const getStoreItemsData = async () => {
    let items = await fetch(`./items.json`)
        .then((response) => { 
            return response.json().then((data) => {
                return data;
            }).catch((err) => {
                console.log(err);
            }) 
        });
    return items;
}

// https://www.freecodecamp.org/news/javascript-array-of-objects-tutorial-how-to-create-update-and-loop-through-objects-using-js-array-methods/
// helpful
// Create an array of all the items in the lists and record their frequency, recency, and sales
const generateItems = async () => {
    const listItems = await getListItems();
    const allStoreItems = await getStoreItemsData();
    const storeItems = await getCheapestItems(allStoreItems);

    const itemsArray = [];

    console.log(storeItems);
    console.log(listItems);
    
    for (let i = 0; i < storeItems.length; i++) {
        // check if the item appears in both lists
        const item = listItems.find(item => item.item === storeItems[i].item);
        if (item != undefined) {
            itemsArray.push(    {"item": storeItems[i].item, "original_price" : storeItems[i].original_price, "discount_price" : storeItems[i].discount_price,
                                "store" : storeItems[i].store, "frequency" : item.frequency, "recency": item.recency});
        }
    }
    console.log(itemsArray);
    getDiscountedItems(itemsArray);
    getFrequentItems(itemsArray);
    getRecentItems(itemsArray);
}

// These two functions append a div with all the needed item information to the given container
function postItem(item, containerName) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.innerHTML ='<div class="itemName">' + item.item + '</div>'
        + '<div class="itemInfoContainer">'
            + '<div class="itemPrice">$'+ item.original_price.toFixed(2) + '</div>'
            + '<div class="itemStore">' + item.store + '</div>'
        + '</div>'
        + '<div class="addItemContainer">'
            + '<button class="btn btn-primary w-100 addItem" data-item="' + item.item + '">Add to Shopping List</button>'
        + '</div>';
    document.getElementById(containerName).appendChild(itemDiv);
}

function postItemWithSale(item, containerName) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.innerHTML ='<div class="itemName">' + item.item + '</div>'
        + '<div class="itemInfoContainer">'
            + '<div class="itemPrice">'
                + '<s>$'+ item.original_price.toFixed(2) + '</s>'
                + '<span class="salePrice"> $' + item.discount_price.toFixed(2) + '</span>'
            + '</div>'
            + '<div class="itemStore">' + item.store + '</div>'
        + '</div>'
        + '<div class="addItemContainer">'
            + '<button class="btn btn-primary w-100 addItem" data-item="' + item.item + '">Add to Shopping List</button>'
        + '</div>';
    document.getElementById(containerName).appendChild(itemDiv);
}

/*
+ '<div class="itemImageContainer">'
            + '<img src="' + item.url + '" class ="itemImage">'
        + '</div>'
*/

// post all the items with discounts
// maybe in the future set some sort of limit on this
function getDiscountedItems(items) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].discount_price != null) {
            postItemWithSale(items[i], 'discountedItemsContainer');
        }
    }
}

// sort items by their frequency and post either the first 10 or however many are in the array if they have a frequency over 1
function getFrequentItems(itemsArray) {
    const items = itemsArray.sort((item1, item2) => (item1.frequency < item2.frequency) ? 1 : (item1.frequency > item2.frequency) ? -1 : 0);
    const limit = items.length < 10 ? items.length : 10;
    for (let i = 0; i < limit; i++) {
        if (items[i].frequency > 1) {
            if (items[i].discount_price != null) {
                postItemWithSale(items[i], 'frequentItemsContainer');
            } else {
                postItem(items[i], 'frequentItemsContainer');
            }
        }
    }
}

// post the most recently added items
function getRecentItems(itemsArray) {
    const items = itemsArray.sort((item1, item2) => (item1.recency < item2.recency) ? 1 : (item1.recency > item2.recency) ? -1 : 0);
    const limit = items.length < 10 ? items.length : 10;
    for (let i = 0; i < limit; i++) {
        if (items[i].discount_price != null) {
            postItemWithSale(items[i], 'recentItemsContainer');
        } else {
            postItem(items[i], 'recentItemsContainer');
        }
    }
}

// find the cheapest store for a given item
const getCheapestItems = async(itemList) => {

    const cheapestItems = [];

    // go through every item and compare the original_price (or sale_price if available) to the lowest price so far
    // if that is lower, track that store data
    // at the end push the winning store into the cheapestItems array
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
                lowestPrice = priceInfo.discount_price || priceInfo.original_price
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
        })
    }

    return cheapestItems;
}

// get the lists the user has created and then add the items on those lists
const getListItems = async() => {
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }
    try {
        // get all lists
        const groceryListsCollection = collection(db, `users/${user.uid}/groceryLists`);
        const querySnapshot = await getDocs(groceryListsCollection);
        const listItems = [];
        var recency = 0;

        // iterate through each list
        for (const listDoc of querySnapshot.docs) {
            const list = doc(db, `users/${user.uid}/groceryLists/${listDoc.id}`);
            const snapshot = await getDoc(list);
            const data = snapshot.data();

            // iterate through the items in each list, adding their name and frequency (quantity)
            // if they aren't new update the frequency insteaad
            for (const newItem in data.items) {
                recency++;
                const item = listItems.find(item => item.item === newItem);
                if (item != undefined) {
                    item.frequency += data.items?.[newItem];
                    item.recency = recency;
                } else {
                    listItems.push({
                        item: newItem,
                        frequency: data.items?.[newItem],
                        recency: recency
                    })
                }
            }
        };
        return listItems;

    } catch (error) {
        console.error("Error getting grocery lists:", error);
        return [];
    }
}


$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User logged in:", user.uid);
                init();
            }
    });
});

async function init() {
    generateItems();
}