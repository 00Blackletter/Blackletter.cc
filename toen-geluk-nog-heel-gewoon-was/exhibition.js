const map = L.map("exhibition-map", {
    zoomControl: true
}).setView(
    [51.968, 4.405],
    12
);


L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map);


/* -------------------------
   Visitor contributions
------------------------- */

let selectedLocation = null;
let draftMarker = null;


/* Prevent visitor-entered text becoming HTML */

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


/* Click anywhere on map */

map.on("click", function(event) {

    selectedLocation = event.latlng;


    /* Remove previous temporary marker */

    if (draftMarker) {
        map.removeLayer(draftMarker);
    }


    /* Show small marker at chosen location */

    draftMarker = L.circleMarker(
        selectedLocation,
        {
            radius: 6,
            color: "#111",
            weight: 1,
            fillColor: "#ffffff",
            fillOpacity: 1
        }
    ).addTo(map);


    /* Contribution form */

    const formHTML = `

        <div class="contribution-form">

            <div class="contribution-heading">
                Add a photograph
            </div>

            <p class="contribution-location">
                ${selectedLocation.lat.toFixed(5)},
                ${selectedLocation.lng.toFixed(5)}
            </p>

            <label for="contribution-photo">
                Photograph
            </label>

            <input
                id="contribution-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >


            <label for="contribution-name">
                Name
            </label>

            <input
                id="contribution-name"
                type="text"
                placeholder="Your name"
            >


            <label for="contribution-date">
                Date
            </label>

            <input
                id="contribution-date"
                type="date"
            >


            <button
                id="contribution-submit"
                type="button"
            >
                Add to map
            </button>

            <p
                id="contribution-error"
                class="contribution-error"
            ></p>

        </div>

    `;


    L.popup({
        maxWidth: 300,
        className: "contribution-popup"
    })
        .setLatLng(selectedLocation)
        .setContent(formHTML)
        .openOn(map);


    /* Wait until Leaflet has created the popup */

    setTimeout(function() {

        const photoInput =
            document.getElementById("contribution-photo");

        const nameInput =
            document.getElementById("contribution-name");

        const dateInput =
            document.getElementById("contribution-date");

        const submitButton =
            document.getElementById("contribution-submit");

        const errorMessage =
            document.getElementById("contribution-error");


        /* Default date to today */

        dateInput.value =
            new Date().toISOString().split("T")[0];


        submitButton.addEventListener("click", function() {

            const file = photoInput.files[0];

            if (!file) {
                errorMessage.textContent =
                    "Please select a photograph.";
                return;
            }


            /* Limit prototype to 10 MB */

            if (file.size > 10 * 1024 * 1024) {
                errorMessage.textContent =
                    "Please choose an image smaller than 10 MB.";
                return;
            }


            const photoURL =
                URL.createObjectURL(file);

            const visitorName =
                nameInput.value.trim();

            const photographDate =
                dateInput.value;


            /* Create photographic marker */

            const photoIcon = L.divIcon({

                className: "photo-marker",

                html: `
                    <img
                        src="${photoURL}"
                        alt="Visitor photograph"
                    >
                `,

                iconSize: [52, 52],
                iconAnchor: [26, 26]
            });


            const photoMarker = L.marker(
                selectedLocation,
                {
                    icon: photoIcon
                }
            ).addTo(map);


            let caption = "";

            if (visitorName) {
                caption += `
                    <div class="photo-name">
                        ${escapeHTML(visitorName)}
                    </div>
                `;
            }

            if (photographDate) {
                caption += `
                    <div class="photo-date">
                        ${escapeHTML(photographDate)}
                    </div>
                `;
            }


            photoMarker.bindPopup(`
                <div class="photo-popup">

                    <img
                        src="${photoURL}"
                        alt="Visitor photograph"
                    >

                    ${caption}

                </div>
            `);


            /* Remove temporary placement marker */

            if (draftMarker) {
                map.removeLayer(draftMarker);
                draftMarker = null;
            }


            map.closePopup();

            selectedLocation = null;

        });

    }, 0);

});