$(document).ready(function () {
    function validAddress(street, city, zip) {
        let isValid = true;

        // Regular expressions for validation
        const streetRegex = /^[a-zA-Z0-9\s,'-]*$/; // Allows letters, numbers, spaces, commas, apostrophes, and hyphens
        const cityRegex = /^[a-zA-Z\s]*$/; // Allows only letters and spaces
        const zipRegex = /^\d{5}$/; // Exactly 5 digits

        // Validate street name
        if (!street ||!streetRegex.test(street)) {
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


    const userAddressInput = document.getElementById("addressSearch");
    const autocompleteList = document.getElementById("autocomplete-list");
    const manualAddressButton = document.getElementById("continue-address-btn");
    const streetInput = document.getElementById("street");
    const cityInput = document.getElementById("city");
    const zipInput = document.getElementById("zip");
    var flag = false;

    // Create a new button element
    const saveButton = document.createElement('button');
    saveButton.id = 'save-address-btn';
    saveButton.textContent = 'Save';

  
    if (userAddressInput && autocompleteList) {
      userAddressInput.addEventListener('input', async function (event) {
        const query = event.target.value.trim();

        // Append the save button to the container
        document.getElementById("saveButtonContainer").appendChild(saveButton);
  
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
                userAddressInput.value = place.display_name; // Populate the input field
                autocompleteList.innerHTML = ''; // Clear the dropdown
                flag = true;
                
              });
              autocompleteList.appendChild(item);
            });
          } catch (error) {
            console.error("Error fetching address suggestions:", error);
          }
        }
      });

        // Close the dropdown when clicking outside
        saveButton.addEventListener('click', function (e) {
        if (e.target == saveButton && flag == true) {
            window.location.href = '/userhome.html';
            // save user's address to database

        }
    });

    manualAddressButton.addEventListener('click', function () {
        const street = streetInput.value.trim();
        const city = cityInput.value.trim();
        const zip = zipInput.value.trim();

        // Validate the address
        if (validAddress(street, city, zip)) {
            window.location.href = '/userhome.html';
            // Save user's address to the database
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