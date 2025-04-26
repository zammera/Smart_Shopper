import {db, auth } from "./firebaseInit.js";
import { setDoc, getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Adds the items to the selected list when selected on the history or hot deals page
async function addItemDB(listName, itemName, quantity){
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const ref = doc(db, `users/${user.uid}/groceryLists/${listName}`);
        // Toast notification
        const toast = new bootstrap.Toast(document.getElementById('addToListToast'));
        const toastText = document.getElementById('toastText');

    try {
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            // Create the document with the first item if it doesn't exist yet
            await setDoc(ref, {
                items: {
                    [itemName]: quantity
                }
            });
            // console.log(`Created new list "${listName}" and added ${itemName} (x${quantity}).`);
            toastText.innerHTML = `Created new list "${listName}" and added ${itemName} (x${quantity}).`;
        } else {
            const data = snapshot.data();
            const existingQty = data.items?.[itemName] || 0;
            const newQty = existingQty + 1;


            await updateDoc(ref, {
                [`items.${itemName}`]: newQty
            });
            // console.log(`Added ${itemName} (x${quantity}) to list "${listName}". Total now: ${newQty}`);
            toastText.innerHTML = `Added ${itemName} (x${quantity}) to list "${listName}". Total now: ${newQty}`;
        }
        toast.show();

    } catch (error) {
        console.error("Error adding item to Firestore:", error);
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
    let selectedList = JSON.parse(localStorage.getItem('selectedList')) || [];

    $(document).on('click', '.addItem', function() {
        if (selectedList == []) {
            console.log('No list was selected');
            exit;
        }
        console.log(selectedList);
        const item = $(this).data("item");
        
        // Add item to shopping list (to be implemented later)
        // Need to check if item is in list already later
        console.log(item);

        addItemDB(selectedList, item, 1);
    });
}

/*
Not currently usable

  // Function to add item to shopping list
function addToShoppingList(item, price, store) {
    // Check if shopping list exists in localStorage
    let shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    
    // Add new item to the list
    shoppingList.push({
        item: item,
        price: price,
        store: store,
        added: new Date().toISOString()
    });
    
    // Save updated list to localStorage
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    
    console.log(`Added to shopping list: ${item} - $${price} at ${store}`);
}

// Uses local storage


/* local storage usage
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
        console.log(selectedList);
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

*/