const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
	const user = new User({
		username: req.body.username,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password, 8) // Hash the password
	});

	// Save the user
	user.save((err, user) => {
		if (err) {
			res.status(500).send({ message: err });
			return;
		}

		// Assign role
		Role.findOne({ name: "user" }, (err, role) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}

			user.roles = [role._id];
			user.save(err => {
				if (err) {
					res.status(500).send({ message: err });
					return;
				}

				// Create token
				var token = jwt.sign({ id: user.id }, config.secret, {
					expiresIn: 86400 // 24 hours
				});

				// Response
				res.status(200).send({
					id: user._id,
					username: user.username,
					email: user.email,
					roles: user.roles,
					accessToken: token
				});
			});
		});
	});
};

exports.signin = (req, res) => {
	User.findOne({
		username: req.body.username
	})
		.populate("roles")
		.exec((err, user) => {
			if (err) {
				res.status(500).send({ message: err });
				return;
			}

			// Check if the user exist
			if (!user) {
				return res.status(404).send({ message: "User Not found." });
			}

			// Check if the password is valid
			var bIsValidPassword = bcrypt.compareSync(
				req.body.password,
				user.password
			);

			// throw error if the password is not valid
			if (!bIsValidPassword) {
				return res.status(401).send({
					accessToken: null,
					message: "Invalid Password!"
				});
			}

			// Create token
			var token = jwt.sign({ id: user.id }, config.secret, {
				expiresIn: 86400 // 24 hours
			});

			// Response
			res.status(200).send({
				id: user._id,
				username: user.username,
				email: user.email,
				roles: user.roles,
				accessToken: token
			});
		});
};
