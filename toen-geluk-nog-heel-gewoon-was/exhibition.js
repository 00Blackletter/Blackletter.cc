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


/*_ _ _ _ _ _ _ _ __ __ _ _ _ 
    Add Bus Route & stops
    _ _ _ _ _ _ _ _ _ _ _ _ _*/

fetch('/toen-geluk-nog-heel-gewoon-was/data/bus40.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#d71920',
        weight: 1.5,
        opacity: 1,
        interactive: false
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error('Could not load bus route:', error);
  });

fetch('/toen-geluk-nog-heel-gewoon-was/data/bus40stops.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 4,
          color: '#d71920',
          fillColor: '#d71920',
          fillOpacity: 1,
          weight: 0,
          interactive: false
        });
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error('Could not load bus stops:', error);
  });

/* -------------------------
   Custom map cursor
------------------------- */

const mapContainer =
    document.getElementById("exhibition-map");

const customCursor =
    document.createElement("div");

customCursor.className = "map-cursor";

customCursor.innerHTML = `
    <span class="map-cursor-dot"></span>
    <span class="map-cursor-label">
        click to add photo
    </span>
`;

document.body.appendChild(customCursor);

const customCursorLabel =
    customCursor.querySelector(".map-cursor-label");


mapContainer.addEventListener("mousemove", function(event) {

    const isInterface =
        event.target.closest(".leaflet-control") ||
        event.target.closest(".leaflet-popup");


    if (isInterface) {
        customCursor.classList.remove("visible");
        return;
    }


    const isPhoto =
        event.target.closest(".photo-marker");


    if (isPhoto) {

        customCursor.classList.add("over-photo");

    } else {

        customCursor.classList.remove("over-photo");

        customCursorLabel.textContent =
            "click to add photo";
    }


    customCursor.style.left =
        event.clientX + "px";

    customCursor.style.top =
        event.clientY + "px";

    customCursor.classList.add("visible");

});


mapContainer.addEventListener("mouseleave", function() {

    customCursor.classList.remove("visible");

});


/* -------------------------
   Contribution state
------------------------- */

let selectedLocation = null;
let draftMarker = null;


/* -------------------------
   Helper functions
------------------------- */

function escapeHTML(value) {

    return String(value).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]
    );

}


function createPhotoMarker(
    latitude,
    longitude,
    photoURL,
    name = "",
    photoDate = ""
) {

    const safeURL =
        escapeHTML(photoURL);

    const safeName =
        escapeHTML(name);

    const safeDate =
        escapeHTML(photoDate);


    const photoIcon =
        L.divIcon({

            className: "photo-marker",

            html: `
                <img
                    src="${safeURL}"
                    alt="Photograph${safeName ? ` by ${safeName}` : ""}"
                >
            `,

            iconSize: [52, 52],
            iconAnchor: [26, 26]
        });


    const marker =
        L.marker(
            [latitude, longitude],
            {
                icon: photoIcon
            }
        )
        .addTo(map);


    let caption = "";


    if (name) {

        caption += `
            <div class="photo-name">
                ${safeName}
            </div>
        `;

    }


    if (photoDate) {

        caption += `
            <div class="photo-date">
                ${safeDate}
            </div>
        `;

    }


    marker.bindPopup(
        `
            <div class="photo-popup">

                <img
                    src="${safeURL}"
                    alt="Visitor photograph"
                >

                <div class="photo-caption">
                    ${caption}
                </div>

            </div>
        `,
        {
            maxWidth: 900,
            className: "photo-viewer-popup",
            autoPanPadding: [40, 40]
        }
    );


    return marker;
}


/* -------------------------
   Load approved photographs
------------------------- */

