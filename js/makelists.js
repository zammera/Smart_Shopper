import {db, auth } from "./firebaseInit.js";
import { setDoc, getDocs, deleteDoc, collection, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

if (!window.firebaseDb) {
    console.error("Firebase not initialized")
}

// Update createNewList to be async
async function createNewList() {
    let listName = document.getElementById('name').value.trim();
    
    if (listName === "") {
        document.getElementById('error-message').textContent = "Please enter a name for your shopping list.";
        document.getElementById('error-message').style.display = 'block';
        return;
    }

    try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not logged in");
        }

        // Get all lists from Firebase
        const existingLists = await getAllCurrentLists();
        console.log("Checking existing lists:", existingLists);
        
        // Case insensitive check for duplicates
        const isDuplicate = existingLists.some(list => 
            list.name && list.name.toLowerCase() === listName.toLowerCase()
        );

        if (isDuplicate) {
            document.getElementById('error-message').textContent = "This shopping list already exists.";
            document.getElementById('error-message').style.display = 'block';
            return;
        }

        // Create new list in Firebase
        await createGroceryListDB(listName);
        
        // Update UI
        document.getElementById('error-message').style.display = 'none';
        createListCard(listName);
        selectList(listName);
        document.getElementById('name').value = "";

    } catch (error) {
        console.error("Error creating list:", error);
        document.getElementById('error-message').textContent = "Error creating list. Please try again.";
        document.getElementById('error-message').style.display = 'block';
    }
}

//creates a new list card with the given name 
function createListCard(listName) {
    let selectedList = JSON.parse(localStorage.getItem('selectedList')) || [];
    // if (listName == selectedList){
    //     var addNewList = `<div class="card oldList" style="width: 15rem;" id="${ listName }">
    //         <div class="card-body">
    //             <div class="d-flex align-items-center justify-content-between mb-2">
    //                 <h5 class="card-title mb-0">${ listName }</h5>
    //             </div>
    //             <input class="btn btn-custom-color list-btn mt-3" type="submit" value="Manage List" onclick="editList('${ listName }')">
    //             <input class="btn btn-danger list-btn" type="reset" value="Delete" onclick="deleteList('${ listName }')">
    //         </div>
    //     </div>`;
    // } else {
        var addNewList = `<div class="card oldList" style="width: 15rem;" id="${ listName }">
            <div class="card-body">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <h5 class="card-title mb-0">${ listName }</h5>
                </div>
                <input class="btn btn-custom-color list-btn mt-3" type="submit" value="Edit" onclick="editList('${ listName }')">
                <input class="btn btn-danger list-btn" type="reset" value="Delete" onclick="deleteList('${ listName }')">
            </div>
        </div>`;
    //}
    let Container = document.getElementById('listContainer');  
    console.log("List: " + listName + " added to the list container")
    Container.innerHTML += addNewList; 
}

//Testing an async function to delete a list from both the DB and local storage
async function deleteList(name) {
    try {
        // Remove from UI
        let element = document.getElementById(name);
        if (element) {
            element.remove();
        }

        // Remove from Firebase
        await deleteDBList(name);

        // Clear from localStorage if it exists
        const storedLists = JSON.parse(localStorage.getItem("listNames")) || [];
        const updatedLists = storedLists.filter(list => list.name !== name);
        localStorage.setItem("listNames", JSON.stringify(updatedLists));

        console.log(`List '${name}' deleted successfully`);
    } catch (error) {
        console.error("Error deleting list:", error);
        // restore the UI element if DB deletion failed
        if (!document.getElementById(name)) {
            createListCard(name);
        }
    }
}

//sets the search the paramerts to contain the name of the list being edited
function editList(name) {
    window.location.href = 'editlist.html?name=' + encodeURIComponent(name);
}

//no longer used
function selectList(name) {
    localStorage.setItem("selectedList", JSON.stringify(name));
}

//when the document is read 
$( function() {
    //runs only in makelist.html
    if ($('body').is('#makeList')) {
        (async () => {
            console.log("im in the async function");
            try {
                const lists = await getAllCurrentLists();
                console.log("Fetched lists from Firestore:", lists);

                lists.forEach(list => {
                    if (list.name !== "Hot Deals List" && list.name !== undefined) {
                        createListCard(list.name);
                    }
                });                                               

            } catch (err) {
                console.error("Error getting lists:", err);
            }
        })();
        
    }
    //runs only in the editList.html
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

// Creates a New Grocery List as  new entry attached to the user
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

//gets all the current lists attached to the current user 
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

// deleting lists from site and database for current user
async function deleteDBList(listName){
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in");
      return;
    }

    const ref = doc(db, `users/${ user.uid }/groceryLists/${listName}`);
    await deleteDoc(ref);
}

//makes the functions for the buttons available to the buttons
window.createNewList = createNewList;
window.editList = editList;
window.deleteList = deleteList;
window.selectList = selectList;
