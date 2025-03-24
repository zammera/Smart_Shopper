const getItemsData = async () => {
    let items = await fetch(`./files/history.json`)
        .then((response) => { 
            return response.json().then((data) => {
                console.log(data);
                return data;
            }).catch((err) => {
                console.log(err);
            }) 
        });
    return items;
}

const generateDiscountedItems = async () => {
    const items = await getItemsData();
    const itemsArray = [];
    const itemsPointer = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].sale_price != null) {

            const index = itemsArray.lastIndexOf(items[i].item_name);
            if (index != -1) {
                if (items[i].sale_price >= items[itemsPointer[index]].sale_price)
                    continue;
            }
            itemsArray.push(items[i].item_name);
            itemsPointer.push(i);
            const item = document.createElement('div');
            item.className = 'item';
            /*const itemName = document.createElement('div');
            itemName.className = 'itemName';
            const itemImageContainer = document.createElement('div');
            itemImageContainer.className = 'itemImageContainer';
            const itemInfoContainer = document.createElement('div');
            itemInfoContainer.className = 'itemInfoContainer';
            const itemPrice = document.createElement('div');
            itemPrice.className = 'itemPrice';
            const itemStore  = document.createElement('div');
            itemStore.className = 'itemStore';
            const addItemContainer = document.createElement('div');
            addItemContainer.className = 'addItemContainer';
            const addItem = document.createElement('div');
            addItem.className = 'addItem';
            const addItemOtherList = document.createElement('div');
            addItemOtherList.className = 'addItemOtherList';*/
            item.innerHTML ='<div class="itemName">' + items[i].item_name + '</div>'
                + '<div class="itemImageContainer">'
                    + '<img src="' + items[i].url + '" class ="itemImage">'
                + '</div>'
                + '<div class="itemInfoContainer">'
                    + '<div class="itemPrice"><s>$'+ items[i].price.toFixed(2) + '</s> $' + items[i].sale_price.toFixed(2) + '</div>'
                    + '<div class="itemStore">' + items[i].store + '</div>'
                + '</div>'
                + '<div class="addItemContainer">'
                    + '<div class="addItem">Add to List</div>'
                    + '<div class="addItemOtherList">'
                        + '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16">'
                            + '<path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>'
                        + '</svg>'
                    + '</div>'
                + '</div>';
            /*
            item
            addItem.innerHTML = 'Add to List';
            addItemOtherList.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';
            item.appendChild(itemName);
            item.appendChild(itemImageContainer);
            item.appendChild(itemInfoContainer);
            itemInfoContainer.appendChild(itemPrice);
            itemInfoContainer.appendChild(itemStore);
            item.appendChild(addItemContainer);
            addItemContainer.appendChild(addItem);
            addItemContainer.appendChild(addItemOtherList);*/
            document.getElementById('discountedItemsContainer').appendChild(item);
        }
    }
}
// https://www.freecodecamp.org/news/javascript-array-of-objects-tutorial-how-to-create-update-and-loop-through-objects-using-js-array-methods/
// helpful

// Create an array of all the items in the lists and record their frequency, recency, and sales
const itemsArray = []
const generateItems = async () => {
    const items = await getItemsData();
    for (let i = 0; i < items.length; i++) {
        const item = itemsArray.find(item => item.name === items[i].item_name);
        if (item === undefined) {
            itemsArray.push({"name": items[i].item_name, "price" : items[i].price, "sale_price" : items[i].sale_price, "frequency" : 1, "recency": i});
        }
        else {
            if (items[i].sale_price === null )
            item.frequency += 1;
            item.recency = i;
            if (items[i].sale_price < item.sale_price || items[i].price < item.price) {

            }
        }
    }

}

generateDiscountedItems();
generateItems();
console.log(itemsArray);