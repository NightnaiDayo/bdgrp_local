// @ts-ignore
const server = process.env.SERVER || 'TW';

switch (server) {
    case 'TW':
        module.exports = require('./generated/allmsgs_tw');
        break;
    case 'JP':
        module.exports = require('./generated/allmsgs_jp');
        break;
    case 'GL':
        module.exports = require('./generated/allmsgs_gl');
        break;
}