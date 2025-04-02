const listNames = [
    {"name":"Taco Tuesday"},
    //{"name":"Pizza Party"}
];
if (!localStorage.getItem("listNames")) {
    localStorage.setItem("listNames", JSON.stringify(listNames));
}

class Item {
    constructor(name){
        this.name = name;
        let id = name.split(" ");
        if (id === 1) {
            this.id = id[0];
        } else {
            this.id = id.join("_");
        }
    }
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
        let _item = new Item(item.item);
        let grocery = `<li class="list-group-item d-flex justify-content-between align-items-center" id='${_item.id}Result'>
            <h5 class="text-center flex-grow-1">${ _item.name }</h5>
            <button class="btn btn-custom-color" onclick="addToList('${ _item.name }')">Add to List</button>
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
    let _item = new Item(item);
    let name = document.getElementById("listName");
    var btnFinder = "#" + _item.id + " .decrement";
    var valueFinder = "#" + _item.id + " input";
    name = name.textContent;
    let list = JSON.parse(localStorage.getItem(name)) || {};

    if(list.hasOwnProperty(item)) {
        if(document.getElementById(_item.id)) {
            console.log(item + " is in list and in HTML")
            let value = document.querySelector(valueFinder);
            value.value++;
            document.querySelector(btnFinder).disabled = false;
            updateItemQuantity(name, item, value.value);
        } else {
            console.log(item + " is in list and not in HTML");
            let html = `<li class="list-group-item d-flex justify-content-between align-items-center" id="${ _item.id }">
                    <button class="btn btn-close btn-danger" onclick="removeItem('${ name }','${ _item.id }')"></button>
                    <h5 class="text-center flex-grow-1">${ item }</h5>
                    <div class="btn-group" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-danger decrement" onclick="decrement('${ _item.id }')" disabled>-</button>
                        <input type="text" class="form-control middle text-center" value="${list[item]}" disabled>
                        <button type="button" class="btn btn-success" onclick="increment('${ _item.id }')">+</button>
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
        let html = `<li class="list-group-item d-flex justify-content-between align-items-center" id="${ _item.id }">
                    <button class="btn btn-close btn-danger" onclick="removeItem('${ name }','${ _item.id }')"></button>
                    <h5 class="text-center flex-grow-1">${ item }</h5>
                    <div class="btn-group" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-danger decrement" onclick="decrement('${ _item.id }')" disabled>-</button>
                        <input type="text" class="form-control middle text-center" value="1" disabled>
                        <button type="button" class="btn btn-success" onclick="increment('${ _item.id }')">+</button>
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
