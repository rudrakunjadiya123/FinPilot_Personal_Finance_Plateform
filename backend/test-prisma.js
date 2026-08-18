const prisma = require('./src/config/db');
const pdf = require('pdf-parse');

(async () => {
   console.log('pdf type:', typeof pdf);
   if (typeof pdf !== 'function') {
      console.log('pdf exported keys:', Object.keys(pdf));
   }
   
   console.log('transaction exists?', !!prisma.transaction);
   if (prisma.transaction) {
      try {
         const count = await prisma.transaction.count();
         console.log('transaction count:', count);
      } catch(e) {
         console.log('transaction error:', e.message);
      }
   }
   process.exit(0);
})();
