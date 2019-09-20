/**
 * siteRoutes.js
 *
 * @module      :: Routes
 * @description ::
 * @author      :: Joshim Uddin
 */

const router = require('express').Router();
const mongoose = require('mongoose')

// Load Essential Model
const { Site } = require('../models/site');

// Middlewares
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');


/**
 * @route  GET api/site/site_data
 * @desc   Return siteinfo.
 * @access public
 */
router.get('/api/site/site_data',(req,res)=>{
  Site.find({},(err,site)=>{
      if(err) return res.status(400).send(err);
      res.status(200).send(site[0].siteInfo)
  });
});

/**
 * @route  POST api/site/site_data
 * @desc   Store siteInfo in database
 * @access private
 */
router.post('/api/site/site_data',auth,admin,(req,res)=>{
  Site.findOneAndUpdate(
      { name: 'Site'},
      { "$set": { siteInfo: req.body }},
      { new: true },
      (err,doc )=>{
          if(err) return res.json({success:false,err});
          return res.status(200).send({
              success: true,
              siteInfo: doc.siteInfo
          })
      }
  )
})

module.exports = router;