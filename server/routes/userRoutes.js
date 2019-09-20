const router = require('express').Router();
const async = require('async');
const moment = require("moment");
const fs = require('fs');
const path = require('path');
const SHA1 = require("crypto-js/sha1");
const formidable = require('express-formidable');
const multer = require('multer');
const cloudinary = require('cloudinary');



cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});


// Middlewares
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Utils
const { sendEmail } = require('../utils/mail/index');

//Controller functionality
const {
    registerController,
    loginController,
    logoutController,
    authInfoController
  } = require('../controllers/userControllers');


/**
 * @route  GET api/users/auth
 * @desc   
 * @access private
 */
router.get('/api/users/auth', auth, authInfoController)


/**
 * @route  POST api/users/register
 * @desc   Register a new user
 * @access Public
 */
router.post('/api/users/register', registerController);


/**
 * @route  POST api/users/login
 * @desc   Send user info to server && check it valid or not.
 * @access Public
 */
router.post('/api/users/login', loginController)

/**
 * @route  GET api/users/logout
 * @desc   
 * @access private
 */
router.get('/api/users/logout', auth, logoutController);


/**
 * @route  POST api/users/reset_user
 * @desc   
 * @access public
 */
router.post('/api/users/reset_user', (req, res) => {
    User.findOne({
            'email': req.body.email
        },
        (err, user) => {
            user.generateResetToken((err, user) => {
                if (err) return res.json({
                    success: false,
                    err
                });
                sendEmail(user.email, user.name, null, "reset_password", user)
                return res.json({
                    success: true
                })
            })
        }
    )
})


/**
 * @route  POST api/users/reset_password
 * @desc   
 * @access public
 */
router.post('/api/users/reset_password', (req, res) => {

    var today = moment().startOf('day').valueOf();

    User.findOne({
        resetToken: req.body.resetToken,
        resetTokenExp: {
            $gte: today
        }
    }, (err, user) => {
        if (!user) return res.json({
            success: false,
            message: 'Sorry, token bad, generate a new one.'
        })

        user.password = req.body.password;
        user.resetToken = '';
        user.resetTokenExp = '';

        user.save((err, doc) => {
            if (err) return res.json({
                success: false,
                err
            });
            return res.status(200).json({
                success: true
            })
        })
    })
})


/**
 * @route  POST api/users/uploadimage
 * @desc   
 * @access public
 */
router.post('/api/users/uploadimage', auth, admin, formidable(), (req, res) => {
    cloudinary.uploader.upload(req.files.file.path, (result) => {
        console.log(result);
        res.status(200).send({
            public_id: result.public_id,
            url: result.url
        })
    }, {
        public_id: `${Date.now()}`,
        resource_type: 'auto'
    })
})


/**
 * @route  POST api/users/removeimage
 * @desc   
 * @access public
 */
router.get('/api/users/removeimage', auth, admin, (req, res) => {
    let image_id = req.query.public_id;

    cloudinary.uploader.destroy(image_id, (error, result) => {
        if (error) return res.json({
            succes: false,
            error
        });
        res.status(200).send('ok');
    })
})


/**
 * @route  POST api/users/addToCart
 * @desc   
 * @access private
 */
router.post('/api/users/addToCart', auth, (req, res) => {

    User.findOne({
        _id: req.user._id
    }, (err, doc) => {
        let duplicate = false;

        doc.cart.forEach((item) => {
            if (item.id == req.query.productId) {
                duplicate = true;
            }
        })

        if (duplicate) {
            User.findOneAndUpdate({
                    _id: req.user._id,
                    "cart.id": mongoose.Types.ObjectId(req.query.productId)
                }, {
                    $inc: {
                        "cart.$.quantity": 1
                    }
                }, {
                    new: true
                },
                () => {
                    if (err) return res.json({
                        success: false,
                        err
                    });
                    res.status(200).json(doc.cart)
                }
            )
        } else {
            User.findOneAndUpdate({
                    _id: req.user._id
                }, {
                    $push: {
                        cart: {
                            id: mongoose.Types.ObjectId(req.query.productId),
                            quantity: 1,
                            date: Date.now()
                        }
                    }
                }, {
                    new: true
                },
                (err, doc) => {
                    if (err) return res.json({
                        success: false,
                        err
                    });
                    res.status(200).json(doc.cart)
                }
            )
        }
    })
});


