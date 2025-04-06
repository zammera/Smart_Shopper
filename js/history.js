const getItemsData = async () => {
    let items = await fetch(`./files/history.json`)
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
    const itemsArray = [];
    const items = await getItemsData();
    for (let i = 0; i < items.length; i++) {
        const item = itemsArray.find(item => item.item === items[i].item);
        if (item === undefined) {
            itemsArray.push(    {"item": items[i].item, "original_price" : items[i].original_price, "discount_price" : items[i].discount_price,
                                "store" : items[i].store, "frequency" : 1, "recency": i});
        }
        else {
            // if (items[i].discount_price === null )
            item.frequency += 1;
            item.recency = i;
            // put code to overwrite store if the lowest price of this item is lower than the lowest price of the item in the array
            if (items[i].discount_price < item.discount_price || items[i].original_price < item.original_price) {

            }
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
            + '<button class="btn btn-primary w-100 addItem">Add to Shopping List</button>'
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
    console.log(items);
    const limit = items.length < 10 ? items.length : 10;
    for (let i = 0; i < limit; i++) {
        if (items[i].discount_price != null) {
            postItemWithSale(items[i], 'recentItemsContainer');
        } else {
            postItem(items[i], 'recentItemsContainer');
        }
    }
}


function addItemToList(listKey, itemName, quantity) {
    let list = JSON.parse(localStorage.getItem(listKey)) || {};
    list[itemName] = (list[itemName] || 0) + quantity;
    localStorage.setItem(listKey, JSON.stringify(list));
}

$(document).ready(function () {
    let selectedList = JSON.parse(localStorage.getItem('selectedList')) || [];

    $(document).on('click', '.addItem', function() {
        if (selectedList == []) {
            console.log('No list was selected');
            exit;
        }

        const item = $(this).data("item");
        
        // Add item to shopping list (to be implemented later)
        // Need to check if item is in list already later
        console.log(item);
        addItemToList(selectedList, item, 1);
        
        // Show toast notification
        const toast = new bootstrap.Toast(document.getElementById('addToListToast'));
        toast.show();
    });
});

generateItems();