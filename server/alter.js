require('./src/db').query('ALTER TABLE "Hospital" ADD COLUMN "isGovernment" BOOLEAN DEFAULT false;').then(()=>console.log("Altered DB")).then(()=>process.exit(0)).catch(e=>console.error(e));