/**
 * @route  POST api/users/removeFromCart
 * @desc   
 * @access private
 */
router.get('/api/users/removeFromCart', auth, (req, res) => {

    User.findOneAndUpdate({
            _id: req.user._id
        }, {
            "$pull": {
                "cart": {
                    "id": mongoose.Types.ObjectId(req.query._id)
                }
            }
        }, {
            new: true
        },
        (err, doc) => {
            let cart = doc.cart;
            let array = cart.map(item => {
                return mongoose.Types.ObjectId(item.id)
            });

            Product.
            find({
                '_id': {
                    $in: array
                }
            }).
            populate('brand').
            populate('wood').
            exec((err, cartDetail) => {
                return res.status(200).json({
                    cartDetail,
                    cart
                })
            })
        }
    );
})


/**
 * @route  POST api/users/successBuy
 * @desc   
 * @access private
 */
router.post('/api/users/successBuy', auth, (req, res) => {
    let history = [];
    let transactionData = {}
    const date = new Date();
    const po = `PO-${date.getSeconds()}${date.getMilliseconds()}-${SHA1(req.user._id).toString().substring(0,8)}`

    // user history
    req.body.cartDetail.forEach((item) => {
        history.push({
            porder: po,
            dateOfPurchase: Date.now(),
            name: item.name,
            brand: item.brand.name,
            id: item._id,
            price: item.price,
            quantity: item.quantity,
            paymentId: req.body.paymentData.paymentID
        })
    })

    // PAYMENTS DASH
    transactionData.user = {
        id: req.user._id,
        name: req.user.name,
        lastname: req.user.lastname,
        email: req.user.email
    }
    transactionData.data = {
        ...req.body.paymentData,
        porder: po
    };
    transactionData.product = history;

    User.findOneAndUpdate({
            _id: req.user._id
        }, {
            $push: {
                history: history
            },
            $set: {
                cart: []
            }
        }, {
            new: true
        },
        (err, user) => {
            if (err) return res.json({
                success: false,
                err
            });

            const payment = new Payment(transactionData);
            payment.save((err, doc) => {
                if (err) return res.json({
                    success: false,
                    err
                });
                let products = [];
                doc.product.forEach(item => {
                    products.push({
                        id: item.id,
                        quantity: item.quantity
                    })
                })

                async.eachSeries(products, (item, callback) => {
                    Product.update({
                            _id: item.id
                        }, {
                            $inc: {
                                "sold": item.quantity
                            }
                        }, {
                            new: false
                        },
                        callback
                    )
                }, (err) => {
                    if (err) return res.json({
                        success: false,
                        err
                    });
                    sendEmail(user.email, user.name, null, "purchase", transactionData)
                    res.status(200).json({
                        success: true,
                        cart: user.cart,
                        cartDetail: []
                    })
                })
            });
        }
    )
});


/**
 * @route  POST api/users/update_profile
 * @desc   
 * @access private
 */
router.post('/api/users/update_profile', auth, (req, res) => {

    User.findOneAndUpdate({
            _id: req.user._id
        }, {
            "$set": req.body
        }, {
            new: true
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
    );
});


//=================================
//             ADMIN UPLOADS
//=================================

// STORAGE MULTER CONFIG
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`)
    },
    //   fileFilter:(req,file,cb)=>{

    //       const ext = path.extname(file.originalname)
    //       if(ext !== '.jpg' && ext !== '.png'){
    //           return cb(res.status(400).end('only jpg, png is allowed'),false);
    //       }

    //       cb(null,true)
    //   }
});

const upload = multer({
    storage: storage
}).single('file')

router.post('/api/users/uploadfile', auth, admin, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.json({
                success: false,
                err
            })
        }
        return res.json({
            success: true
        })
    })
})

router.get('/api/users/admin_files', auth, admin, (req, res) => {
    const dir = path.resolve(".") + '/uploads/';
    fs.readdir(dir, (err, items) => {
        return res.status(200).send(items);
    })
})

router.get('/api/users/download/:id', auth, admin, (req, res) => {
    const file = path.resolve(".") + `/uploads/${req.params.id}`;
    res.download(file)
})


module.exports = router;