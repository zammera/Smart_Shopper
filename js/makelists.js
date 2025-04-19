import {db, auth } from "./firebaseInit.js";
import { setDoc, getDocs, deleteDoc, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


if (!window.firebaseDb) {
    console.error("Firebase not initialized")
}


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
function createNewList() {
    let listName = document.getElementById('name').value;
    let storedLists = JSON.parse(localStorage.getItem("listNames")) || [];

    if (listName == "" ) {
        console.log("empty list cannot be created")
    } else {
        createListCard(listName);
        createGroceryListDB(listName);
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
    let Container = document.getElementById('listContainer');  
    console.log("List: " + listName + " added to the list container")
    Container.innerHTML += addNewList; 
}

function deleteList(name) {
    let element = document.getElementById(name);
    //let storedLists = JSON.parse(localStorage.getItem("listNames")) || [];
    //let list = JSON.parse(localStorage.getItem(listKey)) || {};
    if (element) {
        element.remove();
        deleteDBList(name);
        //storedLists = storedLists.filter(list => list.name !== name);
        //localStorage.setItem("listNames", JSON.stringify(storedLists));
        //localStorage.removeItem(name);
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



$( function() {
    if ($('body').is('#makeList')) {
        (async () => {
            console.log("im in the async function");
            try {
                const lists = await getAllCurrentLists();
                console.log("Fetched lists from Firestore:", lists);

                lists.forEach(list => {
                    createListCard(list.name);
                });

            } catch (err) {
                console.error("Error getting lists:", err);
            }
        })();
        
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

//Database Functions:
//These Functions are for accessing/editing the DB

//Creates a New Grocery List as  new entry attached to the user
async function createGroceryListDB(listName) {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }
  
    const ref = doc(db, `users/${user.uid}/groceryLists/${listName}`);
    await setDoc(ref, {
      name: listName,
      items: [],
      createdAt: new Date()
    });
  
    console.log("List created!");
  }

async function getAllCurrentLists() {
    /* const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }

    const DBRef = collection(db, `user/${ user.uid }/groceryLists`);
    const snapshot = await getDocs(DBRef);

    const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    return lists; */
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
          if (!user) {
            console.error("User not logged in");
            return reject("User not logged in");
          }
    
          try {
            const ref = collection(db, `users/${user.uid}/groceryLists`);
            const snapshot = await getDocs(ref);
    
            const lists = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
    
            resolve(lists);
          } catch (err) {
            console.error("Error fetching lists:", err);
            reject(err);
          }
        });
      });
}

async function deleteDBList(listName){
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }

    const ref = doc(db, `users/${ user.uid }/groceryLists/${listName}`);
    await deleteDoc(ref);
}


window.createNewList = createNewList;
window.editList = editList;
window.deleteList = deleteList;
window.selectList = selectList;