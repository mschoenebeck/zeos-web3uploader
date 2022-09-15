// https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/JavaScript-Nodejs-File-Upload-Example-Ajax

var http = require('http');
let formidable = require('formidable');
let fs = require('fs');

const { createClient } = require('@liquidapps/dapp-client');
const fetch = require('isomorphic-fetch');
const endpoint = "https://kylin-dsp-1.liquidapps.io";
const getClient = () => createClient( { network:"kylin", httpEndpoint: endpoint, fetch });

var request = require('request');

http.createServer(function (req, res)
{
  if(req.url == '/')
  {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><head><script src="https://www.google.com/recaptcha/api.js"></script></head><body><h3>Upload to LiquidStorage:</h3><form action="/upload" method="post" enctype="multipart/form-data"><input type="file" name="fileupload">(20 MB file size limit)<br><div class="g-recaptcha" data-sitekey="6Ley7YEhAAAAAKL3wJ-dL_K_s3Vgekgmi1bxbKjj"></div><br><input type="submit"></form></body></html>');
  }

  if(req.url == '/upload')
  {
    // create an instance of the form object
    let options = {
      // set file size limit (20 MB)
      maxFileSize: 20 * 1024 * 1024
    };
    let form = new formidable.IncomingForm(options);
    form.on('error', (err) => {
      console.log(err);
    });
    form.parse(req, function (error, fields, file)
    {
      // check captcha (code from: https://codeforgeek.com/google-recaptcha-node-js-tutorial/)
      // g-recaptcha-response is the key that browser will generate upon form submit.
      // if its blank or null means user has not selected the captcha, so return the error.
      if(fields['g-recaptcha-response'] === undefined || fields['g-recaptcha-response'] === '' || fields['g-recaptcha-response'] === null)
      {
        res.write('{"responseCode" : 1, "responseDesc" : "Please select captcha"}');
        res.end();
        return;
      }
      // Put your secret key here.
      var secretKey = "RECAPTCHA_SECRET_KEY";
      // req.connection.remoteAddress will provide IP address of connected user.
      var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + fields['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
      // Hitting GET request to the URL, Google will respond with success or error scenario.
      request(verificationUrl, function(error, response, body)
      {
        body = JSON.parse(body);
        // Success will be true or false depending upon captcha validation.
        if(body.success !== undefined && !body.success)
        {
          res.write('{"responseCode" : 1,"responseDesc" : "Failed captcha verification"}');
          res.end();
          return;
        }
      });

      // upload file
      let filepath = file.fileupload.filepath;
      let newpath = '/tmp/web3/';
      newpath += file.fileupload.originalFilename;

      // copy the uploaded file to a custom folder
      fs.rename(filepath, newpath, async function () {
        (async () => {
        const service = await (await getClient()).service('storage', "zeosweb3apps");
        const data = fs.readFileSync(newpath);
        const key = "EOS_PRIVATE_KEY";
        const permission = "active";
        const options = {
          // if true, DAG leaves will contain raw file data and not be wrapped in a protobuf
          rawLeaves: true
        };
        const response = await service.upload_public_file(
            data,
            key,
            permission,
            null,
            options
        );
        console.log(`response uri: ${response.uri}`);
        res.write('File Upload Success!\n' + `response uri: \n${response.uri}`);
        res.end();
        })().catch((e) => { console.log(e); res.write(e); res.end(); });
      });
    });
  }

}).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');
