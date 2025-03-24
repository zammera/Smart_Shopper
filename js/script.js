$(function () {
  var myModal = document.getElementById('myModal')
  var myInput = document.getElementById('myInput')

  if (myModal && myInput) {
      myModal.addEventListener('shown.bs.modal', function () {
          myInput.focus()
      })
  }
  
  // Load hot deals from JSON file
  loadHotDeals();
  
  $( "#btn1" ).click(function () {
      let popup = `<div class="modal" id="exampleModalToggle" aria-hidden="true" aria-labelledby="exampleModalToggleLabel" tabindex="-1">
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content">
    <div class="modal-header">
      <h1 class="modal-title fs-5" id="exampleModalToggleLabel">Modal 1</h1>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      Show a second modal and hide this one with the button below.
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" data-bs-target="#exampleModalToggle2" data-bs-toggle="modal">Open second modal</button>
    </div>
  </div>
</div>
</div>
<div class="modal fade" id="exampleModalToggle2" aria-hidden="true" aria-labelledby="exampleModalToggleLabel2" tabindex="-1">
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content">
    <div class="modal-header">
      <h1 class="modal-title fs-5" id="exampleModalToggleLabel2">Modal 2</h1>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      Hide this modal and show the first with the button below.
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" data-bs-target="#exampleModalToggle" data-bs-toggle="modal">Back to first</button>
    </div>
  </div>
</div>
</div>`;
  $("#Popup").append(popup);
  });
  
  // Function to load hot deals
  function loadHotDeals() {
      $.getJSON("hotdeals.json", function(data) {
          displayHotDeals(data.hotdeals);
      }).fail(function() {
          console.error("Error loading hot deals data");
          $("#hotDealsGrid").html("<div class='col-12'><p class='alert alert-danger'>Error loading hot deals. Please try again later.</p></div>");
      });
  }
  
  // Function to display hot deals in grid
  function displayHotDeals(deals) {
      let dealsHTML = "";
      
      deals.forEach(function(deal, index) {
          dealsHTML += `
          <div class="col-md-6 col-lg-4 mb-4">
              <div class="card h-100">
                  <div class="card-header bg-success text-white">
                      <span class="badge bg-warning text-dark">${deal.discount}</span> SAVE $${deal.savings.toFixed(2)}
                  </div>
                  <div class="card-body">
                      <h5 class="card-title">${deal.item}</h5>
                      <p class="card-text">
                          <span class="text-decoration-line-through">$${deal.original_price.toFixed(2)}</span>
                          <span class="text-success fw-bold">$${deal.discount_price.toFixed(2)}</span>
                      </p>
                      <p class="card-text"><small class="text-muted">${deal.store}</small></p>
                  </div>
                  <div class="card-footer">
                      <button class="btn btn-primary w-100 add-to-list" data-item="${deal.item}" data-price="${deal.discount_price}" data-store="${deal.store}">
                          Add to Shopping List
                      </button>
                  </div>
              </div>
          </div>`;
      });
      
      $("#hotDealsGrid").html(dealsHTML);
      
      // Add event listeners for "Add to Shopping List" buttons
      // All functions below are to be implemented later on the project
      $(".add-to-list").click(function() {
          const item = $(this).data("item");
          const price = $(this).data("price");
          const store = $(this).data("store");
          
          // Add item to shopping list (to be implemented later)
          addToShoppingList(item, price, store);
          
          // Show toast notification
          const toast = new bootstrap.Toast(document.getElementById('addToListToast'));
          toast.show();
      });
  }
  
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
});
