require('dotenv').config();
const prisma = require('./src/config/db');
const { ask } = require('./src/controllers/chat.controller');

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("No user found.");
    
    console.log("Testing chat for user:", user.id);
    
    const req = {
        userId: user.id,
        body: { message: "Hello, what is my net worth?" }
    };
    
    const res = {
        status: (code) => {
            console.log("Status:", code);
            return { json: (data) => console.log("JSON Response:", JSON.stringify(data, null, 2)) };
        }
    };
    
    try {
        await ask(req, res);
    } catch (err) {
        console.error("ASK FUNCTION THREW AN ERROR:");
        console.error(err);
    }
}
main().then(() => process.exit(0)).catch(console.error);
