import {db, auth } from "./firebaseInit.js";
import { setDoc, getDoc, updateDoc, deleteField, deleteDoc, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

let groceries = {};

// grocery items loaded from the json
async function loadGroceries() {
    try {
        const response = await fetch('items.json'); 
        groceries = await response.json();
        populateGrocery(); // After loading, call populate
    } catch (error) {
        console.error("Error loading groceries.json:", error);
    }
}


function populateGrocery() {
    var LorR = false;
    for (const itemName in groceries) {
        const safeId = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-result';
        const grocery = '<li class="list-group-item d-flex justify-content-between align-items-center" id="${safeId}">'
                + '<h5 class="text-center flex-grow-1">' + itemName + '</h5>'
                + '<button class="btn btn-custom-color addToList" data-item="' + itemName + '">Add to List</button>'
            + '</li>';

        const element = LorR ? document.getElementById("result2") : document.getElementById("result1");
        LorR = !LorR;
        element.innerHTML += grocery;
    }
}


async function addToList(item) {
    let name = document.getElementById("listName").textContent;
    let list = await getItemsDB(name) || {};
   
    if(list.hasOwnProperty(item)) {
        if(document.getElementById(item)) {
            console.log(item + " is in list and in HTML")
            console.log(list[item]);
            updateItemQuantity(name, item, list[item] + 1);
        } else {
            console.log(item + " is in list and not in HTML", list[item]);
            let html = '<li class="list-group-item d-flex justify-content-between align-items-center" id="' + item + '">'
                    + '<button class="btn btn-close btn-danger  removeItem" data-item="' + item + '"></button>'
                    + '<h5 class="text-center flex-grow-1">' + item + '</h5>'
                    + '<div class="btn-group" role="group" aria-label="Basic example">'
                        + '<button type="button" class="btn btn-danger decrementItem" data-item="' + item + '">-</button>'
                        + '<button type="button" class="form-control middle text-center" data-itemValue ="' + item + 'Value" value="' + list[item] + '" disabled>'+ list[item] +'</button>'
                        + '<button type="button" class="btn btn-success incrementItem" data-item="' + item + '">+</button>'
                    + '</div>'
                + '</li>';
            let element = document.getElementById("myList");
            element.innerHTML += html;

            console.log(name);
        }
    } else {
        console.log(item + " is not in list and not in HTML ");
        let html = '<li class="list-group-item d-flex justify-content-between align-items-center" id="' + item + '">'
                    + '<button class="btn btn-close btn-danger  removeItem" data-item="' + item + '"></button>'
                    + '<h5 class="text-center flex-grow-1">' + item + '</h5>'
                    + '<div class="btn-group" role="group" aria-label="Basic example">'
                        + '<button type="button" class="btn btn-danger decrementItem" data-item="' + item + '">-</button>'
                        + '<button type="button" class="form-control middle text-center" data-itemValue ="' + item + 'Value" value="1" disabled>1</button>'
                        + '<button type="button" class="btn btn-success incrementItem" data-item="' + item + '">+</button>'
                    + '</div>'
                + '</li>';
        let element = document.getElementById("myList");
        element.innerHTML += html;
        //console.log(html);
        addItemDB(name, item, 1)
        //addItemToList(name, item, 1);
    }
}

async function updateItemQuantity(listKey, itemName, newQuantity) {
    console.log(newQuantity);
    let list = await getItemsDB(listKey) || {};
    console.log("list gotten from updateQuantity:", list);
    if (newQuantity > 0) {
        //list[itemName] = newQuantity;
        console.log("Value of item before increase: ", $(document).find('[data-itemValue = "' + itemName + 'Value"]')[0].value);
        $('[data-itemValue="' + itemName + 'Value"]').val(newQuantity);
        $('[data-itemValue="' + itemName + 'Value"]').text(newQuantity);
        //$(document).find('[data-itemValue = "' + itemName + 'Value"')[0].value = newQuantity;
        console.log("Value of item after increase: ",$(document).find('[data-itemValue = "' + itemName + 'Value"]')[0].value);
        addItemDB(listKey, itemName, newQuantity);
    } else {
        delete list[itemName];
        deleteItemDB(listKey, itemName)
    }
    
    //localStorage.setItem(listKey, JSON.stringify(list));
}

if ($('body').is('#editList')) {
    (async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('name');
        await loadGroceries();  // <-- now allowed because it's inside an async IIFE!

        let header = '<h1 class="text-center" id="listName">'+ name + '</h1>';
        $("#list").prepend(header);
    
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User logged in:", user.uid);

                const currentList = await getItemsDB(name);

                console.log("Loading items into HTML:", currentList);

                for (const [key, value] of Object.entries(currentList)) {
                    console.log(`Item: ${key}, Quantity: ${value}`);
                    addToList(key);
                }
            } else {
                console.warn("User not logged in.");
            }
        });
    })(); // iife 
}

