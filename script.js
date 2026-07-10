const photos = [

    "images/photo1.jpg",
    "images/photo2.jpg",
    "images/photo3.jpg",
    "images/photo4.jpg",
    "images/photo5.jpg"

];

const randomPhoto =
    photos[Math.floor(Math.random() * photos.length)];

document.body.style.backgroundImage =
    `url("${randomPhoto}")`;