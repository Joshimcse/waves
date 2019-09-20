/**
 * woodRoutes.js
 *
 * @module      :: Routes
 * @description ::
 * @author      :: Joshim Uddin
 */

const router = require('express').Router();

// Load Essential Model
const { Wood } = require('../models/wood');

// Middlewares
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

/**
 * @route  POST /api/product/wood
 * @desc   Create a new woods
 * @access private
 */
router.post('/api/product/wood',auth,admin,(req,res)=>{
  const wood = new Wood(req.body);

  wood.save((err,doc)=>{
      if(err) return res.json({success:false,err});
      res.status(200).json({
          success: true,
          wood: doc
      })
  })
});

/**
 * @route  GET api/product/woods
 * @desc   Return all woods as array.
 * @access public
 */
router.get('/api/product/woods',(req,res)=>{
  Wood.find({},(err,woods)=>{
      if(err) return res.status(400).send(err);
      res.status(200).send(woods)
  })
})

module.exports = router;
