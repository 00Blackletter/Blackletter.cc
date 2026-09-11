export async function onRequestGet(context) {

    try {

        const { results } = await context.env.DB
            .prepare(`
                SELECT
                    id,
                    image_key,
                    name,
                    photo_date,
                    latitude,
                    longitude,
                    created_at
                FROM contributions
                WHERE approved = 1
                ORDER BY created_at ASC
            `)
            .all();


        const contributions = results.map(item => ({
            id: item.id,
            name: item.name,
            photo_date: item.photo_date,
            latitude: item.latitude,
            longitude: item.longitude,
            image_url: `/media/${item.image_key}`
        }));


        return Response.json(contributions);

    } catch (error) {

        console.error(error);

        return Response.json(
            { error: "Could not load contributions." },
            { status: 500 }
        );
    }
}



export async function onRequestPost(context) {

    try {

        const formData =
            await context.request.formData();


        const photo =
            formData.get("photo");

        const name =
            String(formData.get("name") || "").trim();

        const photoDate =
            String(formData.get("photo_date") || "");

        const latitude =
            Number(formData.get("latitude"));

        const longitude =
            Number(formData.get("longitude"));


        /* Validate photograph */

        if (!(photo instanceof File)) {
            return Response.json(
                { error: "No photograph was supplied." },
                { status: 400 }
            );
        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (!allowedTypes.includes(photo.type)) {
            return Response.json(
                { error: "Please upload a JPG, PNG or WebP image." },
                { status: 400 }
            );
        }


        if (photo.size > 10 * 1024 * 1024) {
            return Response.json(
                { error: "The photograph must be smaller than 10 MB." },
                { status: 400 }
            );
        }


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return Response.json(
                { error: "Invalid map location." },
                { status: 400 }
            );
        }


        /* Restrict submissions roughly to Rotterdam–Delft */

        if (
            latitude < 51.85 ||
            latitude > 52.05 ||
            longitude < 4.25 ||
            longitude > 4.60
        ) {
            return Response.json(
                { error: "Please select a location along the Schie." },
                { status: 400 }
            );
        }


        /* Generate unique filename */

        const extensions = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        };


        const extension =
            extensions[photo.type];

        const imageKey =
            `${crypto.randomUUID()}.${extension}`;


        /* Store photograph in R2 */

        await context.env.MEDIA.put(
            imageKey,
            photo,
            {
                httpMetadata: {
                    contentType: photo.type,
                    cacheControl:
                        "public, max-age=31536000, immutable"
                }
            }
        );


        /* Store metadata in D1 */

        try {

            const result = await context.env.DB
                .prepare(`
                    INSERT INTO contributions
                    (
                        image_key,
                        name,
                        photo_date,
                        latitude,
                        longitude,
                        approved
                    )
                    VALUES (?, ?, ?, ?, ?, 0)
                `)
                .bind(
                    imageKey,
                    name || null,
                    photoDate || null,
                    latitude,
                    longitude
                )
                .run();


            return Response.json(
                {
                    success: true,
                    id: result.meta.last_row_id,
                    message:
                        "Thank you. Your photograph has been submitted."
                },
                { status: 201 }
            );

        } catch (databaseError) {

            /* Don't leave an orphaned image if DB insert fails */

            await context.env.MEDIA.delete(imageKey);

            throw databaseError;
        }


    } catch (error) {

        console.error(error);

        return Response.json(
            { error: "The photograph could not be submitted." },
            { status: 500 }
        );
    }
}