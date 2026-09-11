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

const customCursorLabel =
    customCursor.querySelector(".map-cursor-label");

document.body.appendChild(customCursor);


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
    customCursorLabel.textContent = "click to add photo";
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


        submitButton.addEventListener("click", async function() {

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
            /*Send file to API contribution endpoint godsgreenearth */
            const formData = new FormData();

formData.append("photo", file);
formData.append("name", visitorName);
formData.append("photo_date", photographDate);
formData.append("latitude", selectedLocation.lat);
formData.append("longitude", selectedLocation.lng);

submitButton.disabled = true;
submitButton.textContent = "Submitting…";


try {

    const response = await fetch(
        "/api/contributions",
        {
            method: "POST",
            body: formData
        }
    );


    const result =
        await response.json();


    if (!response.ok) {
        throw new Error(
            result.error || "Upload failed."
        );
    }


    /*
       Keep displaying the photograph locally
       for the person who submitted it.
    */

    const photoURL =
        URL.createObjectURL(file);


    /* your existing photo-marker creation code goes here */


    map.closePopup();


    alert(
        "Thank you — your photograph has been submitted."
    );


} catch (error) {

    errorMessage.textContent =
        error.message;

} finally {

    submitButton.disabled = false;
    submitButton.textContent = "Add to map";
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


        photoMarker.bindPopup(
    `
        <div class="photo-popup">

            <img
                src="${photoURL}"
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

            const photoIcon =
                L.divIcon({

                    className: "photo-marker",

                    html: `
                        <img
                            src="${item.image_url}"
                            alt="Photograph by ${escapeHTML(item.name || "visitor")}"
                        >
                    `,

                    iconSize: [52, 52],
                    iconAnchor: [26, 26]
                });


            const marker =
                L.marker(
                    [
                        item.latitude,
                        item.longitude
                    ],
                    {
                        icon: photoIcon
                    }
                )
                .addTo(map);


            let caption = "";


            if (item.name) {
                caption += `
                    <div class="photo-name">
                        ${escapeHTML(item.name)}
                    </div>
                `;
            }


            if (item.photo_date) {
                caption += `
                    <div class="photo-date">
                        ${escapeHTML(item.photo_date)}
                    </div>
                `;
            }


            marker.bindPopup(
                `
                    <div class="photo-popup">

                        <img
                            src="${item.image_url}"
                            alt="Visitor photograph"
                        >

                        <div class="photo-caption">
                            ${caption}
                        </div>

                    </div>
                `,
                {
                    maxWidth: 900,
                    className:
                        "photo-viewer-popup",
                    autoPanPadding: [40, 40]
                }
            );

        });


    } catch (error) {

        console.error(error);

    }
}


loadContributions();

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