import axios from "axios";

let cache: any;

export function getEvents() {
    return cache ?? fetchEvents()
}

async function fetchEvents() {
    const eventres = await axios.get('https://bestdori.com/api/events/all.5.json');
    cache = eventres.data
    return cache
}