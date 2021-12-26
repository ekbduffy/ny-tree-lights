const express = require('express')
const path = require('path');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

let Jimp = require('jimp');

const leds = require("rpi-ws2801");

const ledsNumber = 50;

let imagePixels = [];


let displayingFrame = 0;
let framesTotal = 0;
let imageFile = 'image.jpg';

let imagesTimer = null;

const app = express()
const port = 3000

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'html');


// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', (req, res) => {
    res.render('index', {
        title: "NY Lights server",
        displayingFrame: displayingFrame,
        framesTotal: framesTotal,
        imageFile: imageFile
        });
})

app.post('/upload', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let image = req.files.image;
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            image.mv('./static/' + imageFile);

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: imageFile,
                    mimetype: image.mimetype,
                    size: image.size
                }
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// leds.connect(ledsNumber);


function displayImage() {
    
    if(displayingFrame >= framesTotal-1){
        displayingFrame = 0;
    } else {
        displayingFrame++;
    }
    console.log('displaying', displayingFrame);
    console.log(typeof imagePixels[displayingFrame]);
    if(imagePixels[displayingFrame] !== undefined){
        for( let i = 0; i < imagePixels[displayingFrame].length; i++){
           console.log(imagePixels[displayingFrame][i]);
        }
//    leds.update();
    } 
}


function prepareSending(imageName){
    Jimp.read('./static/'+imageName, (err, image) => {
        if (err) throw err;
        let height = image.getHeight();
        let width = image.getWidth();
        for(let i =0; i < height; i++){
            for(let j =0; j < width; j++){
                if(imagePixels[i] == undefined){
                    imagePixels[i] = [];
                }
                imagePixels[i][j] = image.getPixelColour(i,j);
            }   
        }
        if(imagesTimer){
            clearInterval(imagesTimer);
        }
        framesTotal = width;
        displayingFrame = 0;
        imagesTimer = setInterval(function(){ displayImage();}, 1000);
    });
}
//refreshImages

prepareSending(imageFile); 
