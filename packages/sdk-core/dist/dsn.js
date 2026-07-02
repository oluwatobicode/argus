export function parseDsn(dsn) {
    let url;
    try {
        url = new URL(dsn);
    }
    catch {
        throw new Error(`Invalid Argus DSN: not a valid URL: "${dsn}"`);
    }
    const publicKey = url.username; // the part before @
    const host = url.host; // hostname + port
    const projectId = url.pathname.slice(1); // "/cmr1c..." → chop the "/"
    const protocol = url.protocol.replace(":", ""); // "https:" → "https"
    if (!publicKey)
        throw new Error("Invalid Argus DSN: missing public key before '@'");
    if (!projectId)
        throw new Error("Invalid Argus DSN: missing project id in path");
    if (protocol !== "http" && protocol !== "https")
        throw new Error(`Invalid Argus DSN: protocol must be http(s), got "${protocol}"`);
    return { publicKey, host, projectId, protocol };
}
/* the endpoint every SDK posts envelopes to */
export function getIngestUrl(parsed) {
    return `${parsed.protocol}://${parsed.host}/api/v1/ingest/${parsed.projectId}/envelope`;
}
//# sourceMappingURL=dsn.js.map