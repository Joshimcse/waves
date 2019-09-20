/**
 * userController.js
 *
 * @module      :: Controller
 * @description :: defination of users routes action
 * @author      :: Joshim Uddin
 */

// Load Essential Model
const { User } = require("../models/user");
const { Payment } = require('../models/payment');

/**
 * @controller registerController
 * @desc register a users to the database...
 * @return
 */
const registerController = (req, res) => {
  const user = new User(req.body);
  user.save((err, doc) => {
      if (err) return res.json({
          success: false,
          err
      });
      sendEmail(doc.email, doc.name, null, "welcome");
      return res.status(200).json({
          success: true
      })
  })
}


/**
 * @controller loginController
 * @desc check provided info, If all information is valid then generated a token.
 * @return
 */
const loginController = (req, res) => {
  User.findOne({
      'email': req.body.email
  }, (err, user) => {
      if (!user) return res.json({
          loginSuccess: false,
          message: 'Auth failed, email not found'
      });

      user.comparePassword(req.body.password, (err, isMatch) => {
          if (!isMatch) return res.json({
              loginSuccess: false,
              message: 'Wrong password'
          });

          user.generateToken((err, user) => {
              if (err) return res.status(400).send(err);
              res.cookie('w_auth', user.token).status(200).json({
                  loginSuccess: true
              })
          })
      })
  })
}

/**
 * @controller logoutController
 * @desc
 * @return
 */
const logoutController = (req, res) => {
  User.findOneAndUpdate({
          _id: req.user._id
      }, {
          token: ''
      },
      (err, doc) => {
          if (err) return res.json({
              success: false,
              err
          });
          return res.status(200).send({
              success: true
          })
      }
  )
}

/**
 * @controller authInfoController
 * @desc
 * @return
 */
const authInfoController = (req, res) => {
  res.status(200).json({
      isAdmin: req.user.role === 0 ? false : true,
      isAuth: true,
      email: req.user.email,
      name: req.user.name,
      lastname: req.user.lastname,
      role: req.user.role,
      cart: req.user.cart,
      history: req.user.history
  })
}

/**
 * @controller 
 * @desc
 * @return
 */


/**
 * @controller 
 * @desc
 * @return
 */


/**
 * @controller 
 * @desc
 * @return
 */

/**
 * @controller 
 * @desc
 * @return
 */

/**
 * @controller 
 * @desc
 * @return
 */




module.exports = {
  registerController,
  loginController,
  logoutController,
  authInfoController
};