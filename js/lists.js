const listNames = [
    {"name":"Taco Tuesday"},
    //{"name":"Pizza Party"}
];
if (!localStorage.getItem("listNames")) {
    localStorage.setItem("listNames", JSON.stringify(listNames));
}

const groceries = [
    {"item": "apple", "store": "price"},
    {"item": "milk", "store": "price"},
    {"item": "cheese", "store": "price"},
    {"item": "yogurt", "store": "price"},
    {"item": "butter", "store": "price"},
    {"item": "banana", "store": "price"},
    {"item": "lettuce", "store": "price"},
    {"item": "tomatoes", "store": "price"},
    {"item": "potatoes", "store": "price"},
    {"item": "carrots", "store": "price"},
    {"item": "chicken", "store": "price"},
    {"item": "ground beef", "store": "price"},
    {"item": "bacon", "store": "price"},
    {"item": "sausage", "store": "price"},
    {"item": "white bread", "store": "price"},
    {"item": "wheat bread", "store": "price"},
    {"item": "white rice", "store": "price"},
    {"item": "tortilla", "store": "price"},
    {"item": "marinara sauce", "store": "price"},
    {"item": "coca cola", "store": "price"},
    {"item": "egg", "store": "price"},
    {"item": "pretzels", "store": "price"},
    {"item": "lays chips", "store": "price"},
    {"item": "taco sauce", "store": "price"},
    {"item": "pizza dough", "store": "price"},
    {"item": "paper towel", "store": "price"},
    {"item": "solo cup", "store": "price"},
    {"item": "toilet paper", "store": "price"},
    {"item": "onion", "store": "price"}
];
//aim to change this but wanted to get this functional and pretty

function createNewList() {
    let listName = document.getElementById('name').value;
    let storedLists = JSON.parse(localStorage.getItem("listNames")) || [];

    if (listName == "" ) {
        console.log("empty list cannot be created")
    } else {
        createListCard(listName);
        storedLists.push({ name: listName });
        localStorage.setItem("listNames", JSON.stringify(storedLists));
        document.getElementById('name').value = ""; 
    }
};

function createListCard(listName) {
    var addNewList = `<div class="card oldList" style="width: 15rem;" id="${ listName }">
        <div class="card-body">
            <h5 class="card-title"> ${ listName } </h5>
            <input class="btn btn-custom-color list-btn" type="submit" value="Edit" onclick="editList('${ listName }')">
            <input class="btn btn-danger list-btn" type="reset" value="Delete" onclick="deleteList('${ listName }')">
        </div>
    </div>`;
    Container = document.getElementById('listContainer');  
    console.log("List: " + listName + " added to the list container")
    Container.innerHTML += addNewList; 
}

function deleteList(name) {
    let element = document.getElementById(name);
    let storedLists = JSON.parse(localStorage.getItem("listNames")) || [];
    //let list = JSON.parse(localStorage.getItem(listKey)) || {};
    if (element) {
        element.remove();
        storedLists = storedLists.filter(list => list.name !== name);
        localStorage.setItem("listNames", JSON.stringify(storedLists));
        localStorage.removeItem(name);
    } else {
        console.error("Element with ID " + name + " not found.");
    }
}

function editList(name) {
    window.location.href = 'editlist.html?name=' + encodeURIComponent(name);
}

function populateGrocery() {
    var LorR = false;
    groceries.forEach(item => {
        let grocery = `<li class="list-group-item d-flex justify-content-between align-items-center" id='${item.item}Result'>
            <h5 class="text-center flex-grow-1">${ item.item }</h5>
            <button class="btn btn-custom-color" onclick="addToList('${ item.item }')">Add to List</button>
        </li>`;
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
    let name = document.getElementById("listName");
    var btnFinder = "#" + item + " .decrement";
    var valueFinder = "#" + item + " input";
    name = name.textContent;
    let list = JSON.parse(localStorage.getItem(name)) || {};

    if(list.hasOwnProperty(item)) {
        if(document.getElementById(item)) {
            console.log(item + " is in list and in HTML")
            let value = document.querySelector(valueFinder);
            value.value++;
            document.querySelector(btnFinder).disabled = false;
            updateItemQuantity(name, item, value.value);
        } else {
            console.log(item + " is in list and not in HTML");
            let html = `<li class="list-group-item d-flex justify-content-between align-items-center" id="${ item }">
                    <button class="btn btn-close btn-danger" onclick="removeItem('${ name }','${ item }')"></button>
                    <h5 class="text-center flex-grow-1">${ item }</h5>
                    <div class="btn-group" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-danger decrement" onclick="decrement('${ item }')" disabled>-</button>
                        <input type="text" class="form-control middle text-center" value="${list[item]}" disabled>
                        <button type="button" class="btn btn-success" onclick="increment('${ item }')">+</button>
                    </div>
                </li>`;
            let element = document.getElementById("myList");
            element.innerHTML += html;
            if(list[item] > 1) {
                document.querySelector(btnFinder).disabled = false;
            }
            console.log(name);
        }
    } else {
        console.log(item + " is not in list and not in HTML ");
        let html = `<li class="list-group-item d-flex justify-content-between align-items-center" id="${ item }">
                    <button class="btn btn-close btn-danger" onclick="removeItem('${ name }','${ item }')"></button>
                    <h5 class="text-center flex-grow-1">${ item }</h5>
                    <div class="btn-group" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-danger decrement" onclick="decrement('${ item }')" disabled>-</button>
                        <input type="text" class="form-control middle text-center" value="1" disabled>
                        <button type="button" class="btn btn-success" onclick="increment('${ item }')">+</button>
                    </div>
                </li>`;
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
    let list = JSON.parse(localStorage.getItem(listKey)) || {};
    if (newQuantity > 0) {
        list[itemName] = newQuantity;
    } else {
        delete list[itemName];
    }
    localStorage.setItem(listKey, JSON.stringify(list));
}

function removeItem(listKey, itemName) {
    let list = JSON.parse(localStorage.getItem(listKey)) || {};

    if (list[itemName]) {
        delete list[itemName]; 
        localStorage.setItem(listKey, JSON.stringify(list)); 
    }
    let element = document.getElementById(itemName);
    element.remove();
}

function increment(item) {
    let name = document.getElementById("listName").textContent;
    var valueFinder = "#" + item + " input";
    var btnFinder = "#" + item + " .decrement";
    let value = document.querySelector(valueFinder);
    console.log("value: " + valueFinder)
    if((value.value + 1) > 1) {
        document.querySelector(btnFinder).disabled = false;
    }
    value.value++;
    updateItemQuantity(name, item, value.value);
    console.log(value.value)
}

function decrement(item) {
    let name = document.getElementById("listName").textContent;
    var valueFinder = "#" + item + " input";
    var btnFinder = "#" + item + " .decrement";
    let value = document.querySelector(valueFinder);
    if((value.value - 1) == 1) {
        document.querySelector(btnFinder).disabled = true;
    }
    value.value--;
    updateItemQuantity(name, item, value.value);
    console.log(value.value)
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
        console.log(name)
    }
   
});
