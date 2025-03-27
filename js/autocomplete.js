// Function to save the user's address to Firestore
async function saveUserAddress(address) {
    const auth = firebase.auth(); // Get auth from Firebase
    const db = firebase.firestore(); // Get Firestore from Firebase

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Reference to the user's document in Firestore database
                const userRef = db.collection("users").doc(user.uid);
                await userRef.set({ address: address }, { merge: true }); 
                console.log("Address saved successfully!");
                alert("Your address has been saved.");
            } catch (error) {
                console.error("Error saving address:", error);
                alert("Failed to save address.");
            }
        } else {
            alert("No user is signed in.");
        }
    });
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
                fields: ['place_id', 'formatted_address'],
                componentRestrictions: { country: "US" }
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
            alert("Address saved: " + selectedAddress);
            // code to save address in database
            saveUserAddress(selectedAddress);
            location.reload(); // reload user's current page
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
            let manualAddress = `${street},${city}, ${state}, ${zip}`
            alert("Address saved:" + manualAddress);
            // code to save address in database
            saveUserAddress(manualAddress);
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
