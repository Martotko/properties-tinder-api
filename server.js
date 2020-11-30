const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");
const bcrypt = require("bcryptjs");
const app = express();

var corsOptions = {
	origin: "http://localhost:3000"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const db = require("./app/models");
const Role = db.role;
const User = db.user;

db.mongoose
	.connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log("Successfully connect to MongoDB.");
		initial();
	})
	.catch(err => {
		console.error("Connection error", err);
		process.exit();
	});

// simple route
app.get("/", (req, res) => {
	res.json({ message: "Welcome to bezkoder application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});

/**
 * Creates initial roles
 */
async function initial() {
	var user;
	await Role.estimatedDocumentCount((err, count) => {
		if (!err && count === 0) {
			new Role({
				name: "user"
			}).save(err => {
				if (err) {
					console.log("error", err);
				}

				console.log("added 'user' to roles collection");
			});

			new Role({
				name: "admin"
			}).save(err => {
				if (err) {
					console.log("error", err);
				}

				console.log("added 'admin' to roles collection");
			});
		}
	});

	user = await Role.findOne({ name: "user" }).exec();

	User.estimatedDocumentCount((err, count) => {
		if (!err && count === 0) {
			new User({
				username: "Test1234",
				email: "test@test.com",
				password: bcrypt.hashSync("Test1234", 8),
				phone: "0898624238",
				roles: [user]
			}).save(err => {
				if (err) {
					console.log("error", err);
				}

				console.log("added test user");
			});
		}
	});
}