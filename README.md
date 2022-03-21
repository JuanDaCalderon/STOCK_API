# STOCK APP

## Install

Clone this repository on your local machine
```
git clone https://github.com/JuanDaCalderon/STOCK_API.git
```

### Requirements

- node.js v16.14.0
- npm 8.3.1
- mysql (Server, Workbench)

### Db

Create a new data base
```
CREATE DATABASE IF NOT EXISTS stock DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

You also can Execute "MAINdataBaseCreation.sql" in mysql workbench to create the data base
```

### Node.js

From the root folder, install node packages
```
npm install
```

Create the .env file and add configs

```

Change this if needed
```
NODE_ENV=development

PORT=3000

SENDGRID_API_KEY=*****************

DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD="000000"
DB_NAME=stock

RESET_PASSWORD_URL= "********************"
RESET_DB = false
PRIVATE_KEY = "*****************"
```

# Run the app
```
npm start
```

It will run on http://localhost:9000/
