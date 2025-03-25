const listNames = [
    {"name":"Taco Tuesday"},
    {"name":"Pizza Party"}
];
if (!localStorage.getItem("listNames")) {
    localStorage.setItem("listNames", JSON.stringify(listNames));
}


//aim to change this but wanted to get this functional and pretty

function olMakeList() {

}

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
            <input class="btn btn-custom-color list-btn" type="submit" value="Edit">
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
    if (element) {
        element.remove();
        storedLists = storedLists.filter(list => list.name !== name);
        localStorage.setItem("listNames", JSON.stringify(storedLists));
    } else {
        console.error("Element with ID " + name + " not found.");
    }
}

$(function() {
    if ($('body').is('#makeList')) {
        const storedLists = JSON.parse(localStorage.getItem("listNames")) || [];

        storedLists.forEach(list => {
            console.log(list.name);
            createListCard(list.name);
        });
    }

   
});
