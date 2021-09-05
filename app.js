'use strict'
require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {User} = require("./model/user");
const auth = require("./middleware/auth");
const request = require('request');
const https = require('https');
const fetch = require('node-fetch');
const url = require('url');
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  swaggerDefinition:{
    openapi:"3.0.1",
    info:{
        version:"1.0.0",
        title:"Wefox-Node-Assessment",
        description: "Check a small NodeJS assessment skills App, which contains Login, Register, Location-Verification, and Weather State",
        contact:{
            name:"Hekmatullah Ehsan",
            email:"hikmat_ehsan@live.com"
        }
    }
  }, 
  apis: ["app.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);




const app = express();

app.use(express.json({ limit: "50mb" }));
app.use('/api-docs',swaggerUI.serve,swaggerUI.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Register:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           description: Name of the user
 *         email:
 *           type: string
 *           description: Email of the user
 *         password:
 *           type: string
 *           description: Password of the user
 *       example:
 *         fullName: Ahmad
 *         email: example@domain.com
 *         password: "1234567"
 */
 
/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Register'
 *     responses:
 *       200:
 *         description: 
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Register'
 *       400:
 *         description: All parameters fullName, email, and password are required
 *       409:
 *         description: User Already Exist. Please Login
 */

app.post("/api/v1/register", async (req, res,next) => {
  try {
    // Get user input
    var { fullName, email, password } = req.body;

    // Validate user input
    if (!(email && password && fullName)) {
      res.status(400).json({message: "All parameters fullName, email, and password are required", code:400});
    }



    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
       res.status(409).json({message: "User Already Exist. Please Login", code:409});
    }

    //Encrypt user password
    var encryptedPassword =  await  bcrypt.hash(password.toString(), 10);

    // Create user in our database
    var user = await User.create({
      fullName,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Generate token
    user.token = app.tokenGeneration(user._id, email);
    delete user.password;
    res.status(201).json({token:user.token, email:user.email});
  } catch (err) {
    // console.log(err);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: Email of the user
 *         password:
 *           type: string
 *           description: Password of the user
 *       example:
 *         email: example@domain.com
 *         password: "1234567"
 */

/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Login the user into system
 *     tags: [Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: 
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Login'
 *       400:
 *         description: All parameters email and password are required/Invalid Credentials
 *              
 */
app.post("/api/v1/login", async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).json({message: "Email and password are required", code:400});
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      user.token = app.tokenGeneration(user._id, email);
      delete user.password;
      // user
      res.status(200).json({token:user.token, email:user.email});
    }
    res.status(400).json({message:"Invalid Credentials" , code:400 });
  } catch (err) {
    // console.log(err);
  }
});

app.tokenGeneration = function(user_id, email){
  const token = jwt.sign(
    { 
      user_id: user_id,
      email
    },
    process.env.TOKEN_KEY,
    {
      expiresIn: "10h",
    }
  );
  return token;
}


/**
 * @swagger
 * /api/v1/homepage:
 *   get:
 *     summary: The homepage of the application
 *     parameters:
 *      - in: query
 *        name: token
 *        type: string
 *        description: The JWT token is required for accessing the page.
 *     tags: [Welcome]
 *     responses:
 *       200:
 *         description: This is the dashboard of this mini system.
 *       403:
 *         description: A token is required for authentication
 *       401:
 *         description: Invalid Token
 *              
 */
app.get("/api/v1/homepage", auth, (req, res) => {
  res.status(200).send(`This is the dashboard of this mini system.`);
});

/**
 * @swagger
 * /api/v1/validate-address:
 *   get:
 *     summary: Validate an address through google map
 *     parameters:
 *      - in: query
 *        name: city
 *        type: string
 *      - in: query
 *        name: street
 *        type: string
 *      - in: query
 *        name: town
 *        type: string
 *      - in: query
 *        name: postalCode
 *        type: string
 *      - in: query
 *        name: country
 *        type: string
 *     tags: [Address]
 *     responses:
 *       200:
 *         description: details of the address
 *       400:
 *         description: Please provide any of these street, streetNumber, town, postalCode and country 
 *       404:
 *         description: Wrong Address
 *              
 */
app.get("/api/v1/validate-address", (req,res)=>{
  let params = url.parse(req.url,true).query;
  params = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  
  if(Object.keys(params).length==0){
    res.status(400).json({"message":"Please provide address any parameters, e.g: city: Kabul, country: Afghanistan", code:400});
  }

  params = params+`&format=json`;

  fetch('https://nominatim.openstreetmap.org/search?'+params)
      .then(res => res.json())
      .then(json => {
        if(json.length==0){
          return res.status(404).json({"message":"Wrong Address", code:404});
        }else{
          console.log('json :', json);
          res.send(json);
        }
  });

});

/**
 * @swagger
 * components:
 *   schemas:
 *     Weather:
 *       type: object
 *       required:
 *         - lat
 *         - lon
 *       properties:
 *         lat:
 *           type: number
 *           description: latitude of the address
 *         lon:
 *           type: number
 *           description: longitude of the address
 *       example:
 *         lat: 52.5096454
 *         lon: 13.5189826
 */
/**
 * @swagger
 * /api/v1/state-weather-info:
 *   post:
 *     summary: Retrieve weather information of the location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Weather'
 *     parameters:
 *      - in: query
 *        name: token
 *        type: string
 *     tags: [Weather]
 *     responses:
 *       200:
 *         description: A complete object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Register'
 *       401:
 *         description: Invalid Token
 *       403:
 *         description: A token is required for authentication 
 *       404:
 *         description: This address parameters are wrong
 *              
 */
app.post("/api/v1/state-weather-info", auth, (req,res)=>{
  const { lat, lon } = req.body;

  // Validate lon and lat parameters
  if (!(lat && lon)) {
    res.status(400).json({message: "lat and lon are required", code:400});
  }

  const params = `lat=${lat}&lon=${lon}`;

  fetch(`https://api.openweathermap.org/data/2.5/weather?${params}&appid=${process.env.OPEN_WEATHER_API_ID}`)
      .then(res => res.json())
      .then(json => {
        if(json.length==0){
          return res.status(404).json({"message":"This address parameters are wrong", code:404});
        }else{
          res.send(json);
        }
  });

});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});


module.exports = app;
