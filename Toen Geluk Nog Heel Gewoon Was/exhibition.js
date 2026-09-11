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