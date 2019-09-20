/**
 * brandRoutes.js
 *
 * @module      :: Routes
 * @description ::
 * @author      :: Joshim Uddin
 */
const router = require('express').Router();

// Load Essential Model
const { Brand } = require('../models/brand');

// Middlewares
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

/**
 * @route  POST api/product/brand
 * @desc   create a new brand
 * @access private
 */
router.post('/api/product/brand',auth,admin,(req,res)=>{
  const brand = new Brand(req.body);

  brand.save((err,doc)=>{
      if(err) return res.json({success:false,err});
      res.status(200).json({
          success:true,
          brand: doc
      })
  })
})

/**
 * @route  GET api/product/brands
 * @desc   Return all brands as array.
 * @access Public
 */
router.get('/api/product/brands',(req,res)=>{
  Brand.find({},(err,brands)=>{
      if(err) return res.status(400).send(err);
      res.status(200).send(brands)
  })
})

module.exports = router;