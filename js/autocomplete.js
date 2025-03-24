async function changeAreaFunction() {
    let selectedAddress = null;

    // input validation function for manual address entries
    function validAddress(street, city, zip) {
        let isValid = true;

        // basic regex for input validation 
        const streetRegex = /^[a-zA-Z0-9\s,'-]*$/;
        const cityRegex = /^[a-zA-Z\s]*$/;
        const zipRegex = /^\d{5}$/; // 5 number zip code

        if (!street || !streetRegex.test(street)) {
            document.getElementById("streetError").style.display = "block";
            document.getElementById("street").classList.add("invalid");
            isValid = false;
        } else {
            document.getElementById("streetError").style.display = "none";
            document.getElementById("street").classList.remove("invalid");
        }

        if (!city || !cityRegex.test(city)) {
            document.getElementById("cityError").style.display = "block";
            document.getElementById("city").classList.add("invalid");
            isValid = false;
        } else {
            document.getElementById("cityError").style.display = "none";
            document.getElementById("city").classList.remove("invalid");
        }

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

    $('#changeAreaModal').on('shown.bs.modal', async function () {
        const userAddressInput = document.getElementById("addressSearch");
        const autocompleteList = document.getElementById("autocomplete-list");
        selectedAddress = null;
        if (autocompleteList) autocompleteList.innerHTML = '';

        // Google autocomplete using Places API
        if (userAddressInput) {
            const { Autocomplete } = await google.maps.importLibrary("places");
            const autocomplete = new Autocomplete(userAddressInput, {
                types: ['geocode'],
                fields: ['place_id', 'formatted_address'],
                componentRestrictions: { country: "US" } // Optional, restrict to US addresses
            });

            const autocompleteContainer = document.querySelector('.pac-container');
            if (autocompleteContainer) {
                document.querySelector('.modal-body').appendChild(autocompleteContainer);
            }

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (place && place.formatted_address) {
                    userAddressInput.value = place.formatted_address;
                    selectedAddress = place.formatted_address;
                    
                    const saveButtonContainer = document.getElementById("saveButtonContainer");
                    if (!document.getElementById("save-address-btn")) {
                        const saveButton = document.createElement('button');
                        saveButton.id = 'save-address-btn';
                        saveButton.textContent = 'Save';
                        saveButtonContainer.appendChild(saveButton);
                    }
                }
            });

        } else {
            console.error("Required elements not found!");
        }
    });

    $('#changeAreaModal').on('hidden.bs.modal hide.bs.modal', function () {
        const saveButton = document.getElementById("save-address-btn");
        if (saveButton) saveButton.remove();
    });

    $(document).on('click', '#save-address-btn', function () {
        if (selectedAddress) {
            // this is where the user's address would be saved in database, placeholder alerts for now
            alert("Address saved: " + selectedAddress);
            window.location.href = '/userhome.html';
        } else {
            alert('Please select a valid address from the suggestions.');
        }
    });

    $('#continue-address-btn').on('click', function () {
        const street = document.getElementById("street").value.trim();
        const city = document.getElementById("city").value.trim();
        const zip = document.getElementById("zip").value.trim();
        const state = document.getElementById("state").value;
        
        if (validAddress(street, city, zip)) {
            // this is where the user's address would be saved in database, placeholder alerts for now
            alert("Address saved: " + street + " " + city + " " + state + ", " + zip);
            window.location.href = '/userhome.html';
        }
    });
}
window.changeAreaFunction = changeAreaFunction;
