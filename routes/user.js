const connection = require('../config/connectionDB');
const express = require('express');
const Router = express.Router();
const { uuid } = require('uuidv4');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
Router.post(
  '/register',
  [
    check('username', 'username is required').not().isEmpty(),
    // username must be an email
    check('email').isEmail(),
    // password must be at least 5 chars long
    check('password').isLength({ min: 5 }).not().isEmpty(),
    check('phone').isLength({ max: 15 }).isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const userid = uuid();
    const { username, phone, password, email } = req.body;
    const url = gravatar.url(email, { s: '200', r: 'pg', d: '404' });
    const token = jwt.sign(
      {
        data: userid,
      },
      config.get('secret'),
      { expiresIn: '50h' }
    );
    const user = {
      iduser: userid,
      username: username,
      phone: phone,
      password: password,
      email: email,
      avatar: url,
    };
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    connection.query('INSERT INTO user SET ?', user, function (
      err,
      results,
      fields
    ) {
      if (!err) {
        res.status(200).json({ token: token });
      } else {
        res.status(500).json({ msg: 'can not create account' });
      }
    });
  }
);
Router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  connection.query(
    'SELECT * FROM `user` WHERE `username` = ?',
    [username],
    function (error, results, fields) {
      if (!error) {
        bcrypt.compare(password, results[0].password, function (err, check2) {
          if (!err) {
            if (check2 === true) {
              const token = jwt.sign(
                {
                  data: results[0].iduser,
                },
                config.get('secret'),
                { expiresIn: '50h' }
              );
              res.status(200).json({ token: token });
            } else {
              res.status(500).json({ msg: 'invalid password' });
            }
          } else {
            res.status(500).json({ msg: 'invalid password' });
          }
        });
      } else {
        res.status(500).json({ msg: 'can not find that user' });
      }
    }
  );
});
Router.get('/auth', auth, async (req, res) => {
  connection.query(
    'SELECT * FROM `user` WHERE `iduser` = ?',
    [req.user.data],
    function (error, results, fields) {
      if (!error) {
        delete results[0].password;
        res.status(200).json(results);
      } else {
        res.status(500).json({ msg: 'token expired' });
      }
    }
  );
});
module.exports = Router;
