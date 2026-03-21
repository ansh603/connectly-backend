import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import database from './src/common/config/db.config.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import config from './src/common/config/env.config.js';
import path from 'path';
import {createServer} from 'http';
import userRoute from './src/api/user/index.js';
import globalRoute from './src/api/global/index.js'
import adminRoute from './src/api/admin/index.js'
import supportRoute from './src/api/support/index.js'
import walletRoute from './src/api/wallet/index.js'
import bookingRoute from './src/api/booking/index.js'
import notificationRoute from './src/api/notification/index.js'

const app = express();

const server = createServer(app);

app.use(cors());
app.use(bodyParser.json());

// file upload on local
app.use('/assets', express.static('assets'));

// Serve static files from src/templates 
app.use("/templates", express.static(path.join(process.cwd(), "src/templates")));

// swagger for API documentation
const swaggerSpec = JSON.parse(fs.readFileSync(new URL('./swagger.json', import.meta.url)));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get('/', (req, res) => {
    res.json({message: "Hello from the server"});
})

// routes
app.use('/global', globalRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.use("/support", supportRoute);
app.use("/wallet", walletRoute);
app.use("/bookings", bookingRoute);
app.use("/notifications", notificationRoute);

// database connectivity (models connect on first use)
const dbUrl = database.url || '';
const safeUrl = dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':****@') : 'not configured';
console.log(`Database: ${safeUrl}`)

// server
server.listen(config.PORT, config.HOST, () =>{
    console.log(`Server is running on http://${config.HOST}:${config.PORT}`);
})