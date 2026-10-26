
export function createSlug(topic){

    const base = topic
                 .toLowerCase()
                 .trim()
                 .replace(/[^a-z0-9]+/g, "-")
                 .replace(/^-|-$/g, "")
                 .slice(0, 70);

    return `${base || "article"}-${crypto.randomUUID().slice(0, 8)}`
}