async function loadContributions() {

    try {

        const response =
            await fetch("/api/contributions");


        if (!response.ok) {

            throw new Error(
                "Could not load contributions."
            );

        }


        const contributions =
            await response.json();


        contributions.forEach(item => {

            createPhotoMarker(
                item.latitude,
                item.longitude,
                item.image_url,
                item.name || "",
                item.photo_date || ""
            );

        });


    } catch (error) {

        console.error(
            "Could not load contributions:",
            error
        );

    }

}


/* -------------------------
   Click map to contribute
------------------------- */

map.on("click", function(event) {

    selectedLocation =
        event.latlng;


    if (draftMarker) {

        map.removeLayer(
            draftMarker
        );

    }


    draftMarker =
        L.circleMarker(
            selectedLocation,
            {
                radius: 6,
                color: "#111",
                weight: 1,
                fillColor: "#ffffff",
                fillOpacity: 1
            }
        )
        .addTo(map);


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


    /*
       Wait for Leaflet to insert
       the popup into the page.
    */

    setTimeout(function() {

        const photoInput =
            document.getElementById(
                "contribution-photo"
            );

        const nameInput =
            document.getElementById(
                "contribution-name"
            );

        const dateInput =
            document.getElementById(
                "contribution-date"
            );

        const submitButton =
            document.getElementById(
                "contribution-submit"
            );

        const errorMessage =
            document.getElementById(
                "contribution-error"
            );


        if (
            !photoInput ||
            !nameInput ||
            !dateInput ||
            !submitButton ||
            !errorMessage
        ) {
            return;
        }


        /*
           Default date to today
        */

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        dateInput.value =
            `${year}-${month}-${day}`;


        submitButton.addEventListener(
            "click",
            async function() {

                const file =
                    photoInput.files[0];


                if (!file) {

                    errorMessage.textContent =
                        "Please select a photograph.";

                    return;

                }


                if (
                    file.size >
                    10 * 1024 * 1024
                ) {

                    errorMessage.textContent =
                        "Please choose an image smaller than 10 MB.";

                    return;

                }


                if (!selectedLocation) {

                    errorMessage.textContent =
                        "Please choose a location.";

                    return;

                }


                const visitorName =
                    nameInput.value.trim();

                const photographDate =
                    dateInput.value;


                /*
                   Preserve coordinates before
                   beginning asynchronous upload.
                */

                const contributionLocation = {

                    lat:
                        selectedLocation.lat,

                    lng:
                        selectedLocation.lng

                };


                const formData =
                    new FormData();


                formData.append(
                    "photo",
                    file
                );

                formData.append(
                    "name",
                    visitorName
                );

                formData.append(
                    "photo_date",
                    photographDate
                );

                formData.append(
                    "latitude",
                    contributionLocation.lat
                );

                formData.append(
                    "longitude",
                    contributionLocation.lng
                );


                errorMessage.textContent =
                    "";

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Submitting…";


                try {

                    const response =
                        await fetch(
                            "/api/contributions",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    let result = {};


                    try {

                        result =
                            await response.json();

                    } catch {

                        /* Server returned
                           something other than JSON */
                    }


                    if (!response.ok) {

                        throw new Error(
                            result.error ||
                            "The photograph could not be submitted."
                        );

                    }


                    /*
                       Show submission locally
                       immediately.
                    */

                    const photoURL =
                        URL.createObjectURL(
                            file
                        );


                    createPhotoMarker(
                        contributionLocation.lat,
                        contributionLocation.lng,
                        photoURL,
                        visitorName,
                        photographDate
                    );


                    if (draftMarker) {

                        map.removeLayer(
                            draftMarker
                        );

                        draftMarker = null;

                    }


                    selectedLocation =
                        null;

                    map.closePopup();


                    window.alert(
                        "Thank you — your photograph has been submitted."
                    );


                } catch (error) {

                    console.error(
                        "Contribution upload failed:",
                        error
                    );


                    errorMessage.textContent =
                        error.message;


                } finally {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Add to map";

                }

            }
        );

    }, 0);

});


/* -------------------------
   Initialise contributions
------------------------- */

loadContributions();