// Adds the items to the selected list when selected on the history or hot deals page

function addItemToList(listKey, itemName, quantity) {
    let list = JSON.parse(localStorage.getItem(listKey)) || {};
    list[itemName] = (list[itemName] || 0) + quantity;
    localStorage.setItem(listKey, JSON.stringify(list));
}

function updateItemQuantity(listKey, itemName, newQuantity) {
    let list = JSON.parse(localStorage.getItem(listKey)) || {};
    if (newQuantity > 0) {
        list[itemName] = newQuantity;
    } else {
        delete list[itemName];
    }
    localStorage.setItem(listKey, JSON.stringify(list));
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
*/

$(document).ready(function () {
    let selectedList = JSON.parse(localStorage.getItem('selectedList')) || [];

    $(document).on('click', '.addItem', function() {
        if (selectedList == []) {
            console.log('No list was selected');
            exit;
        }
        // console.log(selectedList);
        const item = $(this).data("item");
        
        // Add item to shopping list (to be implemented later)
        // Need to check if item is in list already later
        console.log(item);
        if (selectedList.hasOwnProperty(item)) {
            updateItemQuantity(selectedList, item, selectedList[item])
        } else {
            addItemToList(selectedList, item, 1);
        }
        
        // Show toast notification
        const toast = new bootstrap.Toast(document.getElementById('addToListToast'));
        toast.show();
    });
});