$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User logged in:", user.uid);
            init();
        }
    });

    // search bar logic for edit list page
    $("#searchBar").on("input", function () {
        const query = $(this).val().toLowerCase();
        let matchCount = 0;
    
        for (const itemName in groceries) {
            const safeId = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-result';
            const $element = $(`#${safeId}`);
    
            if (itemName.toLowerCase().includes(query)) {
                $element.removeClass("hidden-result");
                matchCount++;
            } else {
                $element.addClass("hidden-result");
            }
        }
    
        console.log(`Search for "${query}" matched ${matchCount} item(s).`);
    });
    
    
});


async function init() {
    const listName = document.getElementById("listName").textContent;
    const list = await getItemsDB(listName) || {};

    $(document).on('click', '.addToList', function () {
        const item = $(this).data("item");
        addToList(item);
    });

    $(document).on('click', '.removeItem', async function () {
        const item = $(this).data("item");

        const element = document.getElementById(item);
        if (element) element.remove();

        await updateItemQuantity(listName, item, 0); // update DB
    });

    $(document).on('click', '.incrementItem', async function () {
        const item = $(this).data("item");
        const input = $('[data-itemvalue="' + item + 'Value"]');
        const currentQty = parseInt(input.val()) || 0;
        const newQty = currentQty + 1;

        input.val(newQty);
        await updateItemQuantity(listName, item, newQty);
    });

    $(document).on('click', '.decrementItem', async function () {
        const item = $(this).data("item");
        const input = $('[data-itemvalue="' + item + 'Value"]');
        const currentQty = parseInt(input.val()) || 0;
        const newQty = currentQty - 1;

        if (newQty <= 0) {
            const element = document.getElementById(item);
            if (element) element.remove();
            await updateItemQuantity(listName, item, 0); // update DB
        } else {
            input.val(newQty);
            await updateItemQuantity(listName, item, newQty);
        }
    });
}

//Database Functions

async function addItemDB(listName, itemName, quantity){
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const ref = doc(db, `users/${user.uid}/groceryLists/${listName}`);

    try {
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            // Create the document with the first item if it doesn't exist yet
            await setDoc(ref, {
                items: {
                    [itemName]: quantity
                }
            });
            console.log(`Created new list "${listName}" and added ${itemName} (x${quantity}).`);
        } else {
            const data = snapshot.data();
            //const existingQty = data.items?.[itemName] || 0;


            await updateDoc(ref, {
                [`items.${itemName}`]: quantity
            });

            console.log(`Added ${itemName} (x${quantity}) to list "${listName}". Total now: ${quantity}`);
        }
    } catch (error) {
        console.error("Error adding item to Firestore:", error);
    }
}

async function getItemsDB(listName) {
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const ref = doc(db, `users/${user.uid}/groceryLists/${listName}`);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        console.warn(`List "${listName}" not found.`);
        return {}; // Return an empty object instead of NULL (JavaScript uses null or undefined, but NULL is invalid)
    }

    const data = snapshot.data();
    const items = data.items || {};

    console.log(`Items from "${listName}":`, items);

    return items;
}

async function deleteItemDB(listName, itemName){
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const listRef = doc(db, `users/${user.uid}/groceryLists/${listName}`);
    try {
        await updateDoc(listRef, {
            [`items.${itemName}`]: deleteField()
        });
        console.log(`Item '${itemName}' deleted from list '${listName}'`);
    } catch (error) {
        console.error("Error deleting item:", error);
    }
}



/* Unused
// items in json is all lowercase to make it easier to add items. Title case to display
function toTitleCase(str) {
    const lowerWords = ['lb', 'oz', 'ct', 'pack', 'each', 'g', 'mg', 'kg', 'l', 'ml', 'bunch'];
    
    return str.split(' ').map(word => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        
        if (lowerWords.includes(cleanWord)) {
            return word.toLowerCase(); 
        } else {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    }).join(' ');
}

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