// @ts-ignore
const server = process.env.SERVER || 'TW';

if (server === 'TW') {
    module.exports = require('./generated/allmsgs');
} else {
    module.exports = require('./generated/allmsgs_jp');
}