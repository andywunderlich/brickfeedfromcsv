'use strict';

const { Product, ProductPrice, ProductShipping, FeedBuilder } = require('node-product-catalog-feed');
const fs = require('fs');
const { parse } = require("csv-parse");

const xmlFeed = new FeedBuilder()
.withTitle('Brickscout Shopping') 
.withLink('https://www.brickscout.com')
.withDescription('Brickscout shopping products');

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

var eanList = []

/* 
    0 g:id -> ean
    1 title -> name
    2 g:description -> description
    3 link -> url
    4 g:image_link -> image
    5 g:availability -> availability
    6 g:price -> price
    7 g:google_product_category -> category
    8 g:product_type -> productType
    9 g:brand -> brand
    10 g:mpn -> mpn
    11 g:color -> color
*/
var readEansWithCategory = async (file) => {
    await fs.createReadStream("./"+file)
    .pipe(parse({ delimiter: ";", from_line: 2 }))
    .on("data", async function (row) {
        eanList.push({ 
            ean: row[0],
            name: row[1],
            description: row[2],
            url: row[3],
            image: row[4],
            availability: row[5],
            price: row[6],
            category: row[7],
            productType: row[8],
            brand: row[9],
            mpn: row[10],
            color: row[11]   
        })
    })
    .on("end", () => {
        getData();
     });    
}

var getData = () => {
    
    eanList.forEach((item) => {
        //console.log(item.ean)

        var itemdata = {
            name: item.name,
            image: item.image,
            description: item.description,
            brand: item.brand,
            sku: item.ean,
            category: item.category, // product category (1254)
            mpn: item.mpn,
            color: item.color,
            priceCurrency: 'EUR', 
            price: item.price,
            url: item.url,
            availability: item.availability,
            itemCondition: 'NewCondition', 
            productType: item.productType
        }
        buildXML(itemdata);
    });

    var xmlResult = xmlFeed.buildXml();

    fs.writeFileSync('feed.xml', xmlResult);
    console.log("feed.xml generated")
}

var buildXML = (data) => {
    const modelX = new Product();

    modelX.id = data.sku;
    modelX.title = data.name;
    modelX.brand = data.brand;
    modelX.condition = data.itemCondition;
    modelX.availability = data.availability;
    modelX.price = new ProductPrice(parseFloat(data.price), data.priceCurrency); // price, priceCurrency
    modelX.link = data.url;
    modelX.mpn = data.mpn;
    modelX.imageLink = data.image;
    modelX.description = data.description;
    modelX.googleProductCategory = 1254;
    modelX.color = data.color;
    modelX.productType = data.productType; //data.category;
    xmlFeed.withProduct(modelX)

    
}


//

var cmd = process.argv[2]; 
var file = process.argv[3];

//console.log(process.argv)
if (cmd != '-f') {
    console.log("Please use -f for file and then the csv filename")
}
if (file == undefined) {
    console.log("Filename missing")
}

if (cmd == '-f' && file != undefined) {
    console.log("Process file " + file);
    readEansWithCategory(file);
}