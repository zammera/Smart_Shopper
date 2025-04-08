const listNames = [
    {"name":"Taco Tuesday"}
]

if (!localStorage.getItem("listNames")) {
    localStorage.setItem("listNames", JSON.stringify(listNames));
}

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

function addToList(item) {
    let name = document.getElementById("listName").textContent;
    let list = JSON.parse(localStorage.getItem(name)) || {};

    if(list.hasOwnProperty(item)) {
        if(document.getElementById(item)) {
            console.log(item + " is in list and in HTML")
            console.log(list[item]);
            updateItemQuantity(name, item, list[item] + 1);
        } else {
            console.log(item + " is in list and not in HTML");
            let html = '<li class="list-group-item d-flex justify-content-between align-items-center" id="' + item + '">'
                    + '<button class="btn btn-close btn-danger  removeItem" data-item="' + item + '"></button>'
                    + '<h5 class="text-center flex-grow-1">' + item + '</h5>'
                    + '<div class="btn-group" role="group" aria-label="Basic example">'
                        + '<button type="button" class="btn btn-danger decrementItem" data-item="' + item + '">-</button>'
                        + '<input type="text" class="form-control middle text-center" data-itemValue ="' + item + 'Value" value="' + list[item]++ + '" disabled>'
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
                        + '<input type="text" class="form-control middle text-center" data-itemValue ="' + item + 'Value" value="1" disabled>'
                        + '<button type="button" class="btn btn-success incrementItem" data-item="' + item + '">+</button>'
                    + '</div>'
                + '</li>';
        let element = document.getElementById("myList");
        element.innerHTML += html;
        console.log(name);
        addItemToList(name, item, 1);
    }
}

function addItemToList(listKey, itemName, quantity) {
    let list = JSON.parse(localStorage.getItem(listKey)) || {};
    list[itemName] = (list[itemName] || 0) + quantity;
    localStorage.setItem(listKey, JSON.stringify(list));
}

function updateItemQuantity(listKey, itemName, newQuantity) {
    console.log(newQuantity);
    let list = JSON.parse(localStorage.getItem(listKey)) || {};
    if (newQuantity > 0) {
        list[itemName] = newQuantity;
        $(document).find('[data-itemValue = "' + itemName + 'Value"')[0].value = newQuantity;
    } else {
        delete list[itemName];
    }
    localStorage.setItem(listKey, JSON.stringify(list));
}

$(function() {
    if ($('body').is('#makeList')) {
        const storedLists = JSON.parse(localStorage.getItem("listNames")) || [];

        storedLists.forEach(list => {
            console.log(list.name);
            createListCard(list.name);
        });
    }
    if ($('body').is('#editList')) {
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('name');
        populateGrocery();
        let header = '<h1 class="text-center" id="listName">'+ name + '</h1>';
        $("#list").prepend(header);


        if (!localStorage.getItem(name)) {
            localStorage.setItem(name, JSON.stringify({}));
        } else {
            const currentList = JSON.parse(localStorage.getItem(name)) || {};
            console.log(currentList);

            for (const [key, value] of Object.entries(currentList)) {
                console.log(`Item: ${key}, Quantity: ${value}`);
                addToList(key);
            }
        }

    }
   
});

$(document).ready(function () {
    
    const listName = document.getElementById("listName").textContent;
    const list = JSON.parse(localStorage.getItem(listName)) || {};

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
        const list = JSON.parse(localStorage.getItem(listName)) || {};
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
