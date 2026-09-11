export async function onRequestGet(context) {

    const path = context.params.path;

    const key = Array.isArray(path)
        ? path.join("/")
        : path;


    if (!key) {
        return new Response(
            "Not found",
            { status: 404 }
        );
    }


    /* Only serve approved contributions */

    const contribution = await context.env.DB
        .prepare(`
            SELECT id
            FROM contributions
            WHERE image_key = ?
            AND approved = 1
        `)
        .bind(key)
        .first();


    if (!contribution) {
        return new Response(
            "Not found",
            { status: 404 }
        );
    }


    const object =
        await context.env.MEDIA.get(key);


    if (!object) {
        return new Response(
            "Not found",
            { status: 404 }
        );
    }


    const headers =
        new Headers();


    object.writeHttpMetadata(headers);

    headers.set(
        "etag",
        object.httpEtag
    );


    return new Response(
        object.body,
        {
            headers
        }
    );
}