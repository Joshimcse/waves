/**
 * productRoutes.js
 *
 * @module      :: Routes
 * @description ::
 * @author      :: Joshim Uddin
 */
const router = require('express').Router();

// Load Essential Model
const { Product } = require('../models/product');

// Middlewares
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');


/**
 * @route  POST api/product/shop
 * @desc   Return a foods of array. if categories are define
 *         then produces categories wise foods and Default array size is 12
 * @access Public
 */
router.post('/api/product/shop',(req,res)=>{

  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100; 
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  for(let key in req.body.filters){
      if(req.body.filters[key].length >0 ){
          if(key === 'price'){
              findArgs[key] = {
                  $gte: req.body.filters[key][0],
                  $lte: req.body.filters[key][1]
              }
          }else{
              findArgs[key] = req.body.filters[key]
          }
      }
  }

  findArgs['publish'] = true;

  Product.
  find(findArgs).
  populate('brand').
  populate('wood').
  sort([[sortBy,order]]).
  skip(skip).
  limit(limit).
  exec((err,articles)=>{
      if(err) return res.status(400).send(err);
      res.status(200).json({
          size: articles.length,
          articles
      })
  })
})


/**
 * @route  GET api/product/articles?sortBy=createdAt&order=desc&limit=4
 * @param  sortBy {String} - [optional - defaul is _id]
 * @param  order {String} - [optional - defaul is asc]
 * @param  limit {Number} - [optional - defaul is 100]
 * @desc   Return products as array. Default array size is 100
 * @access Public
 */
router.get('/api/product/articles',(req,res)=>{
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 100;

  Product.
  find().
  populate('brand').
  populate('wood').
  sort([[sortBy,order]]).
  limit(limit).
  exec((err,articles)=>{
      if(err) return res.status(400).send(err);
      res.send(articles)
  })
})


/**
 * @route  GET api/product/articles_by_id?id=HSHSHSKSK,JSJSJSJS,SDSDHHSHDS,JSJJSDJ&type=single
 * @param  id {Strings as Comma Separated}
 * @param  type {String} - [There are two option]
 * @desc   Return a particular product by id.
 * @access Public
 */
router.get('/api/product/articles_by_id',(req,res)=>{
  let type = req.query.type;
  let items = req.query.id;

  if(type === "array"){
      let ids = req.query.id.split(',');
      items = [];
      items = ids.map(item=>{
          return mongoose.Types.ObjectId(item)
      })
  }

  Product.
  find({ '_id':{$in:items}}).
  populate('brand').
  populate('wood').
  exec((err,docs)=>{
      return res.status(200).send(docs)
  })
});


/**
 * @route  POST api/product/article
 * @desc   create a new product
 * @access private
 */
router.post('/api/product/article',auth,admin,(req,res)=>{
  const product = new Product(req.body);

  product.save((err,doc)=>{
      if(err) return res.json({success:false,err});
      res.status(200).json({
          success: true,
          article: doc
      })
  })
})

module.exports = router;