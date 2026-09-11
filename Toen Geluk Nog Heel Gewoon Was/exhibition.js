  (() => {

    const sidebar = document.getElementById("upcoming-sidebar");
    const openButton = document.getElementById("sidebar-toggle");
    const closeButton = document.getElementById("sidebar-close");
    const backdrop = document.getElementById("sidebar-backdrop");

    const uploadPanel = document.getElementById("photo-upload-panel");
    const photoInput = document.getElementById("photo-file");
    const submitPhoto = document.getElementById("photo-submit");


    /* -------------------------
       Open / close sidebar
    ------------------------- */

    function openSidebar() {

        sidebar.classList.add("open");
        backdrop.classList.add("visible");

        openButton.setAttribute("aria-expanded", "true");

        setTimeout(() => {
            map.invalidateSize();
        }, 400);

    }


    function closeSidebar() {

        sidebar.classList.remove("open");
        backdrop.classList.remove("visible");

        openButton.setAttribute("aria-expanded", "false");

    }


    openButton.addEventListener("click", openSidebar);

    closeButton.addEventListener("click", closeSidebar);

    backdrop.addEventListener("click", closeSidebar);


    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeSidebar();
        }

    });


    /* -------------------------
       Exhibition map
    ------------------------- */

    const map = L.map("exhibition-map").setView(
        [51.968, 4.418],
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
       Visitor photo placement
    ------------------------- */

    let selectedLocation = null;
    let temporaryMarker = null;


    map.on("click", event => {

        selectedLocation = event.latlng;

        if (temporaryMarker) {
            map.removeLayer(temporaryMarker);
        }

        temporaryMarker = L.circleMarker(
            selectedLocation,
            {
                radius: 7
            }
        ).addTo(map);

        uploadPanel.hidden = false;

    });


    submitPhoto.addEventListener("click", () => {

        const file = photoInput.files[0];

        if (!file || !selectedLocation) {
            return;
        }

        const reader = new FileReader();


        reader.onload = event => {

            const imageURL = event.target.result;

            const marker = L.marker(
                selectedLocation
            ).addTo(map);


            marker.bindPopup(`
                <img
                    src="${imageURL}"
                    class="map-photo"
                    alt="Visitor photograph"
                >
            `);


            marker.openPopup();


            if (temporaryMarker) {
                map.removeLayer(temporaryMarker);
                temporaryMarker = null;
            }


            photoInput.value = "";
            uploadPanel.hidden = true;
            selectedLocation = null;

        };


        reader.readAsDataURL(file);

    });

})();