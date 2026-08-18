require('dotenv').config();
const prisma = require('./src/config/db');
async function main() {
    const uploads = await prisma.statementUpload.findMany();
    console.log("Uploads:", uploads);
    const txs = await prisma.transaction.findMany();
    console.log("Total txs:", txs.length);
    if (txs.length) {
        console.log("Sample tx:", txs[txs.length - 1]);
    }
}
main().catch(console.error);
