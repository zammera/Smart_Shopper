if (!window.firebaseDb) {
    console.error("Firebase not initialized")
}

$(function () {
    const user = window.firebaseAuth.currentUser;
    if (!user) {
        alert("No user is signed in.");
    }
});

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

//aim to change this but wanted to get this functional and pretty

async function createNewList() {
    let listName = document.getElementById('name').value;
    let storedLists = JSON.parse(localStorage.getItem("listNames")) || [];

    if (listName == "" ) {
        console.log("empty list cannot be created")
    } else {
        createListCard(listName);
        listdata = {
            name: listName,
            items: []
        };
        await window.firebaseDb.collection("users").doc(user.uid).collection("groceryLists").set({
            name: listName,
            items: [],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        storedLists.push({ name: listName });
        localStorage.setItem("listNames", JSON.stringify(storedLists));
        document.getElementById('name').value = ""; 
    }
    selectList(listName);
};

function createListCard(listName) {
    var addNewList = `<div class="card oldList" style="width: 15rem;" id="${ listName }">
        <div class="card-body">
            <h5 class="card-title"> ${ listName } </h5>
            <input class="btn btn-primary list-btn" type="reset" value="Select" onclick="selectList('${ listName }')">
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

function selectList(name) {
    localStorage.setItem("selectedList", JSON.stringify(name));
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
        console.log(name);
    }
   
});
