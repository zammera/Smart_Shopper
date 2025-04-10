if (!window.firebaseDb) {
    console.error("Firebase not initialized!");
    // You might want to redirect to index.html or show an error
}

// dispays user's address in top nav bar where 'currentLocation' id element is. 
function updateLocationDisplay(address) {
    const locationElement = document.getElementById('currentLocation');
    if (locationElement) {
      locationElement.textContent = address || "Set your location";
    }
  }

// Function to save the user's address to Firestore
async function saveUserAddress(address) {
    try {
        const user = window.firebaseAuth.currentUser;
        
        if (!user) {
            alert("No user is signed in.");
            return false;
        }

        await window.firebaseDb.collection("users").doc(user.uid).set({
            address: {formatted: address.formatted, lat: address.lat, lng: address.lng},

            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Update display - just add this one line
        updateLocationDisplay(extractStreetAddress(address.formatted));
        
        console.log("Address saved successfully!");
        return true;
    } catch (error) {
        console.error("Error saving address:", error);
        throw error;
    }
}

// helper function to just extract user's streen number and name to be displayed
function extractStreetAddress(fullAddress) {
    if (!fullAddress) return "Set your location";
    // Extract everything before the first comma
    return fullAddress.split(',')[0].trim();
  }

// function for Google Maps API initialization
(function(g) {
    var h, a, k, p="The Google Maps JavaScript API", c="google", l="importLibrary", q="__ib__", m=document, b=window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {});
    var r = new Set(), e = new URLSearchParams();
    var u = () => h || (h = new Promise(async(f, n) => {
        await (a = m.createElement("script"));
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => h = n(Error(p + " could not load."));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
    }));
    d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
})({
    key: "AIzaSyAVpGwnFAlquQmJkZOEezMLWdNrzr9BQNo",
    v: "weekly",
    libraries: "places"
});

// function change location feature
async function changeAreaFunction() {
    let selectedAddress = null;

    function validAddress(street, city, zip) {
        let isValid = true;

        // basic regex for input validation 
        const streetRegex = /^[a-zA-Z0-9\s,'-]*$/;
        const cityRegex = /^[a-zA-Z\s]*$/;
        const zipRegex = /^\d{5}$/;
         
        // throw error if input is not valid based on above regex
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

        if (userAddressInput) {
            const { Autocomplete } = await google.maps.importLibrary("places");
            const autocomplete = new Autocomplete(userAddressInput, {
                types: ['geocode'],
                fields: ['place_id', 'formatted_address', 'geometry'],
                componentRestrictions: { country: "US" }
            });

            const autocompleteContainer = document.querySelector('.pac-container');
            if (autocompleteContainer) {
                document.querySelector('.modal-body').appendChild(autocompleteContainer);
            }

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (place && place.formatted_address && place.geometry) {
                    userAddressInput.value = place.formatted_address;

                    // selectedAddress as an object to get and use the address both as a string and its latitude and longitude 
                    selectedAddress = {
                        formatted: place.formatted_address,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    }

                    // save button will appear once the user selects an address autocomplete suggestion 
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

    // listener for save button
    $(document).on('click', '#save-address-btn', async function () {
        console.log("Selected Address before saving:", selectedAddress.formatted);
        if (selectedAddress.formatted) {
            console.log("Calling saveUserAddress with:", selectedAddress.formatted);
            alert("Address saved: " + selectedAddress.formatted);

            // code to save address in database
            await saveUserAddress(selectedAddress);
            location.reload(); // reload user's current page
        } else {
            alert('Please select a valid address from the suggestions.');
        }
    });

    $('#continue-address-btn').on('click', async function () {
        const street = document.getElementById("street").value.trim();
        const city = document.getElementById("city").value.trim();
        const zip = document.getElementById("zip").value.trim();
        const state = document.getElementById("state").value;

        if (validAddress(street, city, zip)) {
            const manualAddress = {
                formatted: `${street}, ${city}, ${state}, ${zip}`,
                lat: null,
                lng: null
            };
            
            alert("Address saved:" + manualAddress);
            // code to save address in database
            await saveUserAddress(manualAddress);
            location.reload(); // reload user's current page
        }
    });
}


// Load modal content dynamically into the page
fetch('modals.html')
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML('beforeend', data);
        changeAreaFunction();  // Make sure the modal functionality works after loading
    })
    .catch(error => console.error('Error loading modals:', error));

// Export the function if needed by other modules
window.changeAreaFunction = changeAreaFunction;


// Replace your current initialization with this:
document.addEventListener('DOMContentLoaded', () => {
    // Set default text immediately
    updateLocationDisplay("Location loading...");
    
    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuth) {
            clearInterval(checkFirebase);
            
            // Check for auth state changes
            window.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    // User is signed in, load their address
                    window.firebaseDb.collection("users").doc(user.uid).get()
                        .then(doc => {
                            if (doc.exists && doc.data().address) {
                                updateLocationDisplay(extractStreetAddress(doc.data().address.formatted));
                            } else {
                                updateLocationDisplay("Set your location");
                            }
                        });
                } else {
                    // No user signed in
                    updateLocationDisplay("Sign in to set location");
                }
            });
        }
    }, 100);
});