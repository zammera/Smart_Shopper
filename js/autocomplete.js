function changeAreaFunction() {
    $(document).ready(function () {
      let selectedAddress = null; 
  
      // Function to validate address
      function validAddress(street, city, zip) {
        let isValid = true;
  
        // Regex for validation
        const streetRegex = /^[a-zA-Z0-9\s,'-]*$/; // Allows letters, numbers, spaces, commas, apostrophes, and hyphens
        const cityRegex = /^[a-zA-Z\s]*$/; // Allows only letters and spaces
        const zipRegex = /^\d{5}$/; // Exactly 5 digits
  
        // Validate street name
        if (!street || !streetRegex.test(street)) {
          document.getElementById("streetError").style.display = "block";
          document.getElementById("street").classList.add("invalid");
          isValid = false;
        } else {
          document.getElementById("streetError").style.display = "none";
          document.getElementById("street").classList.remove("invalid");
        }
  
        // Validate city name
        if (!city || !cityRegex.test(city)) {
          document.getElementById("cityError").style.display = "block";
          document.getElementById("city").classList.add("invalid");
          isValid = false;
        } else {
          document.getElementById("cityError").style.display = "none";
          document.getElementById("city").classList.remove("invalid");
        }
  
        // Validate ZIP code
        if (!zip || !zipRegex.test(zip)) {
          document.getElementById("zipError").style.display = "block";
          document.getElementById("zip").classList.add("invalid");
          isValid = false;
        } else {
          document.getElementById("zipError").style.display = "none";
          document.getElementById("zip").classList.remove("invalid");
        }
  
        return isValid;
      }
  
      // Initialize autocomplete when the modal is shown
      $('#changeAreaModal').on('shown.bs.modal', function () {
        const userAddressInput = document.getElementById("addressSearch");
        const autocompleteList = document.getElementById("autocomplete-list");
        const saveButton = document.createElement('button');
        saveButton.id = 'save-address-btn';
        saveButton.textContent = 'Save';
  
        // Reset state when modal opens
        selectedAddress = null;
        if (autocompleteList) autocompleteList.innerHTML = '';
  
        if (userAddressInput && autocompleteList) {
          userAddressInput.addEventListener('input', async function (event) {
            const query = event.target.value.trim();
  
            // Clear previous results
            autocompleteList.innerHTML = '';
  
            if (query.length > 2) {
              try {
                // Fetch data from the Nominatim API
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`
                );
                const data = await response.json();
                console.log("API response:", data);
  
                // Display suggestions
                data.forEach((place) => {
                  const item = document.createElement("div");
                  item.textContent = place.display_name;
                  item.addEventListener("click", function () {
                    userAddressInput.value = place.display_name; 
                    autocompleteList.innerHTML = ''; 
                    selectedAddress = place.display_name;

                  // Add Save button if it doesn't already exist
                  const saveButtonContainer = document.getElementById("saveButtonContainer");
                  if (!document.getElementById("save-address-btn")) {
                    const saveButton = document.createElement('button');
                    saveButton.id = 'save-address-btn';
                    saveButton.textContent = 'Save';
                    saveButtonContainer.appendChild(saveButton);
                  }

                  });

                  autocompleteList.appendChild(item);
                });
              } catch (error) {
                console.error("Error fetching address suggestions:", error);
              }
            }
          });
  
          // Close the dropdown when clicking outside
          document.addEventListener('click', function (e) {
            if (e.target !== userAddressInput) {
              autocompleteList.innerHTML = '';
            }
          });
        } else {
          console.error("Required elements not found!");
        }
      });

        // Remove Save button when modal is closed
        $('#changeAreaModal').on('hidden.bs.modal', function () {
            const saveButton = document.getElementById("save-address-btn");
            if (saveButton) {
            saveButton.remove();
            }
        });
  
        // Remove Save button when switching to another modal
        $('#changeAreaModal').on('hide.bs.modal', function () {
            const saveButton = document.getElementById("save-address-btn");
            if (saveButton) {
            saveButton.remove();
            }
        });
  
    // Save button click listener using event delegation
    $(document).on('click', '#save-address-btn', function () {
        if (selectedAddress) {
          
          window.location.href = '/userhome.html';
          alert("Address saved: " + selectedAddress); // Placeholder for saving logic
          /*



            Save the selected address to the database or perform other actions here


          */
        } else {
          alert('Please select a valid address from the suggestions.');
        }
      });


  
      // Manual address button click listener
      $('#continue-address-btn').on('click', function () {
        const street = document.getElementById("street").value.trim();
        const city = document.getElementById("city").value.trim();
        const zip = document.getElementById("zip").value.trim();
        const state = document.getElementById("state").value;
  
        // Validate the address
        if (validAddress(street, city, zip)) {
          alert("Address saved: " + street +" " + city +" "+ state + ", " + zip); // Placeholder for saving logic
          window.location.href = '/userhome.html';
          /*
          
                Save user's address to the database....

          */

        } else {
          
        }
      });
    });
  }
  
  // Export the function for use in other scripts
  window.changeAreaFunction = changeAreaFunction;