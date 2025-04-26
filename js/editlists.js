import {db, auth } from "./firebaseInit.js";
import { setDoc, getDoc, updateDoc, deleteField, deleteDoc, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const listNames = [
    {"name":"Taco Tuesday"}
]

const groceries = [
    {"item": "Organic Bananas", "price": "", "store": ""},
    {"item": "Whole Milk", "price": "", "store": ""},
    {"item": "Salmon Fillet", "price": "", "store": ""},
    {"item": "Loaf of Bread", "price": "", "store": ""},
    {"item": "Strawberries", "price": "", "store": ""},
    {"item": "Ground Beef", "price": "", "store": ""},
    {"item": "Canned Tomatoes", "price": "", "store": ""},
    {"item": "Chicken Breast", "price": "", "store": ""},
    {"item": "Pasta", "price": "", "store": ""},
    {"item": "Eggs (dozen)", "price": "", "store": ""},
    {"item": "Apples", "price": "", "store": ""},
    {"item": "Olive Oil", "price": "", "store": ""},
    {"item": "Blueberries", "price": "", "store": ""},
    {"item": "Rice", "price": "", "store": ""},
    {"item": "Cereal", "price": "", "store": ""},
    {"item": "Avocado", "price": "", "store": ""},
    {"item": "Cheese", "price": "", "store": ""},
    {"item": "Yogurt", "price": "", "store": ""},
    {"item": "Oranges", "price": "", "store": ""},
    {"item": "Beans", "price": "", "store": ""},
    {"item": "Chips", "price": "", "store": ""},
    {"item": "Jumbo shrimp", "price": "", "store": ""},
    {"item": "Coffee", "price": "", "store": ""},
    {"item": "Grapes", "price": "", "store": ""},
    {"item": "Butter", "price": "", "store": ""},
    {"item": "Lobster tail", "price": "", "store": ""},
    {"item": "Tea", "price": "", "store": ""},
    {"item": "Soda", "price": "", "store": ""},
    {"item": "Kiwi", "price": "", "store": ""},
    {"item": "Honey", "price": "", "store": ""},
    {"item": "Ice cream", "price": "", "store": ""},
    {"item": "Mango", "price": "", "store": ""},
    {"item": "Salt", "price": "", "store": ""},
    {"item": "Cookies", "price": "", "store": ""}
]



function populateGrocery() {
    var LorR = false;
    groceries.forEach(item => {
        let grocery = '<li class="list-group-item d-flex justify-content-between align-items-center" id="' + item.item + 'Result">'
            + '<h5 class="text-center flex-grow-1">' + item.item + '</h5>'
            + '<button class="btn btn-custom-color addToList" data-item="' + item.item + '">Add to List</button></li>';
        var element;
        if(!LorR) {
            element = document.getElementById("result1");
            LorR = !LorR;
        } else {
            element = document.getElementById("result2");
            LorR = !LorR;
        }
        element.innerHTML += grocery;
    });
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

$(function() {
    if ($('body').is('#makeList')) {
        const storedLists = JSON.parse(localStorage.getItem("listNames")) || [];

        storedLists.forEach(list => {
            createListCard(list.name);
        });
    }
    if ($('body').is('#editList')) {
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('name');
        populateGrocery();
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
    }
   
});

$(document).ready(function () {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User logged in:", user.uid);
            init(); // call the async logic from a normal function
        }
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

/* $(document).ready(function () {
    
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
}); */

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
