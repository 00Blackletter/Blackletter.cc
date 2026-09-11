const photos = [

    "images/photo1.jpg",
    "images/photo2.jpg",
    "images/photo3.jpg",
    "images/photo4.jpg",
    "images/photo5.jpg",
    "images/photo6.jpg",
    "images/photo7.jpg",
    "images/photo8.jpg",
    "images/photo9.jpg",
    "images/photo10.jpg",
    "images/photo11.jpg",
    "images/photo12.jpg",
    "images/photo13.jpg",
    "images/photo14.jpg",
    "images/photo15.jpg",
    "images/photo16.jpg",
    "images/photo17.jpg",
    "images/photo18.jpg",
    "images/photo19.jpg",
    "images/photo20.jpg",
    "images/photo21.jpg",
    "images/photo22.jpg",
    "images/photo23.jpg",
    "images/photo24.jpg",
    "images/photo25.jpg",
    "images/photo26.jpg",
    "images/photo27.jpg",
    "images/photo28.jpg",
    "images/photo29.jpg",
    "images/photo30.jpg",
    "images/photo31.jpg",
    "images/photo32.jpg",
    "images/photo33.jpg",

];

const randomPhoto =
    photos[Math.floor(Math.random() * photos.length)];

document.body.style.backgroundImage =
    `url("${randomPhoto}")`;

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